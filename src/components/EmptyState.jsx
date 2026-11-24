import LineIcon from './LineIcon'

export default function EmptyState({ icon = 'note', title, text, action, onAction }) {
  return (
    <div
      className="flex flex-col items-center px-6 py-12 text-center"
      style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.85)',
        borderRadius: 28,
        boxShadow: '0 4px 20px rgba(90,110,200,0.1)',
      }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'linear-gradient(135deg, #e3eeff, #efe8ff)' }}
      >
        <LineIcon name={icon} size={30} color="#5b8def" />
      </div>
      <p className="text-sm font-black" style={{ color: '#27407f', fontFamily: "'Nunito', sans-serif" }}>{title}</p>
      {text && <p className="mt-1 text-xs leading-relaxed" style={{ color: '#6b7fb8' }}>{text}</p>}
      {action && (
        <button
          onClick={onAction}
          className="mt-4 rounded-full px-5 py-2 text-xs font-black text-white"
          style={{ background: 'linear-gradient(135deg, #7fb2ff, #a58bff)' }}
        >
          {action}
        </button>
      )}
    </div>
  )
}