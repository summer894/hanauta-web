export function threadUrl(id) {
  return `${window.location.origin}${window.location.pathname}?t=${id}`
}

// スマホは共有メニュー、使えない場合はリンクをコピーする
export async function shareThread(id, title) {
  const url = threadUrl(id)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${title} | HumSession`,
        text: '鼻歌で曲をつくるセッションに参加しよう',
        url,
      })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancel'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    window.prompt('このリンクをコピーしてください', url)
    return 'manual'
  }
}