import { useState, useEffect } from 'react'
import { getToken, removeToken, getThread } from './api'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import RecordPage from './pages/RecordPage'
import ThreadPage from './pages/ThreadPage'
import SavedPage from './pages/SavedPage'
import SearchPage from './pages/SearchPage'
import AccountPage from './pages/AccountPage'
import NotificationPanel from './components/NotificationPanel'
import './App.css'
import { loadAvatars } from './components/UserAvatar'

const SKY = 'linear-gradient(180deg, #9ec9ff 0%, #bcc0ff 38%, #f2c4e8 72%, #ffe1d4 100%)'
const ACCENT = 'linear-gradient(135deg, #7fb2ff, #a58bff)'

const CLOUDS = [
  { top: '4%',  left: '-10%', w: 280, h: 90,  o: 0.75, anim: 'cloud-drift-a 26s' },
  { top: '14%', left: '60%',  w: 240, h: 80,  o: 0.6,  anim: 'cloud-drift-b 32s' },
  { top: '38%', left: '-15%', w: 300, h: 100, o: 0.5,  anim: 'cloud-drift-b 38s' },
  { top: '55%', left: '55%',  w: 280, h: 90,  o: 0.55, anim: 'cloud-drift-a 30s' },
  { top: '78%', left: '10%',  w: 320, h: 110, o: 0.6,  anim: 'cloud-drift-b 34s' },
]

// 画面全体の空の背景
function Sky() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden',
        background: SKY,
      }}
    >
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: c.top, left: c.left,
            width: c.w, height: c.h, borderRadius: '50%',
            background: 'white', opacity: c.o, filter: 'blur(24px)',
            background: 'white', opacity: c.o, filter: 'blur(24px)',
            animation: `${c.anim} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a6fd8"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 003.4 0" />
    </svg>
  )
}

function NavIcon({ name, color }) {
  const common = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  }
  switch (name) {
    case 'ホーム':
      return (
        <svg {...common}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      )
    case '探す':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      )
    case '録音':
      return (
        <svg {...common} strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case '保存済み':
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      )
    case 'アカウント':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      )
    default:
      return null
  }
}

const NAV = [
  { name: 'ホーム' },
  { name: '探す' },
  { name: '録音' },
  { name: '保存済み' },
  { name: 'アカウント' },
]
const getThreadIdFromUrl = () => {
  const n = Number(new URLSearchParams(window.location.search).get('t'))
  return Number.isInteger(n) && n > 0 ? n : null
}

const setUrlThread = (id) => {
  const url = id ? `${window.location.pathname}?t=${id}` : window.location.pathname
  window.history.replaceState({}, '', url)
}
export default function App() {
  const [user, setUser] = useState(() => {
    const token = getToken()
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return { id: payload.id, name: payload.username, email: '' }
    } catch {
      return null
    }
  })

  const [page, setPage]                 = useState('ホーム')
  const [thread, setThread]             = useState(null)
  const [threadIndex, setThreadIndex]   = useState(0)
  const [savedParts, setSavedParts]     = useState([])
  const [remixParts, setRemixParts]     = useState([])
  const [joinThreadId, setJoinThreadId] = useState(null)
  const [joinAudio, setJoinAudio] = useState(null)
    const [threadTab, setThreadTab] = useState('パート')
    const [themeTitle, setThemeTitle] = useState('')
    const [showNotif, setShowNotif] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)

  const guestView = !user && !!getThreadIdFromUrl() && !needLogin
      async function openById(id) {
    try {
      const d = await getThread(id)
      const t = d.thread
      setThread({
        id: t.id,
        user: t.username,
        title: t.title,
        instrument: t.instrument || 'Guitar',
        genre: 'Session',
        theme: t.theme || null,
        wantedParts: ['参加者募集中'],
        parts: [],
      })
      setThreadTab('パート')
      setPage('スレッド')
    } catch {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  // ログインしたとき、URLに ?t= があれば、その投稿を開く
  useEffect(() => {
    const id = getThreadIdFromUrl()
    if (id) openById(id)
  }, [user])
  const [searchWord, setSearchWord] = useState('')

  useEffect(() => { if (user) loadAvatars() }, [user])

  // ログインしていなくて、リンクで開いた投稿を見る場合は、ログイン画面を出さない
  if (!user && !guestView) {
    const hasLink = !!getThreadIdFromUrl()
    return (
      <LoginPage
        notice={needLogin ? '続けるには、ログインまたは登録をしてください' : ''}
        onBack={hasLink ? () => setNeedLogin(false) : null}
        onLogin={(u) => {
          setUser(u)
          setNeedLogin(false)
          if (!getThreadIdFromUrl()) setPage('ホーム')
        }}
      />
    )
  }

  function handleSavePart(part) {
    setSavedParts((prev) => (prev.find((p) => p.id === part.id) ? prev : [...prev, part]))
  }

  function handleRemovePart(id) {
    setSavedParts((prev) => prev.filter((p) => p.id !== id))
  }

  function openThread(post, index, tab = 'パート') {
    setThread(post)
    setThreadIndex(index)
    setThreadTab(tab)
    setUrlThread(post.id)
    setPage('スレッド')
  }

  function joinSession(post) {
    setJoinThreadId(post.id)
    setJoinAudio(post.audioUrl || null)
    setPage('録音')
  }

  function startRemixSession(parts) {
    setRemixParts(parts)
    setPage('録音')
  }

  function handleLogout() {
    removeToken()
    setUser(null)
    setPage('ホーム')
  }

  const requireLogin = () => {
    if (user) return true
    setNeedLogin(true)
    return false
  }

  function renderPage() {
    switch (page) {
      case 'ホーム':
        return <HomePage
            onNavigate={(p, theme) => { if (theme) setThemeTitle(theme); setPage(p) }}
            onOpenThread={openThread}
            onTag={(t) => { setSearchWord('#' + t); setPage('探す') }}
          />
      case '探す':
        return <SearchPage key={searchWord} onOpenThread={openThread} initialKeyword={searchWord} />
      case '録音':
        return (
          <RecordPage
            remixParts={remixParts}
            onClearRemix={() => setRemixParts([])}
            threadId={joinThreadId}
            onDone={() => { setJoinThreadId(null); setPage('ホーム') }}
            initialTitle={themeTitle}
            refAudio={joinAudio}
          />
        )
      case 'スレッド':
        return (
          <ThreadPage
            post={thread}
            index={threadIndex}
            onBack={() => {
              setUrlThread(null)
              setJoinThreadId(null)
              if (!user) { setNeedLogin(true); return }
              setPage('ホーム')
            }}
            onJoin={joinSession}
            onSavePart={handleSavePart}
            initialTab={threadTab}
            guest={!user}
            onNeedLogin={requireLogin}
          />
        )
      case '保存済み':
        return (
          <SavedPage
            savedParts={savedParts}
            onRemove={handleRemovePart}
            onStartSession={startRemixSession}
          />
        )
      case 'アカウント':
                return <AccountPage user={user} onLogout={handleLogout} onOpenThread={openThread} />
      default:
        return null
    }
  }

  const showChrome = page !== 'スレッド'

  return (
    <div className="min-h-screen">
      <Sky />

      <div className="relative mx-auto min-h-screen max-w-md" style={{ zIndex: 1 }}>

        {/* ヘッダー（z-indexを高くして、ヒーローと重ならないようにする） */}
        {showChrome && (
          <header
            className="sticky top-0 px-5 py-2.5"
            style={{
              zIndex: 40,
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderBottom: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            <div className="flex items-center justify-between">
              <h1
                style={{
                  fontFamily: "'Yellowtail', cursive",
                  fontSize: '38px',
                  lineHeight: 1.25,
                  paddingRight: '6px',
                  background: 'linear-gradient(135deg, #3b5bdb, #7c5cff 55%, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                HumSession
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: ACCENT, fontFamily: "'Nunito', sans-serif" }}
                >
                {user ? (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: ACCENT, fontFamily: "'Nunito', sans-serif" }}
                  >
                    {user.name}
                  </span>
                ) : (
                  <button
                    onClick={() => setNeedLogin(true)}
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: ACCENT, fontFamily: "'Nunito', sans-serif" }}
                  >
                    ログイン
                  </button>
                )}
                </span>
                <button
                                    onClick={() => setShowNotif(true)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                >
                  <BellIcon />
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                    style={{ background: '#ff6fa8' }}
                  />
                </button>
              </div>
            </div>
          </header>
        )}

        {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
        <main key={page} className="page-in">{renderPage()}</main>

        {/* 浮いているナビバー */}
        {showChrome && (
          <nav
            className="fixed bottom-3 left-1/2 -translate-x-1/2 px-2 pb-2 pt-2"
            style={{
              zIndex: 30,
              width: 'calc(100% - 24px)',
              maxWidth: '420px',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.85)',
              borderRadius: '28px',
              boxShadow: '0 8px 28px rgba(90,110,200,0.2)',
            }}
          >
            <div className="grid grid-cols-5 items-end">
              {NAV.map((item) => {
                const isActive = page === item.name
                const hasBadge = item.name === '保存済み' && savedParts.length > 0
                const color = isActive ? '#5b8def' : '#9aa5c4'
                const isRec = item.name === '録音'
                return (
                  <button
                    key={item.name}
                    onClick={() => {setUrlThread(null); setJoinThreadId(null); if (item.name === '探す') setSearchWord(''); setPage(item.name) }}
                    className="relative flex flex-col items-center justify-center gap-0.5"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    {isRec ? (
                      <span
                        className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full text-white transition hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #7fb2ff, #b08cff)',
                          border: '4px solid rgba(255,255,255,0.9)',
                          boxShadow: '0 6px 18px rgba(127,140,255,0.5)',
                        }}
                      >
                        <NavIcon name={item.name} color="white" />
                      </span>
                    ) : (
                      <span className="relative flex h-8 w-8 items-center justify-center">
                        <NavIcon name={item.name} color={color} />
                        {hasBadge && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white">
                            {savedParts.length}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="text-[10px] font-bold" style={{ color }}>
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}