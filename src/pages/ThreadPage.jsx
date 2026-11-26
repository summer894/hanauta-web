import { useState, useEffect, useRef } from 'react'
import { getThread, likePart, createComment, BASE_URL } from '../api'
import UserAvatar from '../components/UserAvatar'
import { SkeletonList } from '../components/Skeleton'
import LineIcon from '../components/LineIcon'
import EmptyState from '../components/EmptyState'
import AudioPlayer from '../components/AudioPlayer'
import { shareThread } from '../share'

const AVATAR_COLORS = [
    '#f9a8d4', '#93c5fd', '#86efac', '#fcd34d',
    '#c4b5fd', '#f97316', '#fb7185', '#38bdf8',
]

const PART_GRADIENTS = [
    ['#7C3AED', '#818cf8'],
    ['#2563EB', '#38bdf8'],
    ['#DB2777', '#f472b6'],
    ['#059669', '#34d399'],
    ['#D97706', '#fbbf24'],
]

// 音声のURLが「/uploads/...」でも「https://...」でも再生できるようにする
const audioSrc = (url) => (url?.startsWith('http') ? url : `${BASE_URL}${url}`)

const JA = {
    Guitar: 'ギター', Bass: 'ベース', Drums: 'ドラム', Vocal: 'ボーカル',
    Piano: 'ピアノ', Violin: 'バイオリン', Flute: 'フルート', Trumpet: 'トランペット',
    キック: 'キック', スネア: 'スネア', ハイハット: 'ハイハット',
}

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'たった今'
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
    return `${Math.floor(diff / 86400)}日前`
}

function Avatar({ user, index, size = 36 }) {
    return <UserAvatar name={user} index={index} size={size} />
}


// 参加者グリッドアイコン（詳細画面用・大きめ）
function AvatarGridLarge({ users }) {
    const count = users.length
    if (count === 0) return null

const Cell = ({ user, i }) => (
    <UserAvatar name={user} index={i} fill radius={0} />
)

    if (count === 1) {
        return (
            <div className="flex overflow-hidden rounded-2xl" style={{ width: 72, height: 72 }}>
                <UserAvatar name={users[0]} index={0} fill radius={0} />
            </div>
        )
    }
    if (count === 2) {
        return (
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl gap-0.5" style={{ width: 72, height: 72 }}>
                {users.slice(0, 2).map((u, i) => <Cell key={i} user={u} i={i} />)}
            </div>
        )
    }
    if (count === 3) {
        return (
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl gap-0.5" style={{ width: 72, height: 72 }}>
                <div className="row-span-2" style={{ minHeight: 0 }}>
                    <UserAvatar name={users[0]} index={0} fill radius={0} />
                </div>
                <Cell user={users[1]} i={1} />
                <Cell user={users[2]} i={2} />
            </div>
        )
    }
    return (
        <div className="grid grid-cols-2 grid-rows-2 overflow-hidden rounded-2xl gap-0.5" style={{ width: 72, height: 72 }}>
            {users.slice(0, 4).map((u, i) => <Cell key={i} user={u} i={i} />)}
        </div>
    )
}

export default function ThreadPage({ post, index, onBack, onJoin, onSavePart, initialTab = 'パート', guest = false, onNeedLogin = () => true }) {
    const [thread, setThread] = useState(null)
    const [parts, setParts] = useState([])
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [liked, setLiked] = useState([])
    const [saved, setSaved] = useState([])
  const [tab, setTab]           = useState(initialTab)
    const [comment, setComment] = useState('')
    const [sending, setSending] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mixPlaying, setMixPlaying] = useState(false)
    const [mixError, setMixError] = useState('')
    const mixRef = useRef([])

    useEffect(() => {
        async function fetchThread() {
            try {
                setLoading(true)
                const data = await getThread(post.id)
                setThread(data.thread)
                setParts(data.parts || [])
                setComments(data.comments || [])
                setLiked((data.liked_part_ids || []).map(Number))
            } catch (e) {
                setError('スレッドの取得に失敗しました')
            } finally {
                setLoading(false)
            }
        }
        fetchThread()
    }, [post.id])

    useEffect(() => () => { mixRef.current.forEach((a) => a.pause()) }, [])

  async function handleLike(partId) {
    if (guest) { onNeedLogin(); return }
    try {
      const r = await likePart(partId)
      // サーバーの結果で、いいね状態と件数を更新
      setLiked((prev) =>
        r.liked ? [...new Set([...prev, partId])] : prev.filter((x) => x !== partId)
      )
      setParts((prev) =>
        prev.map((p) => (p.id === partId ? { ...p, like_count: r.like_count } : p))
      )
    } catch (e) {
      console.error(e)
    }
  }

    function toggleSave(part) {
        if (guest) { onNeedLogin(); return }
        if (saved.includes(part.id)) {
            setSaved((prev) => prev.filter((x) => x !== part.id))
        } else {
            setSaved((prev) => [...prev, part.id])
            onSavePart({ ...part, genre: post.genre })
        }
    }

    async function handleComment() {
        if (guest) { onNeedLogin(); return }
        if (!comment.trim()) return
        setSending(true)
        try {
            await createComment(post.id, comment)
            setComments((prev) => [...prev, {
                id: Date.now(),
                body: comment,
                username: 'あなた',
                created_at: new Date().toISOString(),
            }])
            setComment('')
        } catch (e) { console.error(e) }
        finally { setSending(false) }
    }

    if (loading) {
        return (
        <div className="px-4 pt-6">
                <SkeletonList count={3} />
            </div>
            )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-4xl"><LineIcon name="alert" size={14} color="#e0457f" /></p>
                <p className="mt-4 text-sm text-red-400">{error}</p>
                <button onClick={onBack} className="mt-4 text-sm text-violet-500 underline">戻る</button>
            </div>
        )
    }

    const allUsers = [thread?.username || post.user, ...parts.map(p => p.username)]
    const uniqueUsers = [...new Set(allUsers)]
    const partItems = [
                {
            id: `origin-${thread?.id ?? post.id}`,
            username: thread?.username || post.user,
            instrument: thread?.instrument || JA[post.instrument] || post.instrument || 'ギター',
            created_at: thread?.created_at,
            audio: thread?.converted_audio_url || thread?.audio_url,
            notConverted: !thread?.converted_audio_url,
            isOrigin: true,
        },
        ...parts.map((p) => ({
            ...p,
            audio: p.converted_audio_url || p.original_audio_url,
            notConverted: !p.converted_audio_url || p.converted_audio_url === p.original_audio_url,
            isOrigin: false,
        })),
    ]

  // ── 全パートを重ねて再生 ──

  function stopMix() {
    mixRef.current.forEach((a) => { a.pause(); a.currentTime = 0 })
    mixRef.current = []
    setMixPlaying(false)
  }

  async function playMix() {
    if (mixPlaying) { stopMix(); return }
    setMixError('')

    const targets = partItems.filter((p) => p.audio)
    if (targets.length === 0) {
      setMixError('再生できる音源がありません')
      return
    }

    let finished = 0
    const done = () => {
      finished += 1
      if (finished === targets.length) stopMix()
    }
    const list = targets.map((p) => {
      const a = new Audio(audioSrc(p.audio))
      a.onended = done
      return a
    })
    mixRef.current = list
    setMixPlaying(true)

    const results = await Promise.allSettled(list.map((a) => a.play()))
    const failed = results.filter((r) => r.status === 'rejected').length
    for (let i = 0; i < failed; i++) done()
    if (failed === list.length) setMixError('音源を再生できませんでした')
    else if (failed > 0) setMixError('一部の音源は再生できませんでした')
  }

    return (
        <div className="pb-44" style={{ minHeight: '100vh' }}>

            {/* ヘッダー */}
            <div
                className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
                style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255,255,255,0.5)',
                }}
            >
                <button
                    onClick={onBack}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110"
                    style={{ background: 'rgba(139,92,246,0.1)' }}
                >
                    <span className="text-violet-600 font-bold">←</span>
                </button>
                <div className="flex-1 min-w-0">
                    <p
                        className="font-black leading-tight truncate text-zinc-800"
                        style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px' }}
                    >
                        {thread?.title || post.title}
                    </p>
                    <p className="text-xs text-zinc-400">
                        {thread?.username || post.user} · {post.instrument}
                    </p>
                </div>
                <span
                    className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                        background: 'rgba(139,92,246,0.1)',
                        color: '#7C3AED',
                        border: '1px solid rgba(139,92,246,0.2)',
                    }}
                >
                    セッション
                </span>
                <button
                    onClick={async () => {
                        const r = await shareThread(post.id, thread?.title || post.title)
                        if (r === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 2000) }
                    }}
                    className="flex h-9 flex-shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold"
                    style={{ background: 'rgba(127,178,255,0.15)', color: '#4a78d4' }}
                    aria-label="共有"
                >
                    {copied ? 'コピーしました' : <LineIcon name="share" size={18} color="#4a78d4" />}
                </button>
            </div>

            <div className="px-4 pt-4">
                {guest && (
                    <div
                        className="mb-4 rounded-2xl px-4 py-3 text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.85)', color: '#4a78d4' }}
                    >
                        登録なしで聴けます。気に入ったら、登録して、一緒にセッションしよう
                    </div>
                )}
                {/* 元音源カード */}
                <div
                    className="mb-4 p-4"
                    style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        borderRadius: '20px',
                        boxShadow: '0 2px 16px rgba(139,92,246,0.07)',
                    }}
                >
                    {/* 参加者グリッド＋情報 */}
                    <div className="flex items-start gap-3 mb-3">
                        <AvatarGridLarge users={uniqueUsers} />
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-xs font-bold mb-0.5 truncate"
                                style={{ color: '#6D28D9', fontFamily: "'Nunito', sans-serif" }}
                            >
                                {uniqueUsers.join(' · ')}
                            </p>
                            <p className="text-xs text-zinc-400 mb-1">
                                {post.instrument} · {timeAgo(thread?.created_at || new Date())}
                            </p>
                            {/* 元音源を聴くラベル */}
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-xs font-bold"
                                    style={{ color: '#7C3AED' }}
                                >
                                    セッション音源
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 音源プレイヤー */}
                    {/* セッション音源（AI変換ができるまでは準備中） */}
                              {/* セッション音源：全パートを重ねて再生 */}
          <div
            className="mb-3 rounded-2xl p-3"
            style={{ background: 'rgba(127,178,255,0.12)', border: '1px solid rgba(127,178,255,0.25)' }}
          >
            <button
              onClick={playMix}
              className="flex w-full items-center gap-3 text-left"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, #7fb2ff, #a58bff)' }}
              >
                {mixPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                )}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: '#4a78d4' }}>
                  みんなの音を重ねて再生
                </p>
                <p className="text-[11px]" style={{ color: '#6b7fb8' }}>
                  {mixPlaying ? '再生中… タップで停止' : `${partItems.filter((p) => p.audio).length}つの音を同時に鳴らします`}
                </p>
              </div>
            </button>
            {mixError && (
              <p className="mt-2 text-[11px] font-semibold" style={{ color: '#e0457f' }}><LineIcon name="alert" size={14} color="#e0457f" /> {mixError}</p>
            )}
          </div>

                    {/* 募集中パート */}
                    <div>
                        <p className="text-xs text-zinc-400 mb-2">募集中のパート</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(post.wantedParts || ['参加者募集中']).map((p) => (
                                <span
                                    key={p}
                                    className="rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                        background: 'rgba(251,191,36,0.12)',
                                        color: '#D97706',
                                        border: '1px solid rgba(251,191,36,0.3)',
                                    }}
                                >
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* タブ */}
                <div className="mb-3 grid grid-cols-3 gap-2">
                    {['パート', 'タイムライン', 'コメント'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="rounded-full py-2 text-xs font-bold transition"
                            style={{
                                background: tab === t ? 'linear-gradient(135deg, #7fb2ff, #a58bff)' : 'rgba(255,255,255,0.6)',
                                color: tab === t ? 'white' : '#5d6e9e',
                                border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.85)',
                                boxShadow: tab === t ? '0 3px 10px rgba(127,178,255,0.45)' : 'none',
                                fontFamily: "'Nunito', sans-serif",
                            }}
                        >
                            {t === 'パート'
                                ? `パート（${partItems.length}）`
                                : t === 'コメント'
                                    ? `コメント（${comments.length}）`
                                    : 'タイムライン'}
                        </button>
                    ))}
                </div>

                {/* ── パートタブ ── */}
                {tab === 'パート' && (
                    <div className="space-y-3">
                        {partItems.map((item, i) => {
                            const colors = PART_GRADIENTS[i % PART_GRADIENTS.length]
                            const isSaved = saved.includes(item.id)
                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        background: 'rgba(255,255,255,0.8)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.85)',
                                        borderRadius: '18px',
                                        boxShadow: '0 4px 16px rgba(90,110,200,0.1)',
                                    }}
                                >
                                    <div className="flex items-center gap-3 p-3">
                                        <Avatar user={item.username} index={i} size={36} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="truncate text-sm font-bold text-zinc-700">{item.username}</p>
                                                {item.notConverted && !item.isOrigin && (
                                                    <span
                                                        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                        style={{ background: '#fff0dc', color: '#d9822b' }}
                                                    >
                                                        変換前
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400">
                                                {item.instrument}{item.created_at ? ` · ${timeAgo(item.created_at)}` : ''}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => toggleSave(item)}
                                            className="rounded-full px-3 py-1 text-xs font-bold transition"
                                            style={{
                                                background: isSaved ? 'rgba(127,178,255,0.2)' : 'rgba(0,0,0,0.04)',
                                                color: isSaved ? '#4a78d4' : '#9CA3AF',
                                                border: `1px solid ${isSaved ? 'rgba(127,178,255,0.4)' : 'rgba(0,0,0,0.08)'}`,
                                            }}
                                        >
                                            {isSaved ? '保存済み' : '+ 保存'}
                                        </button>

                                        {/* いいねは参加パートだけ（元の音源にはAPIがない） */}
                                        {!item.isOrigin && (
                                            <button
                                                onClick={() => handleLike(item.id)}
                                                className="flex items-center gap-1 text-xs transition"
                                                style={{ color: liked.includes(item.id) ? '#ff6fa8' : '#9CA3AF' }}
                                            >
                                                <span>{liked.includes(item.id) ? '♥' : '♡'}</span>
                                                <span className="font-semibold">
                                                          {item.like_count || 0}
                                                </span>
                                            </button>
                                        )}
                                    </div>

                                    {item.audio ? (
                                        <div
                                            className="mx-3 mb-3 rounded-xl p-2"
                                            style={{
                                                background: `linear-gradient(135deg, ${colors[0]}15, ${colors[1]}15)`,
                                                border: `1px solid ${colors[0]}25`,
                                            }}
                                        >
<AudioPlayer src={audioSrc(item.audio)} />
                                        </div>
                                    ) : (
                                        <div
                                            className="mx-3 mb-3 flex h-10 items-center justify-center rounded-xl text-xs font-semibold text-white"
                                            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                                        >
                                            音源を処理中...
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {parts.length === 0 && (
                            <p className="py-3 text-center text-xs" style={{ color: '#6b7fb8' }}>
                                まだ参加者がいません。最初の参加者になりましょう！
                            </p>
                        )}
                    </div>
                )}


                {/* ── タイムラインタブ ── */}
                {tab === 'タイムライン' && (
                    <div>
                        {/* 統計 */}
                        <div className="mb-4 grid grid-cols-3 gap-3">
                            {[
                                { label: '参加者', value: uniqueUsers.length },
                                { label: '経過日数', value: `${Math.max(1, Math.floor((Date.now() - new Date(thread?.created_at).getTime()) / 86400000))}日` },
                                { label: 'パート数', value: parts.length },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-2xl p-3 text-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.85)',
                                        border: '1px solid rgba(255,255,255,0.7)',
                                        boxShadow: '0 2px 12px rgba(139,92,246,0.06)',
                                    }}
                                >
                                    <p
                                        className="text-xl font-black"
                                        style={{ color: '#7C3AED', fontFamily: "'Nunito', sans-serif" }}
                                    >
                                        {s.value}
                                    </p>
                                    <p className="text-xs font-semibold text-zinc-400">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* 流れ */}
                        <div className="relative">
                            {[
                                {
                                    id: 'origin',
                                    user: thread?.username || post.user,
                                    instrument: post.instrument || 'Guitar',
                                    label: '元音源を投稿',
                                    time: timeAgo(thread?.created_at || new Date()),
                                    i: 0,
                                },
                                ...parts.map((p, i) => ({
                                    id: p.id,
                                    user: p.username,
                                    instrument: p.instrument,
                                    label: 'パートで参加',
                                    time: timeAgo(p.created_at),
                                    i: i + 1,
                                })),
                            ].map((item, idx, arr) => {
                                const colors = PART_GRADIENTS[item.i % PART_GRADIENTS.length]
                                return (
                                    <div key={item.id} className="relative flex gap-3 pb-4">
                                        {idx < arr.length - 1 && (
                                            <div
                                                className="absolute left-5 top-11 bottom-0 w-0.5 rounded-full"
                                                style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.35), rgba(139,92,246,0.05))' }}
                                            />
                                        )}

                                        <div className="z-10 flex-shrink-0"><UserAvatar name={item.user} index={item.i} size={40} /></div>

                                        <div
                                            className="min-w-0 flex-1 p-3"
                                            style={{
                                                background: 'rgba(255,255,255,0.85)',
                                                border: '1px solid rgba(255,255,255,0.7)',
                                                borderRadius: '16px',
                                                boxShadow: '0 2px 12px rgba(139,92,246,0.06)',
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className="truncate text-sm font-black text-zinc-700"
                                                    style={{ fontFamily: "'Nunito', sans-serif" }}
                                                >
                                                    {item.user}
                                                </p>
                                                <span
                                                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                                    style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }}
                                                >
                                                    #{item.instrument}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-zinc-400">
                                                {item.label} · {item.time}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── コメントタブ ── */}
                {tab === 'コメント' && (
                    <div>
                        <div className="mb-4 space-y-3">
                            {comments.length === 0 ? (
                                <EmptyState icon="comment" title="まだコメントがありません" text="最初のコメントを書いてみましょう" />
                            ) : (
                                comments.map((c, i) => (
                                    <div
                                        key={c.id}
                                        className="flex gap-3"
                                    >
                                        <UserAvatar name={c.username} index={i} size={36} />
                                        <div
                                            className="min-w-0 flex-1 p-3"
                                            style={{
                                                background: 'rgba(255,255,255,0.85)',
                                                border: '1px solid rgba(255,255,255,0.7)',
                                                borderRadius: '4px 16px 16px 16px',
                                                boxShadow: '0 2px 12px rgba(139,92,246,0.06)',
                                            }}
                                        >
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <p
                                                    className="truncate text-xs font-black"
                                                    style={{ color: '#6D28D9', fontFamily: "'Nunito', sans-serif" }}
                                                >
                                                    {c.username}
                                                </p>
                                                <p className="flex-shrink-0 text-[10px] text-zinc-400">
                                                    {timeAgo(c.created_at)}
                                                </p>
                                            </div>
                                            <p className="text-sm leading-relaxed text-zinc-600">{c.body}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 入力欄 */}
                        <div
                            className="flex items-center gap-2 rounded-2xl p-2"
                            style={{
                                background: 'rgba(255,255,255,0.9)',
                                border: '1px solid rgba(139,92,246,0.15)',
                                boxShadow: '0 2px 12px rgba(139,92,246,0.06)',
                            }}
                        >
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                placeholder="コメントを入力..."
                                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                            />
                            <button
                                onClick={handleComment}
                                disabled={!comment.trim() || sending}
                                className="rounded-xl px-4 py-2 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-40"
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #818cf8)',
                                    fontFamily: "'Nunito', sans-serif",
                                }}
                            >
                                {sending ? '...' : '送信'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 参加ボタン */}
            <div
                className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 px-4 pb-5 pt-6"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%)' }}
            >
                <button
                    onClick={() => {
                        if (guest) { onNeedLogin(); return }
                        onJoin({ ...post, audioUrl: thread?.converted_audio_url || thread?.audio_url })
                    }}
                    className="w-full rounded-full py-4 text-base font-black text-white transition hover:opacity-90"
                    style={{
                        background: 'linear-gradient(90deg, #8ab4ff, #f4a6d7)',
                        fontFamily: "'Nunito', sans-serif",
                        boxShadow: '0 6px 20px rgba(138,180,255,0.5)',
                    }}
                >
                    {guest ? '登録して、セッションに参加する' : 'このセッションに参加する'}
                </button>
            </div>

        </div>
    )
}