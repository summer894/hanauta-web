import { useState, useEffect } from 'react'
import UserAvatar, { SAMPLES, setAvatar, fileToAvatar } from '../components/UserAvatar'
import PostCard from '../components/PostCard'
import { getThreads } from '../api'
import LineIcon from '../components/LineIcon'
import EmptyState from '../components/EmptyState'
import AudioPlayer from '../components/AudioPlayer'
import PianoRollDemo from '../components/PianoRollDemo'

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

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'たった今'
  if (diff < 3600)  return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

// 一覧APIのデータを、PostCardが使う形に変換
function toPost(t) {
  return {
    id:          t.id,
    user:        t.username,
    instrument:  t.instrument || 'Guitar',
    title:       t.title,
    genre:       t.genre || 'Session',
    likes:       t.like_count || 0,
    time:        timeAgo(t.created_at),
    wantedParts: t.wanted_parts ? t.wanted_parts.split(',') : ['参加者募集中'],
    partCount:   t.part_count || 0,
    tags:        t.tags || [],
    parts:       [],
    extraUsers:  t.participant_names
      ? t.participant_names.split(',').filter((n) => n !== t.username)
      : [],
    theme:       t.theme || null,
  }
}

const MENU = [
  { key: 'mine',   icon: 'note',  label: '自分の投稿',        sub: '作成したセッション' },
  { key: 'joined', icon: 'mic',   label: '参加したセッション', sub: 'パートを投稿したもの' },
  { key: 'likes',  icon: 'heart', label: 'いいねした投稿',     sub: 'お気に入りのパート', soon: true },
  { key: 'config', icon: 'gear',  label: '設定',              sub: 'アカウント・通知',   soon: true },
]

export default function AccountPage({ user, onLogout, onOpenThread }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed]   = useState(false)
  const [open, setOpen]       = useState(null)
  const [picking, setPicking] = useState(false)

  async function choose(v) {
    try { await setAvatar(user.name, v); setPicking(false) }
    catch { alert('アイコンを保存できませんでした') }
  }

  async function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    try { await choose(await fileToAvatar(f)) }
    catch { alert('画像を読み込めませんでした') }
  }

  useEffect(() => {
    async function fetchThreads() {
      try {
        const data = await getThreads()
        setThreads(data.threads)
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [])

  const mine = threads.filter((t) => user.id != null && t.user_id === user.id)
  const joined = threads.filter(
    (t) =>
      t.user_id !== user.id &&
      (t.participant_names || '').split(',').includes(user.name)
  )
  const lists = { mine, joined }

  return (
    <div className="px-4 pb-32 pt-6">
      <PianoRollDemo />

      {/* プロフィール */}
      <div className="mb-5 text-center">
        <button onClick={() => setPicking(!picking)} className="relative mx-auto block">
          <div style={{ width: 96, height: 96, border: '4px solid white', borderRadius: '50%', boxShadow: '0 6px 20px rgba(127,140,255,0.45)', overflow: 'hidden' }}>
            <UserAvatar name={user.name} fill radius="50%" />
          </div>
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full text-xs"
            style={{ background: 'white', boxShadow: '0 2px 8px rgba(90,110,200,0.3)' }}>
              <LineIcon name="pencil" size={14} color="#5b8def" />
            </span>
        </button>

        {picking && (
          <div className="mx-auto mt-4 p-4 text-left"
            style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 22, boxShadow: '0 4px 20px rgba(90,110,200,0.15)' }}>
            <p className="mb-2 text-xs font-black" style={{ color: NAVY }}>アイコンを選ぶ</p>
            <div className="grid grid-cols-5 gap-2">
              {SAMPLES.map((s) => (
                <button key={s.id} onClick={() => choose('sample:' + s.id)}
                  className="flex aspect-square items-center justify-center rounded-full text-2xl transition hover:scale-110"
                  style={{ background: s.bg }}>{s.emoji}</button>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-full py-2.5 text-xs font-black text-white"
              style={{ background: ACCENT }}>
              <LineIcon name="camera" size={16} color="white" />
              写真から選ぶ
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={() => choose(null)}
              className="mt-2 w-full text-xs font-bold" style={{ color: '#9aa5c4' }}>頭文字に戻す</button>
          </div>
        )}
        <h2 className="mt-3 text-xl font-black" style={{ color: NAVY, ...NUNITO }}>
          {user.name}
        </h2>
        {user.email && <p className="mt-0.5 text-xs" style={{ color: SUB }}>{user.email}</p>}
      </div>

      {/* 統計 */}
      <div className="mb-4 grid grid-cols-3 p-4 text-center" style={{ ...GLASS, borderRadius: 22 }}>
        {[
          { label: '投稿',   value: loading ? '…' : mine.length },
          { label: '参加',   value: loading ? '…' : joined.length },
          { label: 'いいね', value: '—' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-black" style={{ color: '#5b8def', ...NUNITO }}>{s.value}</p>
            <p className="text-xs font-semibold" style={{ color: '#8c98bd' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {failed && (
        <div className="mb-4 rounded-xl px-4 py-2 text-xs font-semibold"
          style={{ background: 'rgba(255,240,220,0.9)', color: '#d9822b' }}>
        <LineIcon name="alert" size={14} color="#e0457f" /> サーバーに接続できないため、数字を取得できません
        </div>
      )}

      {/* メニュー */}
      <div>
        {MENU.map((item) => {
          const isOpen = open === item.key
          const list = lists[item.key]
          return (
            <div key={item.key} className="mb-2.5">
              <button
                onClick={() => !item.soon && setOpen(isOpen ? null : item.key)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:-translate-y-0.5"
                style={{ ...GLASS, borderRadius: 18, cursor: item.soon ? 'default' : 'pointer' }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ background: '#e3eeff' }}
                >
                  <LineIcon name={item.icon} size={22} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#8c98bd' }}>{item.sub}</p>
                </div>
                {item.soon ? (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: '#fff0dc', color: '#d9822b' }}>
                    準備中
                  </span>
                ) : (
                  <span style={{ color: '#b8c1dc' }}>{isOpen ? '⌃' : '⌄'}</span>
                )}
              </button>

              {isOpen && list && (
                <div className="mt-2">
                  {list.length === 0 ? (
                    <p className="rounded-2xl py-6 text-center text-xs"
                      style={{ background: 'rgba(255,255,255,0.6)', color: SUB }}>
                      まだありません
                    </p>
                  ) : (
                    list.map((t, i) => (
                      <PostCard
                        key={t.id}
                        post={toPost(t)}
                        onOpen={(p) => onOpenThread && onOpenThread(p, i)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onLogout}
        className="mt-6 w-full rounded-full py-3.5 text-sm font-bold transition hover:bg-white"
        style={{
          background: 'rgba(255,255,255,0.65)',
          color: '#ef6b8a',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        ログアウト
      </button>
    </div>
  )
}