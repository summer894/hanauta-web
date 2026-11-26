import { useState } from 'react'
import UserAvatar from './UserAvatar'
import LineIcon from './LineIcon'
import { shareThread } from '../share'

const NAVY = '#27407f'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

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
  blue: { background: '#e3eeff', color: '#4a78d4' },
  orange: { background: '#fff0dc', color: '#d9822b' },
  purple: { background: '#efe8ff', color: '#7c5cd6' },
}

function AvatarGrid({ users }) {
  const list = users.slice(0, 4)
  const n = list.length
  const template = n >= 2
    ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: n >= 3 ? '1fr 1fr' : '1fr' }
    : {}

  return (
    <div
      style={{
        width: 84, height: 84, flexShrink: 0,
        display: 'grid', gap: 3,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(90,110,200,0.18)',
        ...template,
      }}
    >
      {list.map((u, i) => (
        <div key={i} style={{ gridRow: n === 3 && i === 0 ? 'span 2' : undefined, minHeight: 0 }}>
          <UserAvatar name={u} index={i} fill radius={0} />
        </div>
      ))}
    </div>
  )
}

const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
}

function HeartIcon({ filled }) {
  return (
    <svg {...iconProps} stroke={filled ? '#ff6fa8' : 'currentColor'} fill={filled ? '#ff6fa8' : 'none'}>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg {...iconProps} stroke="currentColor">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg {...iconProps} stroke="currentColor">
      <path d="M21 11.5a8.4 8.4 0 01-12.2 7.5L3 21l2-5.3A8.5 8.5 0 1121 11.5z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg {...iconProps} stroke="currentColor">
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  )
}

export default function PostCard({ post, onOpen, onTag }) {
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const allUsers = [
    post.user,
    ...(post.parts?.map((p) => p.user) || []),
    ...(post.extraUsers || []),
  ]
  const users = [...new Set(allUsers)].filter(Boolean)
  if (users.length === 0) users.push('?')

  const instLabel = JA[post.instrument] || post.instrument
  const hasGenre = post.genre && post.genre !== 'Session'
  const wanted = post.wantedParts?.[0]

  return (
    <article
      onClick={() => onOpen(post)}
      className="flex cursor-pointer gap-3 transition hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.85)',
        borderRadius: 22,
        boxShadow: '0 4px 20px rgba(90,110,200,0.12)',
        marginBottom: 12,
        padding: 12,
      }}
    >
      <AvatarGrid users={users} />

      <div className="min-w-0 flex-1">

        {/* 名前と時間 */}
        <div className="flex items-center gap-2">
          <UserAvatar name={users[0]} size={24} />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold leading-tight" style={{ color: '#4a78d4', ...NUNITO }}>
              {users.join(' · ')}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: '#9aa5c4' }}>{post.time}</p>
          </div>
        </div>

        {/* タイトル */}
        <h3
          className="mt-1.5 truncate text-[15px] font-black"
          style={{ color: NAVY, ...NUNITO }}
        >
          {post.title}
        </h3>

        {/* タグ */}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {post.theme && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg, #ffd1e8, #ffe7b8)', color: '#c2548a' }}
            >
              ✨ 今日のお題「{post.theme}」
            </span>
          )}
          {(post.tags || []).map((t) => (
            <button
              key={t}
              onClick={(e) => { e.stopPropagation(); onTag && onTag(t) }}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: '#e8f7ee', color: '#2f9e6a' }}
            >
              # {t}
            </button>
          ))}

          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={TAG.blue}>
            # {instLabel}
          </span>
          {hasGenre && (
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={TAG.orange}>
              # {post.genre}
            </span>
          )}
          {wanted && (
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={TAG.purple}>
              # {wanted}
            </span>
          )}
        </div>

        {/* アクション */}
        <div className="mt-2 flex items-center gap-4" style={{ color: '#7d8bb5' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: liked ? '#ff6fa8' : undefined }}
          >
            <HeartIcon filled={liked} />
            {post.likes + (liked ? 1 : 0)}
          </button>
          <span className="flex items-center gap-1 text-xs font-semibold" title="参加パート数">
            <NoteIcon />
            {post.partCount || 0}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(post, 'コメント') }}
            className="flex items-center gap-1 text-xs font-semibold"
            title="コメント数"
          >
            <CommentIcon />
            {post.commentCount || 0}
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation()
              if (post.sample) return
              const r = await shareThread(post.id, post.title)
              if (r === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 2000) }
            }}
            className="flex items-center text-xs font-semibold"
          >
            {copied ? 'コピーしました' : <ShareIcon />}
          </button>
          <span className="ml-auto text-base tracking-widest" style={{ color: '#b8c1dc' }}>···</span>
        </div>
      </div>
    </article>
  )
}