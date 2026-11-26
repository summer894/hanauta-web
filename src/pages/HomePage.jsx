import DailyTheme from '../components/DailyTheme'
import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import { getThreads } from '../api'
import { SkeletonList } from '../components/Skeleton'
import LineIcon from '../components/LineIcon'
import EmptyState from '../components/EmptyState'
import AudioPlayer from '../components/AudioPlayer'

const NAVY = '#27407f'
const ACCENT = 'linear-gradient(135deg, #7fb2ff, #a58bff)'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'たった今'
  if (diff < 3600)  return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

const ago = (min) => new Date(Date.now() - min * 60000).toISOString()

const SAMPLE = [
  { id: -1, sample: true, user: 'haru', instrument: 'Guitar', title: '雨の日に弾きたいフレーズ', genre: 'Lo-fi', likes: 24, time: '12分前', createdAt: ago(12), wantedParts: ['ベース'], partCount: 2, parts: [], extraUsers: ['sora', 'kai'] },
  { id: -2, sample: true, user: 'mio', instrument: 'Vocal', title: 'このコード進行に歌をのせてみた', genre: 'Pop', likes: 18, time: '35分前', createdAt: ago(35), wantedParts: ['ギター'], partCount: 1, parts: [], extraUsers: ['ren'] },
  { id: -3, sample: true, user: 'ren', instrument: 'Drums', title: '誰かベースを重ねてくれませんか？', genre: 'Rock', likes: 31, time: '1時間前', createdAt: ago(60), wantedParts: ['ベース'], partCount: 3, parts: [], extraUsers: ['haru', 'mio', 'yui'] },
]

export default function HomePage({ onNavigate, onOpenThread, onTag }) {
  const [tab, setTab]         = useState('おすすめ')
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

    const [usingSample, setUsingSample] = useState(false)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!loading) { setSlow(false); return }
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [loading])
  useEffect(() => {
    async function fetchThreads() {
      try {
        setLoading(true)
        const data = await getThreads()
        const formatted = data.threads.map((t) => ({
          id:          t.id,
          user:        t.username,
          instrument:  t.instrument || 'Guitar',
          title:       t.title,
          genre:       t.genre || 'Session',
          likes:       t.like_count || 0,
          time:        timeAgo(t.created_at),
          wantedParts: t.wanted_parts ? t.wanted_parts.split(',') : ['参加者募集中'],
          audioUrl:    t.audio_url,
          partCount:    Number(t.part_count) || 0,
          tags:        t.tags || [],
        createdAt:    t.created_at,
          commentCount: Number(t.comment_count) || 0,
          parts:       [],
          extraUsers:  t.participant_names
            ? t.participant_names.split(',').filter((name) => name !== t.username)
            : [],
          theme:        t.theme || null,
        }))
        setThreads(formatted)
      } catch {
                setThreads(SAMPLE)
        setUsingSample(true)
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [])
  // タブに応じて並べ替え
  const sortedThreads = [...threads].sort((a, b) => {
    if (tab === 'おすすめ') {
      // 参加パートが多い順。同じなら新しい順
      return (
        b.partCount - a.partCount ||
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    }
    // 新着：新しい順
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
  return (
    <div className="pb-40">

      {/* ヒーロー（すりガラスのカード） */}
      <section
        className="mx-4 mt-4 p-5"
        style={{
          background: 'rgba(255,255,255,0.42)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.75)',
          borderRadius: '28px',
          boxShadow: '0 8px 32px rgba(90,110,200,0.15)',
        }}
      >
        <p className="text-[11px] font-bold" style={{ color: '#6b7fb8', letterSpacing: '0.18em' }}>
          TODAY'S SESSION
        </p>
        <h2
          className="mt-2 text-[28px] font-black leading-tight"
          style={{ color: NAVY, ...NUNITO }}
        >
          その音から、<br />誰かと音楽を。
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#5d6e9e' }}>
          鼻歌を録音して楽器音に変換、<br />みんなのセッションに参加しよう。
        </p>
        <button
          onClick={() => onNavigate('録音')}
          className="mt-4 inline-flex items-center rounded-full py-2.5 pl-3 pr-5 text-sm font-black transition hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.92)',
            color: '#4a6fd8',
            boxShadow: '0 4px 14px rgba(90,110,200,0.2)',
            ...NUNITO,
          }}
        >
          <span
            className="mr-2 flex h-6 w-6 items-center justify-center rounded-full text-base leading-none text-white"
            style={{ background: ACCENT }}
          >
            +
          </span>
          セッションを始める
        </button>
      </section>
      <DailyTheme onPost={(theme) => onNavigate('録音', theme)} />
      {/* フィード */}
      <div className="px-4 pt-6">

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ color: NAVY, ...NUNITO }}>
            みんなの音楽
          </h2>
          <button
            onClick={() => onNavigate('探す')}
            className="text-xs font-bold"
            style={{ color: '#5b8def' }}
          >
            もっと見る ›
          </button>
        </div>

        {/* タブ（3等分） */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {['おすすめ', 'フォロー中', '新着'].map((item) => {
            const active = tab === item
            return (
              <button
                key={item}
                onClick={() => setTab(item)}
                className="rounded-full py-2 text-sm font-bold transition"
                style={{
                  background: active ? ACCENT : 'rgba(255,255,255,0.6)',
                  color: active ? 'white' : '#5d6e9e',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.85)',
                  boxShadow: active ? '0 4px 12px rgba(127,178,255,0.45)' : 'none',
                  ...NUNITO,
                }}
              >
                {item}
              </button>
            )
          })}
        </div>
        {usingSample && !loading && (
          <div
            className="mb-3 rounded-xl px-4 py-2 text-xs font-semibold"
            style={{ background: 'rgba(255,240,220,0.9)', color: '#d9822b' }}
          >
          <LineIcon name="alert" size={14} color="#e0457f" />サーバーに接続できないため、サンプルを表示しています
          </div>
        )}
        {loading && (
          <>
            {slow && (
              <div
                className="mb-3 rounded-xl px-4 py-2 text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.8)', color: '#4a78d4' }}
              >
                サーバーを起こしています。初回は1分ほどかかることがあります
              </div>
            )}
            <SkeletonList count={3} />
          </>
        )}

        {error && !loading && (
          <div className="rounded-2xl bg-white/70 px-4 py-4 text-center text-sm text-red-400">
            <p>⚠️ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs underline"
            >
              再読み込みする
            </button>
          </div>
        )}

                {!loading && !error && (
          tab === 'フォロー中' ? (
            <div
              className="flex flex-col items-center rounded-3xl py-14 text-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.85)',
              }}
            >
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: '#e3eeff' }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#5b8def"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="4" />
                  <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
                  <path d="M19 8v6M16 11h6" />
                </svg>
              </div>
              <p className="font-black" style={{ color: NAVY, ...NUNITO }}>
                フォロー機能は準備中です
              </p>
              <p className="mt-1 px-8 text-xs leading-relaxed" style={{ color: '#6b7fb8' }}>
                気になる人をフォローして、その人のセッションだけを見られるようになる予定です
              </p>
            </div>
          ) : sortedThreads.length === 0 ? (
            <EmptyState icon="note" title="まだ投稿がありません" text="最初のセッションを始めましょう" action="セッションを始める" onAction={() => onNavigate('録音')} />
          ) : (
            sortedThreads.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                                onOpen={(p, tab) =>
                  p.sample ? alert('これはサンプル表示です') : onOpenThread(p, index, tab)
                }
                                onTag={onTag}
              />
            ))
          )
        )}
      </div>
    </div>
  )
}