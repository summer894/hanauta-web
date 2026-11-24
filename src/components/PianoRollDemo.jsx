import { useState } from 'react'
import PianoRoll from './PianoRoll'

const DEMO = [
  { start: 0.1, end: 0.5, pitch: 59, velocity: 100 },
  { start: 0.6, end: 1.0, pitch: 62, velocity: 100 },
  { start: 1.1, end: 1.5, pitch: 64, velocity: 100 },
  { start: 1.6, end: 2.4, pitch: 67, velocity: 100 },
]

export default function PianoRollDemo() {
  const [notes, setNotes] = useState(DEMO)
  return (
    <div className="px-4 pt-4">
      <PianoRoll notes={DEMO} partType="guitar" onChange={setNotes} />
      <pre className="mt-3 overflow-x-auto rounded-xl bg-white/70 p-3 text-[11px]">
        {JSON.stringify(notes, null, 1)}
      </pre>
    </div>
  )
}