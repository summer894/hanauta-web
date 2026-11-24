import { useEffect, useRef, useState } from 'react'

function fmt(s) {
  if (!isFinite(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function AudioPlayer({ src }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)

  useEffect(() => {
    const a = ref.current
    if (!a) return
    const onTime = () => setCur(a.currentTime)
    const onMeta = () => setDur(a.duration)
    const onEnd = () => { setPlaying(false); setCur(0) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('durationchange', onMeta)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('durationchange', onMeta)
      a.removeEventListener('ended', onEnd)
    }
  }, [src])

  function toggle() {
    const a = ref.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  function seek(e) {
    const a = ref.current
    if (!a || !isFinite(a.duration)) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration
  }

  const pct = dur ? (cur / dur) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <audio ref={ref} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: 'linear-gradient(135deg, #7fb2ff, #a58bff)', boxShadow: '0 3px 10px rgba(127,178,255,0.5)' }}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <div onClick={seek} className="h-2 flex-1 cursor-pointer rounded-full" style={{ background: 'rgba(127,178,255,0.25)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7fb2ff, #a58bff)' }} />
      </div>
      <span className="w-16 text-right text-[11px] tabular-nums" style={{ color: '#6b7fb8' }}>{fmt(cur)} / {fmt(dur)}</span>
    </div>
  )
}