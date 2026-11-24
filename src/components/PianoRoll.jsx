import { useEffect, useRef, useState } from 'react'

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BLACK = [1, 3, 6, 8, 10]
const pname = (p) => NAMES[p % 12] + (Math.floor(p / 12) - 1)
const mtof = (p) => 440 * Math.pow(2, (p - 69) / 12)

const ROW = 18      // 1音の高さ(px)
const PPS = 110     // 1秒の幅(px)
const G = 40        // 左の音名の幅
const TOP = 16      // 上の時間軸の高さ
const SNAP = 0.05   // 時間の吸着(秒)
const MIN_LEN = 0.05
const snap = (t) => Math.round(t / SNAP) * SNAP
const DRUMS = ['kick', 'snare', 'hihat']
const DRUM_PITCH = { kick: 36, snare: 38, hihat: 42 }

let uid = 1
const withIds = (ns) => ns.map((n) => ({ ...n, id: uid++ }))
const strip = (ns) =>
  ns.map(({ id, ...r }) => ({
    ...r,
    start: +r.start.toFixed(3),
    end: +r.end.toFixed(3),
    name: pname(r.pitch),
  }))

const btn = {
  background: 'rgba(255,255,255,0.8)',
  color: '#4a78d4',
  border: '1px solid rgba(127,178,255,0.4)',
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 800,
}

export default function PianoRoll({ notes, partType = 'guitar', onChange }) {
  const [items, setItems] = useState(() => withIds(notes))
  const [sel, setSel] = useState(null)
  const [playT, setPlayT] = useState(null)

  const itemsRef = useRef(items)
  itemsRef.current = items
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const drag = useRef(null)
  const history = useRef([])
  const ctxRef = useRef(null)
  const rafRef = useRef(null)
  const oscRef = useRef([])
  const isDrum = DRUMS.includes(partType)

  // ---- 表示範囲 ----
  const ps = items.map((n) => n.pitch)
  const lo = Math.max(0, (ps.length ? Math.min(...ps) : 56) - 4)
  let hi = Math.min(127, (ps.length ? Math.max(...ps) : 68) + 4)
  if (hi - lo < 13) hi = Math.min(127, lo + 13)
  const dur = Math.max(3, ...items.map((n) => n.end)) + 0.5
  const W = G + dur * PPS
  const H = TOP + (hi - lo + 1) * ROW

  // ---- 履歴と確定 ----
  const push = () => {
    history.current.push(itemsRef.current)
    if (history.current.length > 50) history.current.shift()
  }
  const commit = (next) => {
    setItems(next)
    onChangeRef.current && onChangeRef.current(strip(next))
  }

  // ---- 音を鳴らす(確認用の簡易シンセ) ----
  const ac = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctxRef.current
  }
  function tone(pitch, start, len, vel = 100) {
    const c = ac()
    const t0 = c.currentTime + start
    const o = c.createOscillator()
    const g = c.createGain()
    let l = len
    if (isDrum) {
      o.type = partType === 'hihat' ? 'square' : 'sine'
      o.frequency.value = partType === 'kick' ? 70 : partType === 'snare' ? 190 : 7000
      l = 0.12
    } else {
      o.type = 'triangle'
      o.frequency.value = mtof(pitch)
    }
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(0.2 * (vel / 127), t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.1, l))
    o.connect(g)
    g.connect(c.destination)
    o.start(t0)
    o.stop(t0 + l + 0.05)
    oscRef.current.push(o)
  }
  function stop() {
    cancelAnimationFrame(rafRef.current)
    oscRef.current.forEach((o) => { try { o.stop() } catch {} })
    oscRef.current = []
    setPlayT(null)
  }
  function play() {
    if (playT !== null) { stop(); return }
    const c = ac()
    c.resume()
    const list = itemsRef.current
    list.forEach((n) => tone(n.pitch, n.start, n.end - n.start, n.velocity))
    const total = Math.max(0, ...list.map((n) => n.end)) + 0.2
    const t0 = c.currentTime
    const tick = () => {
      const t = c.currentTime - t0
      if (t >= total) { stop(); return }
      setPlayT(t)
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  // ---- ドラッグ操作 ----
  useEffect(() => {
    const mv = (e) => {
      const d = drag.current
      if (!d) return
      const dt = (e.clientX - d.x0) / PPS
      const dp = -Math.round((e.clientY - d.y0) / ROW)
      setItems((prev) =>
        prev.map((n) => {
          if (n.id !== d.id) return n
          if (d.mode === 'resize') {
            return { ...n, end: Math.max(d.n.start + MIN_LEN, snap(d.n.end + dt)) }
          }
          const len = d.n.end - d.n.start
          const start = Math.max(0, snap(d.n.start + dt))
          const pitch = isDrum ? d.n.pitch : Math.max(0, Math.min(127, d.n.pitch + dp))
          return { ...n, start, end: start + len, pitch }
        })
      )
    }
    const up = () => {
      if (!drag.current) return
      drag.current = null
      onChangeRef.current && onChangeRef.current(strip(itemsRef.current))
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
  }, [isDrum])

  function startDrag(e, n, mode) {
    e.stopPropagation()
    push()
    setSel(n.id)
    drag.current = { id: n.id, mode, x0: e.clientX, y0: e.clientY, n: { ...n } }
    if (mode === 'move') tone(n.pitch, 0, 0.25, n.velocity)
  }

  // ---- 空きをクリックして音を足す ----
  function addAt(e) {
    const r = e.currentTarget.ownerSVGElement.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (x < G || y < TOP) return
    const start = Math.max(0, snap((x - G) / PPS))
    const pitch = isDrum
      ? DRUM_PITCH[partType]
      : Math.max(0, Math.min(127, hi - Math.floor((y - TOP) / ROW)))
    push()
    const n = { id: uid++, start, end: start + 0.3, pitch, velocity: 100 }
    commit([...itemsRef.current, n])
    setSel(n.id)
    tone(pitch, 0, 0.25)
  }

  // ---- 操作ボタン ----
  function del() {
    if (sel == null) return
    push()
    commit(items.filter((n) => n.id !== sel))
    setSel(null)
  }
  function transpose(d) {
    if (isDrum) return
    push()
    commit(items.map((n) => ({ ...n, pitch: Math.max(0, Math.min(127, n.pitch + d)) })))
  }
  function stretch(f) {
    push()
    commit(items.map((n) => ({ ...n, start: n.start * f, end: n.end * f })))
  }
  function undo() {
    const p = history.current.pop()
    if (p) commit(p)
  }
  function reset() {
    push()
    commit(withIds(notes))
    setSel(null)
  }

  // ---- キーボード ----
  useEffect(() => {
    const key = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel != null) { e.preventDefault(); del() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })
  useEffect(() => () => stop(), [])

  const rows = []
  for (let p = hi; p >= lo; p--) rows.push(p)

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        <button style={btn} onClick={play}>{playT !== null ? '■ 停止' : '▶ 再生'}</button>
        <button style={btn} onClick={undo}>元に戻す</button>
        <button style={btn} onClick={del} disabled={sel == null}>選んだ音を削除</button>
        {!isDrum && (
          <>
            <button style={btn} onClick={() => transpose(1)}>全体 +1半音</button>
            <button style={btn} onClick={() => transpose(-1)}>全体 -1半音</button>
            <button style={btn} onClick={() => transpose(12)}>+1オクターブ</button>
            <button style={btn} onClick={() => transpose(-12)}>-1オクターブ</button>
          </>
        )}
        <button style={btn} onClick={() => stretch(1.1)}>ゆっくり</button>
        <button style={btn} onClick={() => stretch(0.9)}>速く</button>
        <button style={btn} onClick={reset}>最初の状態に戻す</button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 16, background: 'rgba(255,255,255,0.7)' }}>
        <svg width={W} height={H} style={{ display: 'block', touchAction: 'none', userSelect: 'none' }}>
          {/* 行 */}
          {rows.map((p) => {
            const y = TOP + (hi - p) * ROW
            return (
              <g key={p}>
                <rect x={G} y={y} width={W - G} height={ROW}
                  fill={BLACK.includes(p % 12) ? 'rgba(127,178,255,0.14)' : 'rgba(255,255,255,0.5)'} />
                <line x1={G} x2={W} y1={y} y2={y} stroke="rgba(127,140,200,0.18)" />
                <text x={6} y={y + 13} fontSize={p % 12 === 0 ? 10 : 9}
                  fontWeight={p % 12 === 0 ? 700 : 400} fill="#6b7fb8">
                  {BLACK.includes(p % 12) ? '' : pname(p)}
                </text>
              </g>
            )
          })}
          {/* 時間の線 */}
          {Array.from({ length: Math.ceil(dur * 2) }, (_, i) => (
            <g key={i}>
              <line x1={G + (i / 2) * PPS} x2={G + (i / 2) * PPS} y1={TOP} y2={H}
                stroke={i % 2 === 0 ? 'rgba(127,140,200,0.4)' : 'rgba(127,140,200,0.15)'} />
              {i % 2 === 0 && (
                <text x={G + (i / 2) * PPS + 3} y={11} fontSize={10} fill="#6b7fb8">{i / 2}s</text>
              )}
            </g>
          ))}
          {/* 空きクリック用 */}
          <rect x={G} y={TOP} width={W - G} height={H - TOP} fill="transparent" onPointerDown={addAt} />
          {/* ノート */}
          {items.map((n) => {
            const x = G + n.start * PPS
            const y = TOP + (hi - n.pitch) * ROW + 1
            const w = Math.max(6, (n.end - n.start) * PPS)
            const on = n.id === sel
            return (
              <g key={n.id}>
                <rect x={x} y={y} width={w} height={ROW - 2} rx={4}
                  fill={on ? '#a58bff' : '#7fb2ff'} stroke={on ? '#6d4fe0' : '#4a78d4'}
                  style={{ cursor: 'grab' }} onPointerDown={(e) => startDrag(e, n, 'move')} />
                {w > 34 && (
                  <text x={x + 5} y={y + 12} fontSize={10} fill="#fff" pointerEvents="none">{pname(n.pitch)}</text>
                )}
                <rect x={x + w - 7} y={y} width={7} height={ROW - 2} rx={3}
                  fill="rgba(255,255,255,0.55)" style={{ cursor: 'ew-resize' }}
                  onPointerDown={(e) => startDrag(e, n, 'resize')} />
              </g>
            )
          })}
          {/* 再生位置 */}
          {playT !== null && (
            <line x1={G + playT * PPS} x2={G + playT * PPS} y1={TOP} y2={H} stroke="#ff6fa8" strokeWidth={2} />
          )}
        </svg>
      </div>

      <p className="mt-2 text-[11px]" style={{ color: '#6b7fb8' }}>
        音をドラッグで移動、右端で長さ変更、空きをクリックで追加、Delete で削除、Ctrl+Z で元に戻す
      </p>
    </div>
  )
}