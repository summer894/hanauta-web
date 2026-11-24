import { useState, useRef, useEffect } from 'react'
import { createThread, createPart, previewConvert, analyzeAudio, renderNotes, BASE_URL } from '../api'
import PianoRoll from '../components/PianoRoll'
import RemixPanel from '../components/RemixPanel'
import LineIcon from '../components/LineIcon'
import EmptyState from '../components/EmptyState'
import AudioPlayer from '../components/AudioPlayer'

const INSTRUMENTS = [
  { id: 'guitar', emoji: '🎸', name: 'ギター',     desc: 'Guitar'  },
  { id: 'bass',   emoji: '🎵', name: 'ベース',     desc: 'Bass'    },
  { id: 'piano',  emoji: '🎹', name: 'ピアノ',     desc: 'Piano'   },
  { id: 'kick',   emoji: '🥁', name: 'キック',     desc: 'Kick'    },
  { id: 'snare',  emoji: '🥁', name: 'スネア',     desc: 'Snare'   },
  { id: 'hihat',  emoji: '🥁', name: 'ハイハット', desc: 'Hi-hat'  },
]

const NAVY   = '#27407f'
const SUB    = '#6b7fb8'
const ACCENT = 'linear-gradient(135deg, #7fb2ff, #a58bff)'
const REC    = 'linear-gradient(135deg, #ff8fb1, #ff6fa8)'
const NUNITO = { fontFamily: "'Nunito', sans-serif" }

const GLASS = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 24,
  boxShadow: '0 4px 20px rgba(90,110,200,0.12)',
}

const INPUT = {
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(127,178,255,0.35)',
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function MicIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0014 0" />
      <path d="M12 18v4" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

const TIPS = [
  { icon: '🔇', text: '静かな場所で録音しよう' },
  { icon: '🎤', text: 'マイクに近づいて、はっきり歌う' },
  { icon: '🎵', text: '「ラ〜」「ん〜」と、ゆっくり音を伸ばす' },
  { icon: '⏱', text: '短く区切らず、ひとつの音を1秒ほど保つ' },
]

// 楽器ごとのヒント（種類は、音程を使うメロディ系と、リズム系）
const INST_HINT = {
  guitar: { kind: 'melody', text: '音の高さが大切。「ラ〜」とゆっくり、はっきり歌おう' },
  bass:   { kind: 'melody', text: '低めの声で、ゆっくり音を伸ばすと伝わりやすいよ' },
  piano:  { kind: 'melody', text: '音の高さが大切。ひとつずつ区切らず、なめらかに歌おう' },
  kick:   { kind: 'rhythm', text: '「ドン」と低く、リズムよく声を出そう' },
  snare:  { kind: 'rhythm', text: '「タン」と鋭く、リズムよく声を出そう' },
  hihat:  { kind: 'rhythm', text: '「チッ」と軽く、細かいリズムで声を出そう' },
}

function TipsCard() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}
    >
      <p className="mb-2 text-xs font-black" style={{ color: '#4a78d4', fontFamily: "'Nunito', sans-serif" }}>
        きれいに変換するコツ
      </p>
      <ul className="space-y-1.5">
        {TIPS.map((t) => (
          <li key={t.text} className="flex items-start gap-2 text-xs" style={{ color: '#5d6e9e' }}>
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RecordPage({ remixParts, onClearRemix, threadId, onDone, initialTitle = '', refAudio = null }) {
  const [step, setStep]                 = useState(1)
  const [isRecording, setIsRecording]   = useState(false)
  const [seconds, setSeconds]           = useState(0)
  const [audioURL, setAudioURL]         = useState(null)
  const [audioBlob, setAudioBlob]       = useState(null)
  const [selectedInst, setSelectedInst] = useState(null)
  const [title, setTitle]               = useState(initialTitle)
  const [description, setDescription]   = useState('')
  const [isPosting, setIsPosting]       = useState(false)
  const [postError, setPostError]       = useState('')
  const [refSec, setRefSec] = useState(null)

  useEffect(() => {
    if (!threadId || !refAudio) return
    const a = new Audio(refAudio.startsWith('http') ? refAudio : `${BASE_URL}${refAudio}`)
    a.addEventListener('loadedmetadata', () => {
      if (isFinite(a.duration)) setRefSec(Math.round(a.duration))
    })
  }, [threadId, refAudio])

  const [previewUrl, setPreviewUrl]   = useState(null)
  const [previewing, setPreviewing]   = useState(false)
  const [previewError, setPreviewError] = useState('')

  const [readyUrl, setReadyUrl]       = useState(null)
  const [notes, setNotes]             = useState([])
  const [editing, setEditing]         = useState(false)
  const [analyzing, setAnalyzing]     = useState(false)
  const [renderBusy, setRenderBusy]   = useState(false)
  const [dirty, setDirty]             = useState(false)
  const [analysisKey, setAnalysisKey] = useState(0)

  const absUrl = (u) => (u.startsWith('http') ? u : `${BASE_URL}${u}`)

  async function handleAnalyze() {
    setAnalyzing(true)
    setPreviewError('')
    try {
      const r = await analyzeAudio(selectedInst.name, audioBlob)
      setNotes(r.notes)
      setAnalysisKey((k) => k + 1)
      setEditing(true)
      setDirty(false)
    } catch (e) {
      setPreviewError(e.message || '解析に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleRender() {
    setRenderBusy(true)
    setPreviewError('')
    try {
      const r = await renderNotes(selectedInst.name, notes)
      setReadyUrl(r.url)
      setPreviewUrl(absUrl(r.url))
      setDirty(false)
    } catch (e) {
      setPreviewError(e.message || '音声の作成に失敗しました')
    } finally {
      setRenderBusy(false)
    }
  }

  async function handlePreview() {
    if (!audioBlob || !selectedInst) return
    setPreviewing(true)
    setPreviewError('')
    setPreviewUrl(null)
    setReadyUrl(r.url)
    try {
      const r = await previewConvert(selectedInst.name, audioBlob)
      setPreviewUrl(r.url.startsWith('http') ? r.url : `${BASE_URL}${r.url}`)
    } catch (e) {
      setPreviewError(e.message || '変換に失敗しました')
    } finally {
      setPreviewing(false)
    }
  }

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const timerRef         = useRef(null)
  const intervalRef      = useRef(null)
  const [levels, setLevels] = useState(Array(24).fill(0))
  const audioCtxRef = useRef(null)
  const rafRef      = useRef(null)

  function startMeter(stream) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    ctx.createMediaStreamSource(stream).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    audioCtxRef.current = ctx

    const tick = () => {
      analyser.getByteFrequencyData(data)
      // 低〜中音域の24区間を、0〜1の大きさにする
      const next = Array.from({ length: 24 }, (_, i) => {
        const v = data[Math.min(i + 1, data.length - 1)] / 255
        return Math.min(1, v * 1.4)
      })
      setLevels(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  function stopMeter() {
    cancelAnimationFrame(rafRef.current)
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    setLevels(Array(24).fill(0))
  }

  // 画面を離れたら止める
  useEffect(() => () => stopMeter(), [])

  // ── 録音開始 ──────────────────────────────────────────
  async function startRecording() {
    try {
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    autoGainControl: false,
    noiseSuppression: false,
    echoCancellation: false,
  },
})
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setReadyUrl(null); setPreviewUrl(null); setEditing(false); setDirty(false)
        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      startMeter(stream)
      mediaRecorderRef.current = mr
      setIsRecording(true)
      setSeconds(0)
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      timerRef.current = setTimeout(() => stopRecording(), 15000)
    } catch {
      alert('マイクのアクセスを許可してください')
    }
  }

  // ── 録音停止 ──────────────────────────────────────────
  function stopRecording() {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
    mediaRecorderRef.current?.stop()
    stopMeter()
    setIsRecording(false)
  }

  // ── 投稿する ──────────────────────────────────────────
  async function handlePost() {
    if (!threadId && !title.trim()) return
    if (!audioBlob || !selectedInst) return

    setIsPosting(true)
    setPostError('')
    try {
      if (threadId) {
        await createPart(threadId, selectedInst.name, audioBlob, readyUrl)
      } else {
        await createThread(title, description, audioBlob, selectedInst.name, initialTitle, readyUrl)
      }
      setStep(4)
    } catch (e) {
      setPostError(e.message || '投稿に失敗しました')
    } finally {
      setIsPosting(false)
    }
  }

  // ── リセット ──────────────────────────────────────────
  function reset() {
    setStep(1)
    setAudioURL(null)
    setAudioBlob(null)
    setSelectedInst(null)
    setTitle('')
    setDescription('')
    setPostError('')
    setSeconds(0)
        setPreviewUrl(null)
    setPreviewError('')
    if (onClearRemix) onClearRemix()
    setReadyUrl(null); setNotes([]); setEditing(false); setDirty(false)
  }

  const primaryBtn = {
    background: ACCENT,
    boxShadow: '0 6px 18px rgba(127,178,255,0.5)',
    ...NUNITO,
  }
  const backBtn = {
    background: 'rgba(255,255,255,0.7)',
    color: SUB,
    border: '1px solid rgba(255,255,255,0.9)',
    ...NUNITO,
  }

  return (
    <div className="px-4 pb-32 pt-5">

      {/* タイトル */}
      <div className="mb-5">
        <h2 className="text-2xl font-black" style={{ color: NAVY, ...NUNITO }}>
          {threadId ? 'セッションに参加' : 'セッションを始める'}
        </h2>
        <p className="mt-1 text-sm" style={{ color: SUB }}>
            {initialTitle ? `お題「${initialTitle}」のイメージで録音しよう` : '鼻歌を録音して、楽器の音に変換しよう'}
        </p>
      </div>

      {/* ステップ表示 */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {['録音', '楽器', '投稿'].map((label, i) => {
          const num     = i + 1
          const done    = step > num
          const current = step === num
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition"
                  style={{
                    background: done ? '#6fd6a8' : current ? ACCENT : 'rgba(255,255,255,0.75)',
                    color: done || current ? 'white' : '#9aa5c4',
                    boxShadow: current ? '0 3px 10px rgba(127,178,255,0.55)' : 'none',
                  }}
                >
                  {done ? '✓' : num}
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: current ? '#4a78d4' : '#8c98bd' }}
                >
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className="mb-4 h-0.5 w-10 rounded-full"
                  style={{ background: step > num ? '#6fd6a8' : 'rgba(255,255,255,0.7)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1：録音 ── */}
      {step === 1 && (
        <div className="space-y-4">

          {/* 保存した音源でセッション（選んだときだけ表示） */}
          <RemixPanel parts={remixParts || []} onClear={onClearRemix} />
          {threadId && refSec && (
            <div
              className="rounded-2xl p-4 text-xs"
              style={{ background: 'rgba(255,236,246,0.85)', border: '1px solid rgba(255,255,255,0.9)', color: '#c2548a' }}
            >
              <p className="font-black">元の音源の長さ：約{refSec}秒</p>
              <p className="mt-0.5" style={{ color: '#6b7fb8' }}>
                重ねたとき自然になるよう、{Math.max(1, refSec - 1)}〜{refSec + 1}秒くらいで録音しよう
              </p>
            </div>
          )}
                    <TipsCard />

          <div className="p-6" style={GLASS}>
            <div className="flex flex-col items-center gap-4">

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex h-28 w-28 items-center justify-center rounded-full transition hover:scale-105 ${
                  isRecording ? 'animate-pulse' : ''
                }`}
                style={{
                  background: isRecording ? REC : ACCENT,
                  border: '5px solid rgba(255,255,255,0.9)',
                  boxShadow: isRecording
                    ? '0 0 0 10px rgba(255,111,168,0.22), 0 8px 24px rgba(255,111,168,0.45)'
                    : '0 8px 24px rgba(127,140,255,0.5)',
                }}
              >
                {isRecording ? <StopIcon /> : <MicIcon />}
              </button>

              {/* 波形：マイクの音量で動く */}
              <div className="flex h-12 items-center gap-1">
                {levels.map((lv, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                      height: isRecording ? `${6 + lv * 40}px` : '6px',
                      background: isRecording ? '#7fb2ff' : 'rgba(127,178,255,0.3)',
                      transition: 'height 80ms linear',
                    }}
                  />
                ))}
              </div>

              <div className="text-center">
                <p
                  className="text-2xl font-black tabular-nums"
                  style={{ color: isRecording ? '#ff6fa8' : '#4a78d4', ...NUNITO }}
                >
                  {formatTime(seconds)}
                  <span className="text-sm font-bold" style={{ color: '#b8c1dc' }}> / {refSec ? formatTime(refSec) : '0:15'}</span>
                </p>
                <p className="mt-1 text-xs font-semibold" style={{ color: SUB }}>
                  {isRecording ? '録音中… もう一度タップで停止' : 'タップして鼻歌を録音'}
                </p>
              </div>
            </div>

            {audioURL && !isRecording && (
              <div
                className="mt-5 rounded-2xl p-3"
                style={{ background: 'rgba(127,178,255,0.12)', border: '1px solid rgba(127,178,255,0.25)' }}
              >
                <p className="mb-2 text-xs font-bold" style={{ color: '#4a78d4' }}>
                <span className="inline-flex items-center gap-1"><LineIcon name="note" size={14} color="#4a78d4" />録音した鼻歌</span>
                </p>
<AudioPlayer src={audioURL} />
                <button
                  onClick={() => { setAudioURL(null); setAudioBlob(null); setSeconds(0) }}
                  className="mt-2 text-xs font-semibold hover:text-red-400"
                  style={{ color: '#8c98bd' }}
                >
                  録音し直す
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!audioURL}
            className="w-full rounded-full py-4 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={primaryBtn}
          >
            次へ：楽器を選ぶ →
          </button>
        </div>
      )}

      {/* ── STEP 2：楽器選択 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-5" style={GLASS}>
            <p className="mb-4 text-sm font-bold" style={{ color: NAVY }}>
              変換したい楽器を選んでください
            </p>
            <div className="grid grid-cols-3 gap-3">
              {INSTRUMENTS.map((inst) => {
                const selected = selectedInst?.id === inst.id
                return (
                  <button
                    key={inst.id}
                                        onClick={() => { setSelectedInst(inst); setPreviewUrl(null); setReadyUrl(null); setEditing(false); setDirty(false) }}
                    className="rounded-2xl p-3 text-center transition hover:scale-105"
                    style={{
                      background: selected ? 'rgba(127,178,255,0.2)' : 'rgba(255,255,255,0.8)',
                      border: selected ? '2px solid #7fb2ff' : '2px solid rgba(255,255,255,0.9)',
                      boxShadow: selected ? '0 4px 14px rgba(127,178,255,0.4)' : 'none',
                    }}
                  >
                    <span className="flex justify-center"><LineIcon name={inst.id} size={32} color={selected ? '#4a78d4' : '#7d8bb5'} /></span>
                    <span className="mt-1 block text-xs font-black" style={{ color: NAVY, ...NUNITO }}>
                      {inst.name}
                    </span>
                    <span className="block text-[10px]" style={{ color: '#8c98bd' }}>{inst.desc}</span>
                  </button>
                )
              })}
            </div>
                        {selectedInst && INST_HINT[selectedInst.id] && (
              <div
                className="mt-4 rounded-2xl p-3 text-xs"
                style={{
                  background: INST_HINT[selectedInst.id].kind === 'rhythm'
                    ? 'rgba(111,214,168,0.18)'
                    : 'rgba(127,178,255,0.15)',
                  color: NAVY,
                }}
              >
                <p className="mb-0.5 font-black">
                  {INST_HINT[selectedInst.id].kind === 'rhythm' ? 'リズム系：得意です' : 'メロディ系：コツがあります'}
                </p>
                <p>{INST_HINT[selectedInst.id].text}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-full px-6 py-4 text-sm font-bold transition hover:bg-white"
              style={backBtn}
            >
              ← 戻る
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedInst}
              className="flex-1 rounded-full py-4 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={primaryBtn}
            >
              次へ：投稿内容 →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3：投稿確認 ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-5" style={GLASS}>

            <div
              className="mb-4 flex items-center gap-3 rounded-2xl p-3"
              style={{ background: 'rgba(127,178,255,0.15)' }}
            >
              <LineIcon name={selectedInst?.id} size={30} color="#4a78d4" />
              <div>
                <p className="text-sm font-black" style={{ color: '#4a78d4', ...NUNITO }}>
                  {selectedInst?.name}で投稿
                </p>
                <p className="text-xs" style={{ color: SUB }}>
                  鼻歌を{selectedInst?.name}の音に変換します
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-bold" style={{ color: SUB }}>録音した音源</p>
              <AudioPlayer src={audioURL} />
            </div>
                        {/* 試し聴き */}
            <div
              className="mb-4 rounded-2xl p-3"
              style={{ background: 'rgba(127,178,255,0.12)', border: '1px solid rgba(127,178,255,0.25)' }}
            >
              <p className="mb-2 text-xs font-bold" style={{ color: '#4a78d4' }}>
                変換後の音を、投稿前に確認できます
              </p>
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="w-full rounded-full py-2.5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
                style={primaryBtn}
              >
                {previewing ? '変換中...' : previewUrl ? 'もう一度変換して聴く' : '変換して聴いてみる'}
              </button>
              {previewUrl && (
                <AudioPlayer src={previewUrl} />
              )}
              {previewError && (
                <p className="mt-2 text-xs font-semibold" style={{ color: '#e0457f' }}><LineIcon name="alert" size={14} color="#e0457f" /> {previewError}</p>
              )}
            </div>

                        <div className="mb-4">
              {!editing ? (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full rounded-full py-2.5 text-sm font-black transition hover:opacity-90 disabled:opacity-50"
                  style={{ ...backBtn, color: '#4a78d4' }}
                >
                  {analyzing ? '解析中...' : '音程や長さを編集する'}
                </button>
              ) : (
                <div className="rounded-2xl p-3" style={{ background: 'rgba(127,178,255,0.1)', border: '1px solid rgba(127,178,255,0.25)' }}>
                  <p className="mb-2 text-xs font-bold" style={{ color: '#4a78d4' }}>音を編集</p>
                  <PianoRoll
                    key={analysisKey}
                    notes={notes}
                    partType={selectedInst.id}
                    onChange={(n) => { setNotes(n); setDirty(true) }}
                  />
                  <button
                    onClick={handleRender}
                    disabled={renderBusy}
                    className="mt-3 w-full rounded-full py-2.5 text-sm font-black text-white disabled:opacity-50"
                    style={primaryBtn}
                  >
                    {renderBusy ? '作成中...' : 'この内容で聴いてみる'}
                  </button>
                  {dirty && (
                    <p className="mt-2 text-[11px] font-semibold" style={{ color: '#d9822b' }}>
                      編集しました。「この内容で聴いてみる」を押すと、投稿できます
                    </p>
                  )}
                </div>
              )}
            </div>

            {!threadId && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold" style={{ color: NAVY }}>
                    セッションのタイトル <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：ゆったりしたギターフレーズ"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold" style={{ color: NAVY }}>
                    説明（任意）
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="例：ドラムとベースを募集しています"
                    rows={3}
                    className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                    style={INPUT}
                  />
                <p className="text-[11px]" style={{ color: SUB }}>
                  タイトルや説明に「#雨の日」のように書くと、タグになります
                </p>
                </div>
              </div>
            )}

            {postError && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-400">
                <LineIcon name="alert" size={14} color="#e0457f" /> {postError}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-full px-6 py-4 text-sm font-bold transition hover:bg-white"
              style={backBtn}
            >
              ← 戻る
            </button>
            <button
              onClick={handlePost}
              disabled={(!threadId && !title.trim()) || !audioBlob || !selectedInst || isPosting || dirty || analyzing}
              className="flex-1 rounded-full py-4 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={primaryBtn}
            >
              {isPosting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4：完了 ── */}
      {step === 4 && (
        <div className="p-8 text-center" style={GLASS}>
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{ background: 'linear-gradient(135deg, #c8f3de, #b6e8ff)' }}
          >
          <LineIcon name="check" size={40} color="#3aa57a" />
          </div>
          <h3 className="text-xl font-black" style={{ color: NAVY, ...NUNITO }}>投稿完了！</h3>
          <p className="mt-2 text-sm" style={{ color: SUB }}>
            {threadId ? 'セッションにパートを追加しました' : 'セッション参加者を待ちましょう'}
          </p>

          <div className="mt-6 space-y-2">
            {onDone && (
              <button
                onClick={() => { reset(); onDone() }}
                className="w-full rounded-full py-3.5 text-sm font-black text-white"
                style={primaryBtn}
              >
                ホームに戻る
              </button>
            )}
            <button
              onClick={reset}
              className="w-full rounded-full py-3.5 text-sm font-bold"
              style={{ background: 'rgba(127,178,255,0.15)', color: '#4a78d4', ...NUNITO }}
            >
              もう一度録音する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}