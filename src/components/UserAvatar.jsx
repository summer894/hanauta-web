import { useState, useEffect } from 'react'
import { saveAvatar, getAvatars } from '../api'
import LineIcon from './LineIcon'

const COLORS = ['#f6b7d6', '#9cc5ff', '#a8e6c1', '#ffd88a', '#c9b8ff', '#ffb98a', '#ff9fb2', '#8fd8f5']

export const SAMPLES = [
  { id: 'cat',    emoji: '🐱', bg: '#ffd1e8' },
  { id: 'rabbit', emoji: '🐰', bg: '#ffe7b8' },
  { id: 'bear',   emoji: '🐻', bg: '#e8d3b9' },
  { id: 'fox',    emoji: '🦊', bg: '#ffd2a8' },
  { id: 'panda',  emoji: '🐼', bg: '#dfe7ff' },
  { id: 'frog',   emoji: '🐸', bg: '#c9f0d2' },
  { id: 'penguin',emoji: '🐧', bg: '#cfe8ff' },
  { id: 'flower', emoji: '🌸', bg: '#ffd9ea' },
  { id: 'note',   emoji: '🎵', bg: '#e3d9ff' },
  { id: 'star',   emoji: '⭐', bg: '#fff0b8' },
]

const cache = {}   // { 名前: avatar } を覚えておくメモ

export function getAvatar(name) {
  return cache[name] || null
}

// サーバーから全員分を取得してメモに入れる
export async function loadAvatars() {
  try {
    const r = await getAvatars()
    Object.keys(cache).forEach((k) => delete cache[k])
    Object.assign(cache, r.avatars || {})
    window.dispatchEvent(new Event('avatar-changed'))
  } catch {}
}

// 自分のアイコンを保存する(失敗したら例外)
export async function setAvatar(name, value) {
  await saveAvatar(value || null)
  if (value) cache[name] = value
  else delete cache[name]
  window.dispatchEvent(new Event('avatar-changed'))
}

// 写真を128pxの正方形に切り抜いて小さくする（保存容量を抑えるため）
export function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = c.height = 128
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function UserAvatar({ name = '?', index = 0, size = 36, radius = '50%', fill = false }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const f = () => setTick((t) => t + 1)
    window.addEventListener('avatar-changed', f)
    return () => window.removeEventListener('avatar-changed', f)
  }, [])

  const v = getAvatar(name)
  const box = fill ? { width: '100%', height: '100%' } : { width: size, height: size }
  const base = {
    ...box, borderRadius: radius, flexShrink: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  if (v && v.startsWith('data:')) {
    return <div style={base}><img src={v} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
  }
  if (v && v.startsWith('sample:')) {
    const s = SAMPLES.find((x) => x.id === v.slice(7))
    if (s) return <div style={{ ...base, background: s.bg, fontSize: fill ? 30 : size * 0.55 }}>{s.emoji}</div>
  }
  return (
    <div style={{ ...base, background: COLORS[index % COLORS.length], color: '#fff', fontWeight: 900, fontSize: fill ? 20 : size * 0.45 }}>
      {String(name)[0].toUpperCase()}
    </div>
  )
}