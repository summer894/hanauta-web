import LineIcon from './LineIcon'

const shimmer = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.45) 25%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.45) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
}

export function SkeletonCard() {
  return (
    <div
      className="mb-3 flex gap-3"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(255,255,255,0.85)',
        borderRadius: 22,
        padding: 12,
      }}
    >
      <div style={{ ...shimmer, width: 84, height: 84, borderRadius: 18, flexShrink: 0 }} />
      <div className="flex-1">
        <div style={{ ...shimmer, height: 12, width: '40%', borderRadius: 6 }} />
        <div style={{ ...shimmer, height: 16, width: '75%', borderRadius: 6, marginTop: 10 }} />
        <div className="mt-3 flex gap-2">
          <div style={{ ...shimmer, height: 18, width: 56, borderRadius: 9 }} />
          <div style={{ ...shimmer, height: 18, width: 72, borderRadius: 9 }} />
        </div>
        <div style={{ ...shimmer, height: 12, width: '50%', borderRadius: 6, marginTop: 12 }} />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}