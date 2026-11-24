import { useState } from 'react'
import UserAvatar from '../components/UserAvatar'
import LineIcon from '../components/LineIcon'
import EmptyState from '../components/EmptyState'
import AudioPlayer from '../components/AudioPlayer'

const NAVY   = '#27407f'
const SUB    = '#6b7fb8'
const ACCENT = 'linear-gradient(135deg, #7fb2ff, #a58bff)'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

const GLASS = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 4px 20px rgba(90,110,200,0.12)',
}

const AVATAR_COLORS = [
  '#f6b7d6', '#9cc5ff', '#a8e6c1', '#ffd88a',
  '#c9b8ff', '#ffb98a', '#ff9fb2', '#8fd8f5',
]

const JA = {
  Guitar: 'ギター', Bass: 'ベース', Drums: 'ドラム', Vocal: 'ボーカル',
  Piano: 'ピアノ', Violin: 'バイオリン', Flute: 'フルート', Trumpet: 'トランペット',
    キック: 'キック', スネア: 'スネア', ハイハット: 'ハイハット',
}

const TAG = {
  blue:   { background: '#e3eeff', color: '#4a78d4' },
  orange: { background: '#fff0dc', color: '#d9822b' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'たった今'
  if (diff < 3600)  return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

function BookmarkIcon({ size = 30, color = '#5b8def' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export default function SavedPage({ savedParts, onRemove, onStartSession }) {
  const [selected, setSelected] = useState([])

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleRemove(id) {
    onRemove(id)
    setSelected((prev) => prev.filter((x) => x !== id))
  }

  const allSelected = savedParts.length > 0 && selected.length === savedParts.length

  return (
    <div className="px-4 pb-32 pt-5">

      <div className="mb-5">
        <h2 className="text-2xl font-black" style={{ color: NAVY, ...NUNITO }}>
          保存した音源
        </h2>
        <p className="mt-1 text-sm" style={{ color: SUB }}>
          気に入ったパートを選んで、セッションを始めよう
        </p>
      </div>

      {/* 選択中バー */}
      {selected.length > 0 && (
        <div
          className="mb-4 flex items-center justify-between px-4 py-3"
          style={{
            background: ACCENT,
            borderRadius: 999,
            boxShadow: '0 6px 18px rgba(127,178,255,0.5)',
          }}
        >
          <p className="text-sm font-black text-white" style={NUNITO}>
            {selected.length}件を選択中
          </p>
          <button
            onClick={() => onStartSession(savedParts.filter((p) => selected.includes(p.id)))}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-black transition hover:scale-105"
            style={{ color: '#4a78d4', ...NUNITO }}
          >
            セッションを始める →
          </button>
        </div>
      )}

      {savedParts.length === 0 ? (
        <EmptyState icon="bookmark" title="保存した音源がありません" text="スレッド詳細で気になるパートの「＋ 保存」を押してみましょう" />
      ) : (
        <div>
          {savedParts.map((part, i) => {
            const isSelected = selected.includes(part.id)
            const name = part.username || part.user || 'unknown'
            const instLabel = JA[part.instrument] || part.instrument

            return (
              <div
                key={part.id}
                onClick={() => toggleSelect(part.id)}
                className="mb-3 flex cursor-pointer items-center gap-3 p-3 transition hover:-translate-y-0.5"
                style={{
                  ...GLASS,
                  background: isSelected ? 'rgba(227,238,255,0.92)' : GLASS.background,
                  border: isSelected ? '2px solid #7fb2ff' : '2px solid rgba(255,255,255,0.85)',
                  borderRadius: 22,
                  boxShadow: isSelected
                    ? '0 6px 20px rgba(127,178,255,0.4)'
                    : GLASS.boxShadow,
                }}
              >
                {/* チェック */}
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition"
                  style={{
                    background: isSelected ? ACCENT : 'transparent',
                    border: isSelected ? 'none' : '2px solid #c3cce6',
                  }}
                >
                  {isSelected && <CheckIcon />}
                </div>

{/* アイコン */}
<div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
  <UserAvatar name={name} index={i} fill radius={0} />
</div>

                {/* 情報 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black" style={{ color: NAVY, ...NUNITO }}>
                    {name} の {instLabel}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={TAG.blue}
                    >
                      # {instLabel}
                    </span>
                    {part.genre && part.genre !== 'Session' && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={TAG.orange}
                      >
                        # {part.genre}
                      </span>
                    )}
                    {part.created_at && (
                      <span className="text-[10px]" style={{ color: '#9aa5c4' }}>
                        {timeAgo(part.created_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 削除 */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(part.id) }}
                  className="flex-shrink-0 rounded-full p-2 transition hover:bg-white hover:text-pink-500"
                  style={{ color: '#b8c1dc' }}
                  aria-label="保存を解除"
                >
                  <CloseIcon />
                </button>
              </div>
            )
          })}

          <button
            onClick={() =>
              allSelected ? setSelected([]) : setSelected(savedParts.map((p) => p.id))
            }
            className="mt-1 w-full rounded-full py-3 text-sm font-bold transition hover:bg-white"
            style={{
              background: 'rgba(255,255,255,0.65)',
              color: '#4a78d4',
              border: '1px solid rgba(255,255,255,0.9)',
              ...NUNITO,
            }}
          >
            {allSelected ? 'すべて解除' : 'すべて選択'}
          </button>
        </div>
      )}
    </div>
  )
}