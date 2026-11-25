/* Bottom-menu icons: drawn in SVG so they look the same on every phone (emoji differ per brand). */

const S = { width: "100%", height: "100%", display: "block" } as const

export function HomeIcon() {
  return (
    <svg viewBox="0 0 48 48" style={S} aria-hidden>
      <defs>
        <linearGradient id="niRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7a6b" />
          <stop offset="1" stopColor="#e2463a" />
        </linearGradient>
        <linearGradient id="niWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7e8" />
          <stop offset="1" stopColor="#f6dfba" />
        </linearGradient>
      </defs>
      <rect x="31" y="9" width="5" height="9" rx="1.2" fill="#b4533f" />
      <path d="M11 22 L24 11 L37 22 V39 a3 3 0 0 1 -3 3 H14 a3 3 0 0 1 -3 -3 Z" fill="url(#niWall)" />
      <path d="M5 24 L24 7.5 L43 24 a2.2 2.2 0 0 1 -2.9 3.2 L24 13.3 L7.9 27.2 A2.2 2.2 0 0 1 5 24 Z" fill="url(#niRoof)" />
      <rect x="20" y="28" width="8.5" height="14" rx="3" fill="#c2763f" />
      <circle cx="26" cy="35.5" r="1" fill="#fde68a" />
      <rect x="13.5" y="26" width="5" height="5" rx="1.2" fill="#7dd3fc" />
      <rect x="30" y="26" width="5" height="5" rx="1.2" fill="#7dd3fc" />
      <ellipse cx="24" cy="43.5" rx="14" ry="1.6" fill="#86efac" />
    </svg>
  )
}

export function WeekIcon() {
  return (
    <svg viewBox="0 0 48 48" style={S} aria-hidden>
      <defs>
        <linearGradient id="niCalTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a7a" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x="7" y="9" width="34" height="33" rx="6" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M7 15 a6 6 0 0 1 6 -6 H35 a6 6 0 0 1 6 6 V19 H7 Z" fill="url(#niCalTop)" />
      <rect x="14" y="5.5" width="3.5" height="8" rx="1.75" fill="#64748b" />
      <rect x="30.5" y="5.5" width="3.5" height="8" rx="1.75" fill="#64748b" />
      {[0, 1, 2, 3].map((c) =>
        [0, 1].map((r) => (
          <rect
            key={`${c}-${r}`}
            x={12 + c * 6.5}
            y={24 + r * 7}
            width="4.5"
            height="4.5"
            rx="1.2"
            fill={c === 1 && r === 0 ? "#15bca6" : "#cbd5e1"}
          />
        )),
      )}
    </svg>
  )
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 48 48" style={S} aria-hidden>
      <defs>
        <linearGradient id="niHeart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7a93" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <path
        d="M24 42 C 9 32 5 24 5 17.5 C 5 11.5 9.6 7 15.2 7 C 19 7 22.2 9 24 12.3 C 25.8 9 29 7 32.8 7 C 38.4 7 43 11.5 43 17.5 C 43 24 39 32 24 42 Z"
        fill="url(#niHeart)"
      />
      <ellipse cx="15" cy="15.5" rx="4.2" ry="2.8" transform="rotate(-30 15 15.5)" fill="#fff" opacity=".45" />
    </svg>
  )
}

export function ChartIcon() {
  return (
    <svg viewBox="0 0 48 48" style={S} aria-hidden>
      <rect x="6" y="6" width="36" height="36" rx="7" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="12" y="25" width="6" height="11" rx="2" fill="#4ade80" />
      <rect x="21" y="18" width="6" height="18" rx="2" fill="#fbbf24" />
      <rect x="30" y="11" width="6" height="25" rx="2" fill="#38bdf8" />
      <path d="M11 36.5 H37" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CrownIcon() {
  return (
    <svg viewBox="0 0 48 48" style={S} aria-hidden>
      <defs>
        <linearGradient id="niGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset=".55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path d="M7 16 L15.5 25 L24 10 L32.5 25 L41 16 L37.5 36 H10.5 Z" fill="url(#niGold)" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="10" y="35" width="28" height="5.5" rx="2.2" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
      <circle cx="7" cy="15.5" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
      <circle cx="24" cy="9.5" r="3.2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
      <circle cx="41" cy="15.5" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
      <circle cx="24" cy="28" r="3.2" fill="#ef4444" />
      <circle cx="15.5" cy="30" r="2.2" fill="#38bdf8" />
      <circle cx="32.5" cy="30" r="2.2" fill="#22c55e" />
    </svg>
  )
}
