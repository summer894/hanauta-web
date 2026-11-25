// ── APIサーバーのURL ──────────────────────────────────
// メンバーBのExpressサーバーのアドレス
export const BASE_URL = import.meta.env.VITE_API_URL || 'https://hanauta-api.onrender.com'

// ── トークン管理 ──────────────────────────────────────
// ログイン後に受け取るJWTトークンを保存・取得・削除する関数

export function saveToken(token) {
  localStorage.setItem('token', token)
}

export function getToken() {
  return localStorage.getItem('token')
}

export function removeToken() {
  localStorage.removeItem('token')
}

// ── 共通fetch関数 ─────────────────────────────────────
// 毎回同じ設定を書かなくて済むようにまとめた関数
// Authorization ヘッダーにJWTトークンを自動でつける

async function request(method, path, body = null) {
  const token = getToken()

  const headers = {}
  if (body && !(body instanceof FormData)) {
    // 通常のJSON送信
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    // ログイン済みの場合はトークンをつける
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body               // 音声ファイル送信の場合
        : JSON.stringify(body) // 通常のJSON送信の場合
      : null,
  })

  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }

  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}: ${text.slice(0, 80)}`)
  }
  if (data === null) {
    throw new Error(`返事が空でした (HTTP ${res.status} / ${res.redirected ? '転送あり' : '転送なし'} / ${res.url})`)
  }

  return data
}

// ── 認証API ───────────────────────────────────────────

// 会員登録
// 引数：{ username, email, password }
// 戻り値：{ user, token }
export async function register(username, email, password) {
  return request('POST', '/api/auth/register', { username, email, password })
}

// ログイン
// 引数：email, password
// 戻り値：{ user, token }
export async function login(email, password) {
  return request('POST', '/api/auth/login', { email, password })
}

// ── スレッドAPI ───────────────────────────────────────

// スレッド一覧取得
// 戻り値：{ threads: [...] }
export async function getThreads() {
  return request('GET', '/api/threads')
}

// スレッド詳細取得（参加パート・コメント含む）
// 引数：スレッドのid
// 戻り値：{ thread, parts, comments }
export async function getThread(id) {
  return request('GET', `/api/threads/${id}`)
}

// スレッド作成（音声ファイル付き）
// 引数：title, description, audioBlob（録音した音声）
// 戻り値：{ thread }
export async function createThread(title, description, audioBlob, instrument, theme, convertedUrl) {
  const form = new FormData()
  form.append('title', title)
  if (description) form.append('description', description)
  if (instrument) form.append('instrument', instrument)
  if (theme) form.append('theme', theme)
  if (convertedUrl) form.append('converted_url', convertedUrl)
  form.append('audio', audioBlob, 'recording.webm')
  return request('POST', '/api/threads', form)
}
// ── パートAPI ─────────────────────────────────────────

// パート参加投稿（鼻歌音声ファイルをスレッドに追加）
// 引数：threadId, instrument（楽器名）, audioBlob（録音した音声）
// 戻り値：{ part }
export async function createPart(threadId, instrument, audioBlob, convertedUrl) {
  const form = new FormData()
  form.append('instrument', instrument)
  if (convertedUrl) form.append('converted_url', convertedUrl)
  form.append('audio', audioBlob, 'recording.webm')
  return request('POST', `/api/threads/${threadId}/parts`, form)
}

// いいね
// 引数：partId
export async function likePart(partId) {
  return request('POST', `/api/parts/${partId}/likes`)
}

// コメント投稿
// 引数：threadId, text
export async function createComment(threadId, text) {
  return request('POST', `/api/threads/${threadId}/comments`, { body: text })
}
// 試し聴き：変換だけ行い、結果の音声URLを返す（DBには保存されない）
export async function previewConvert(instrument, audioBlob) {
  const form = new FormData()
  form.append('instrument', instrument)
  form.append('audio', audioBlob, 'recording.webm')
  return request('POST', '/api/threads/preview', form)
}
export async function saveAvatar(avatar) {
  return request('PUT', '/api/users/me/avatar', { avatar })
}

export async function getAvatars() {
  return request('GET', '/api/users/avatars')
}

export async function analyzeAudio(instrument, audioBlob) {
  const form = new FormData()
  form.append('instrument', instrument)
  form.append('audio', audioBlob, 'recording.webm')
  return request('POST', '/api/threads/analyze', form)
}

export async function renderNotes(instrument, notes) {
  return request('POST', '/api/threads/render', { instrument, notes })
}