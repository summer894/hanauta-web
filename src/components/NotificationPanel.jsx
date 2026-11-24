import { useState } from 'react'
import UserAvatar from './UserAvatar'
import LineIcon from './LineIcon'

const NAVY = '#27407f'
const SUB = '#6b7fb8'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

const AVATAR_COLORS = ['#f6b7d6', '#9cc5ff', '#a8e6c1', '#ffd88a', '#c9b8ff']

// サーバーに通知APIができるまでは、サンプルを表示
const SAMPLE = [
    { id: 1, user: 'haru', text: 'があなたのセッションに「ベース」で参加しました', time: '5分前', unread: true },
    { id: 2, user: 'mio', text: 'があなたのパートにいいねしました', time: '1時間前', unread: true },
    { id: 3, user: 'ren', text: 'がコメントしました：「いい感じ！」', time: '昨日', unread: false },
]

export default function NotificationPanel({ onClose }) {
    const [items, setItems] = useState(SAMPLE)
    const unread = items.filter((n) => n.unread).length

    return (
        <div
            className="fixed inset-0"
            style={{ zIndex: 60, background: 'rgba(39,64,127,0.25)' }}
            onClick={onClose}
        >
            <div
                className="mx-auto mt-16 max-w-md p-4"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 'calc(100% - 32px)',
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    borderRadius: 24,
                    boxShadow: '0 12px 40px rgba(90,110,200,0.3)',
                }}
            >
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-base font-black" style={{ color: NAVY, ...NUNITO }}>
                        通知{unread > 0 && `（${unread}）`}
                    </p>
                    <div className="flex items-center gap-2">
                        {unread > 0 && (
                            <button
                                onClick={() => setItems((p) => p.map((n) => ({ ...n, unread: false })))}
                                className="text-xs font-bold"
                                style={{ color: '#4a78d4' }}
                            >
                                すべて既読
                            </button>
                        )}
                        <button onClick={onClose} className="px-2 text-lg" style={{ color: '#9aa5c4' }}>✕</button>
                    </div>
                </div>

                <p className="mb-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: 'rgba(255,240,220,0.9)', color: '#d9822b' }}>
                    ⚠️ 通知機能は準備中です。表示はサンプルです
                </p>

                <div className="space-y-2">
                    {items.map((n, i) => (
                        <div
                            key={n.id}
                            className="flex items-start gap-3 rounded-2xl p-3"
                            style={{ background: n.unread ? 'rgba(127,178,255,0.16)' : 'rgba(255,255,255,0.6)' }}
                        >
<UserAvatar name={n.user} index={i} size={36} />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs leading-relaxed" style={{ color: NAVY }}>
                                    <span className="font-black">{n.user}</span>{n.text}
                                </p>
                                <p className="mt-0.5 text-[10px]" style={{ color: SUB }}>{n.time}</p>
                            </div>
                            {n.unread && (
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: '#ff6fa8' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}