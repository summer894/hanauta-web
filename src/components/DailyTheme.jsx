import LineIcon from './LineIcon'
const NAVY   = '#27407f'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

// 鼻歌でこたえやすい、イメージ系のお題（自由に増やせます）
export const THEMES = [
  '雨上がりの帰り道', '朝のコーヒー', '夏の夕暮れ', '眠れない夜',
  '初めての街', '散歩の足取り', '好きな人を待つ時間', '窓から見える空',
  '休日の昼下がり', '雪の降る朝', '電車の窓の景色', '少し怖い夜道',
  'うれしい知らせ', '海辺でぼんやり', '帰りたくない日曜', '駆け出したくなる春',
  'ひとりのカフェ', '懐かしい教室', '星空のドライブ', 'ご褒美のデザート',
]

// 日付から「今日のお題」を決める（同じ日は全員同じ）
export function getTodayTheme(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date - start) / 86400000)
  return THEMES[dayOfYear % THEMES.length]
}

export default function DailyTheme({ onPost }) {
  const theme = getTodayTheme()
  return (
    <div
      className="mx-4 mt-3 flex items-center gap-3 p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,236,246,0.85))',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 22,
        boxShadow: '0 4px 20px rgba(255,140,190,0.2)',
      }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xl"
        style={{ background: 'linear-gradient(135deg, #ffd1e8, #ffe7b8)' }}
      >
      <LineIcon name="sparkle" size={22} color="#d9669a" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold" style={{ color: '#d9669a', letterSpacing: '0.1em' }}>
          TODAY'S THEME
        </p>
        <p className="truncate text-base font-black" style={{ color: NAVY, ...NUNITO }}>
          「{theme}」
        </p>
        <p className="text-[11px]" style={{ color: '#6b7fb8' }}>
          このイメージで投稿してみよう！
        </p>
      </div>
      <button
        onClick={() => onPost(theme)}
        className="flex-shrink-0 rounded-full px-4 py-2 text-xs font-black text-white transition hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #ff9ac4, #ffb86b)', ...NUNITO }}
      >
        投稿する
      </button>
    </div>
  )
}