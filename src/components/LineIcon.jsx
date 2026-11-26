export default function LineIcon({ name, size = 22, color = '#5b8def' }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  }
  switch (name) {
    case 'sparkle':
      return (
        <svg {...p}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
        </svg>
      )
    case 'note':
      return (
        <svg {...p}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      )
    case 'mic':
      return (
        <svg {...p}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v4" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...p}>
          <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
        </svg>
      )
    case 'guitar':
      return (
        <svg {...p}>
          <path d="M14 10l6-6M18 3l3 3" />
          <path d="M10.5 9.5c-1.5-1.5-4-1-5 1-.7 1.4-2.5 1.5-3 3-.8 2.4 1 5.5 3.5 6.5 2.5 1 4-.5 5-2 .7-1 .5-2 1.5-3 1.5-1.5 1.5-3-.5-4.5z" />
          <circle cx="8.5" cy="14.5" r="1" />
        </svg>
      )
    case 'bass':
      return (
        <svg {...p}>
          <path d="M3 18V8M3 8l9-3 9 3M21 8v10M3 18l9 3 9-3" />
          <path d="M8 9v10M12 7v14M16 9v10" />
        </svg>
      )
    case 'piano':
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 5v14M12 5v14M16 5v14" />
          <path d="M6.5 5v7M10 5v7M14 5v7M17.5 5v7" />
        </svg>
      )
    case 'kick':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'snare':
      return (
        <svg {...p}>
          <ellipse cx="12" cy="8" rx="8" ry="3" />
          <path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </svg>
      )
    case 'hihat':
      return (
        <svg {...p}>
          <ellipse cx="12" cy="8" rx="9" ry="2.5" />
          <ellipse cx="12" cy="12" rx="9" ry="2.5" />
          <path d="M12 14.5V21" />
        </svg>
      )
    case 'comment':
      return (
        <svg {...p}>
          <path d="M21 11.5a8.4 8.4 0 01-12.2 7.5L3 21l2-5.3A8.5 8.5 0 1121 11.5z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l3 3 5-6" />
        </svg>
      )
    case 'bookmark':
      return (
        <svg {...p}>
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...p}>
          <path d="M12 3l10 18H2z" />
          <path d="M12 10v5M12 18h.01" />
        </svg>
      )
    case 'share':
      return (
        <svg {...p}>
          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
      )
    case 'gear':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </svg>
      )
    default:
      return null

    case 'pencil':
      return (
        <svg {...p}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
        </svg>
      )
    case 'camera':
      return (
        <svg {...p}>
          <path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      )
  }
}