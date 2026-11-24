import { useState } from 'react'
import { login, register, saveToken } from '../api'
import LineIcon from '../components/LineIcon'
import EmptyState from '../components/EmptyState'
import AudioPlayer from '../components/AudioPlayer'

const NAVY   = '#27407f'
const SUB    = '#6b7fb8'
const ACCENT = 'linear-gradient(135deg, #7fb2ff, #a58bff)'
const SKY    = 'linear-gradient(180deg, #9ec9ff 0%, #bcc0ff 38%, #f2c4e8 72%, #ffe1d4 100%)'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

const CLOUDS = [
  { top: '4%',  left: '-10%', w: 280, h: 90,  o: 0.75, anim: 'cloud-drift-a 26s' },
  { top: '14%', left: '60%',  w: 240, h: 80,  o: 0.6,  anim: 'cloud-drift-b 32s' },
  { top: '42%', left: '-15%', w: 300, h: 100, o: 0.5,  anim: 'cloud-drift-b 38s' },
  { top: '58%', left: '55%',  w: 280, h: 90,  o: 0.55, anim: 'cloud-drift-a 30s' },
  { top: '80%', left: '10%',  w: 320, h: 110, o: 0.6,  anim: 'cloud-drift-b 34s' },
]

const INPUT = {
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(127,178,255,0.35)',
  color: NAVY,
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode]         = useState('login')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit() {
    setError('')

    if (mode === 'register' && !name.trim()) {
      setError('ユーザー名を入力してください')
      return
    }
    if (!email.trim()) {
      setError('メールアドレスを入力してください')
      return
    }
    if (!password.trim()) {
      setError('パスワードを入力してください')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)
    try {
      const result =
        mode === 'register'
          ? await register(name, email, password)
          : await login(email, password)

      saveToken(result.token)
      onLogin({
        id:    result.user.id,
        name:  result.user.username,
        email: result.user.email,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setError('')
  }

  return (
    <div className="relative min-h-screen">

      {/* 空の背景 */}
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
              animation: `${c.anim} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12"
        style={{ zIndex: 1 }}
      >
        <div className="w-full max-w-sm">

          {/* ロゴ */}
          <div className="mb-8 text-center">
            <h1
              style={{
                fontFamily: "'Yellowtail', cursive",
                fontSize: '72px',
                lineHeight: 1.3,
                padding: '0 12px 8px',
                background: 'linear-gradient(135deg, #3b5bdb, #7c5cff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              HumSession
            </h1>
            <p className="text-sm font-bold" style={{ color: SUB, ...NUNITO }}>
              鼻歌でつながる音楽コミュニティ
            </p>
          </div>

          {/* カード */}
          <div
            className="p-6"
            style={{
              background: 'rgba(255,255,255,0.62)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.85)',
              borderRadius: 28,
              boxShadow: '0 8px 32px rgba(90,110,200,0.18)',
            }}
          >
            {/* タブ */}
            <div
              className="mb-5 grid grid-cols-2 gap-1 p-1"
              style={{ background: 'rgba(127,178,255,0.15)', borderRadius: 999 }}
            >
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="rounded-full py-2.5 text-sm font-black transition"
                  style={{
                    background: mode === m ? ACCENT : 'transparent',
                    color: mode === m ? 'white' : '#8c98bd',
                    boxShadow: mode === m ? '0 3px 10px rgba(127,178,255,0.5)' : 'none',
                    ...NUNITO,
                  }}
                >
                  {m === 'login' ? 'ログイン' : '新規登録'}
                </button>
              ))}
            </div>

            <div className="space-y-4">

              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold" style={{ color: NAVY }}>
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：haru"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={INPUT}
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold" style={{ color: NAVY }}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="例：haru@example.com"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={INPUT}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold" style={{ color: NAVY }}>
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="8文字以上"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={INPUT}
                />
              </div>

              {error && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm font-semibold"
                  style={{ background: 'rgba(255,111,168,0.12)', color: '#e0457f' }}
                >
                  <LineIcon name="alert" size={14} color="#e0457f" /> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-full py-3.5 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: ACCENT,
                  boxShadow: '0 6px 18px rgba(127,178,255,0.55)',
                  ...NUNITO,
                }}
              >
                {loading ? '通信中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
              </button>
            </div>
          </div>

          {/* ゲスト */}
          <div className="mt-5 text-center">
            <button
              onClick={() => onLogin({ name: 'ゲスト', email: '' })}
              className="text-sm font-bold underline underline-offset-4"
              style={{ color: SUB, ...NUNITO }}
            >
              ゲストとして試す（APIを使わない）
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}