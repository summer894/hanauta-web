import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import { SkeletonList } from '../components/Skeleton'
import { getThreads } from '../api'
import LineIcon from '../components/LineIcon'
import AudioPlayer from '../components/AudioPlayer'
import EmptyState from '../components/EmptyState'

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

// タグの色（ホームのカードと同じ配色）
const TAGS = [
  { label: 'Lo-fi',    bg: '#e3eeff', color: '#4a78d4' },
  { label: 'Pop',      bg: '#fff0dc', color: '#d9822b' },
  { label: 'Rock',     bg: '#efe8ff', color: '#7c5cd6' },
  { label: 'Jazz',     bg: '#e3eeff', color: '#4a78d4' },
  { label: 'Chill',    bg: '#fff0dc', color: '#d9822b' },
  { label: 'Acoustic', bg: '#efe8ff', color: '#7c5cd6' },
]

const SAMPLE = [
  { id: -1, sample: true, user: 'haru', instrument: 'Guitar', title: '雨の日に弾きたいフレーズ', genre: 'Lo-fi', likes: 24, time: '12分前', wantedParts: ['ベース', 'ドラム'], partCount: 2, parts: [], extraUsers: ['sora', 'kai'] },
  { id: -2, sample: true, user: 'mio', instrument: 'Vocal', title: 'このコード進行に歌をのせてみた', genre: 'Pop', likes: 18, time: '35分前', wantedParts: ['ギター'], partCount: 1, parts: [], extraUsers: ['ren'] },
  { id: -3, sample: true, user: 'ren', instrument: 'Drums', title: '誰かベースを重ねてくれませんか？', genre: 'Rock', likes: 31, time: '1時間前', wantedParts: ['ベース', 'ボーカル'], partCount: 3, parts: [], extraUsers: ['haru', 'mio', 'yui'] },
  { id: -4, sample: true, user: 'yui', instrument: 'Piano', title: '夜に聴きたいピアノ', genre: 'Chill', likes: 12, time: '3時間前', wantedParts: ['フルート'], partCount: 0, parts: [], extraUsers: [] },
]

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'たった今'
  if (diff < 3600)  return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  return `${Math.floor(diff / 86400)}日前`
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7d8bb5"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

export default function SearchPage({ onOpenThread, initialKeyword = '' }) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [threads, setThreads]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [usingSample, setUsingSample] = useState(false)

  useEffect(() => {
    async function fetchThreads() {
      try {
        setLoading(true)
        const data = await getThreads()
        setThreads(
          data.threads.map((t) => ({
            id:          t.id,
            user:        t.username,
            instrument:  t.instrument || 'Guitar',
            title:       t.title,
            genre:       t.genre || 'Session',
            likes:       t.like_count || 0,
            time:        timeAgo(t.created_at),
            wantedParts: t.wanted_parts ? t.wanted_parts.split(',') : ['参加者募集中'],
            partCount:   t.part_count || 0,
            theme:       t.theme || null,
            tags:        t.tags || [],
            parts:       [],
            extraUsers:  t.participant_names
              ? t.participant_names.split(',').filter((n) => n !== t.username)
              : [],
          }))
        )
        setUsingSample(false)
      } catch {
        // サーバーに繋がらないときはサンプルを表示（UI確認用）
        setThreads(SAMPLE)
        setUsingSample(true)
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [])

  const k = keyword.trim().toLowerCase()
  const isTag = k.startsWith('#') || k.startsWith('＃')
  const q = isTag ? k.slice(1) : k
    // 使われているタグを、多い順に集計
  const tagCount = {}
  threads.forEach((t) => {
    const list = [...(t.tags || [])]
    if (t.theme) list.push('今日のお題', t.theme.toLowerCase())
    new Set(list).forEach((x) => { tagCount[x] = (tagCount[x] || 0) + 1 })
  })
  const rawQ = keyword.trim().replace(/^[#＃]/, '').toLowerCase()
  const showSuggest = /^[#＃]/.test(keyword.trim())
  const suggestions = Object.entries(tagCount)
    .filter(([name]) => name.includes(rawQ))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const results = threads.filter((t) =>
    !q ||
    (isTag
      ? (t.tags || []).some((x) => x.includes(q)) ||
        (t.theme || '').toLowerCase().includes(q) ||
        ('今日のお題'.includes(q) && !!t.theme)
      : t.title.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        (t.genre || '').toLowerCase().includes(q) ||
        (t.tags || []).some((x) => x.includes(q)))
  )

  return (
    <div className="px-4 pb-32 pt-5">

      <h2 className="mb-4 text-2xl font-black" style={{ color: NAVY, ...NUNITO }}>
        探す
      </h2>

      {/* 検索ボックス */}
      <div
        className="mb-4 flex items-center gap-2 px-4 py-3"
        style={{ ...GLASS, borderRadius: 999 }}
      >
        <SearchIcon />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="タイトル・ユーザー名・ジャンルで検索"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: NAVY }}
        />
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="text-sm"
            style={{ color: '#b8c1dc' }}
          >
            ✕
          </button>
        )}
      </div>
      {showSuggest && suggestions.length > 0 && (
        <div className="mb-4 p-3" style={{ ...GLASS, borderRadius: 18 }}>
          <p className="mb-2 text-[11px] font-bold" style={{ color: SUB }}>
            {rawQ ? '候補のタグ' : '人気のタグ'}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(([name, n]) => (
              <button
                key={name}
                onClick={() => setKeyword('#' + name)}
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: '#e8f7ee', color: '#2f9e6a' }}
              >
                # {name} <span style={{ opacity: 0.6 }}>{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* タグ */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TAGS.map((tag) => {
          const active = keyword.toLowerCase() === tag.label.toLowerCase()
          return (
            <button
              key={tag.label}
              onClick={() => setKeyword(active ? '' : tag.label)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:scale-105"
              style={{
                background: active ? ACCENT : tag.bg,
                color: active ? 'white' : tag.color,
                boxShadow: active ? '0 3px 10px rgba(127,178,255,0.45)' : 'none',
                ...NUNITO,
              }}
            >
              # {tag.label}
            </button>
          )
        })}
      </div>

      {usingSample && (
        <div
          className="mb-4 rounded-xl px-4 py-2 text-xs font-semibold"
          style={{ background: 'rgba(255,240,220,0.9)', color: '#d9822b' }}
        >
        <LineIcon name="alert" size={14} color="#e0457f" /> サーバーに接続できないため、サンプルを表示しています
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <>
          <p className="mb-3 text-xs font-bold" style={{ color: SUB }}>
            {results.length}件のセッション
          </p>

          {results.length === 0 ? (
            
            <EmptyState icon="note" title="見つかりませんでした" text="別のキーワードを試してみてください" />
          ) : (
            results.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onOpen={(p) =>
                  p.sample ? alert('これはサンプル表示です') : onOpenThread(p, index)
                }
                onTag={(t) => setKeyword('#' + t)}
              />
            ))
          )}
        </>
      )}
    </div>
  )
}