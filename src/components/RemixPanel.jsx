import { useEffect, useRef, useState } from 'react'
import { BASE_URL } from '../api'
import UserAvatar from './UserAvatar'
import LineIcon from './LineIcon'

const NAVY   = '#27407f'
const SUB    = '#6b7fb8'
const ACCENT = 'linear-gradient(135deg, #7fb2ff, #a58bff)'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

const AVATAR_COLORS = [
  '#f6b7d6', '#9cc5ff', '#a8e6c1', '#ffd88a',
  '#c9b8ff', '#ffb98a', '#ff9fb2', '#8fd8f5',
]

const audioSrc = (url) => (url?.startsWith('http') ? url : `${BASE_URL}${url}`)

export default function RemixPanel({ parts, onClear }) {
  const [enabled, setEnabled] = useState(() => parts.map((p) => p.id))
  const [playing, setPlaying] = useState(false)
  const [error, setError]     = useState('')
  const audiosRef = useRef([])

  function stopAll() {
    audiosRef.current.forEach((a) => { a.pause(); a.currentTime = 0 })
    audiosRef.current = []
    setPlaying(false)
  }

  // 画面を離れるときに音を止める
  useEffect(() => () => {
    audiosRef.current.forEach((a) => a.pause())
  }, [])

  function toggle(id) {
    stopAll()
    setEnabled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function playMix() {
    if (playing) { stopAll(); return }
    setError('')

    const targets = parts.filter((p) => enabled.includes(p.id) && p.audio)
    if (targets.length === 0) {
      setError('再生できる音源が選ばれていません')
      return
    }

    let finished = 0
    const done = () => {
      finished += 1
      if (finished === targets.length) stopAll()
    }
    const list = targets.map((p) => {
      const a = new Audio(audioSrc(p.audio))
      a.onended = done
      return a
    })
    audiosRef.current = list
    setPlaying(true)

    const results = await Promise.allSettled(list.map((a) => a.play()))
    const failed = results.filter((r) => r.status === 'rejected').length
    // 再生できなかった音は「終わった」ことにして、残りを最後まで鳴らす
    for (let i = 0; i < failed; i++) done()
    if (failed === list.length) setError('音源を再生できませんでした')
    else if (failed > 0) setError('一部の音源は再生できませんでした')
  }
  if (!parts || parts.length === 0) return null

  return (
    <div
      className="p-4"
      style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.85)',
        borderRadius: 24,
        boxShadow: '0 4px 20px rgba(90,110,200,0.12)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-black" style={{ color: NAVY, ...NUNITO }}>
            選んだ音源でセッション
          </p>
          <p className="text-[11px]" style={{ color: SUB }}>
            オンにした音源を同時に再生できます
          </p>
        </div>
        <button
          onClick={() => { stopAll(); onClear && onClear() }}
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: 'rgba(0,0,0,0.05)', color: '#8c98bd' }}
        >
          解除
        </button>
      </div>

      <div className="space-y-2">
        {parts.map((p, i) => {
          const on = enabled.includes(p.id)
          const name = p.username || p.user || 'unknown'
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition"
              style={{
                background: on ? 'rgba(127,178,255,0.18)' : 'rgba(255,255,255,0.6)',
                border: on ? '1.5px solid #7fb2ff' : '1.5px solid rgba(255,255,255,0.9)',
                opacity: on ? 1 : 0.65,
              }}
            >
<div style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
  <UserAvatar name={name} index={i} fill radius={0} />
</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black" style={{ color: NAVY, ...NUNITO }}>
                  {name} の {p.instrument}
                </p>
                {!p.audio && (
                  <p className="text-[10px]" style={{ color: '#d9822b' }}>音源がありません</p>
                )}
              </div>
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ background: on ? ACCENT : '#cfd6ea' }}
              >
                {on ? '✓' : ''}
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ background: 'rgba(255,111,168,0.12)', color: '#e0457f' }}>
          <LineIcon name="alert" size={14} color="#e0457f" /> {error}
        </p>
      )}

      <button
        onClick={playMix}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-black text-white transition hover:opacity-90"
        style={{ background: ACCENT, boxShadow: '0 6px 18px rgba(127,178,255,0.5)', ...NUNITO }}
      >
        {playing ? '■ 停止' : '▶ まとめて再生'}
      </button>
      <p className="mt-2 text-center text-[10px]" style={{ color: '#9aa5c4' }}>
        複数の音を同時に鳴らすため、開始がわずかにずれることがあります
      </p>
    </div>
  )
}