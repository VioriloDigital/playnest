/** Seasonal themes on the Greek calendar. Activities carry the tag `season:<key>`. */

export type ThemeKey = "autumn" | "christmas" | "newyear" | "winter" | "carnival" | "spring" | "easter" | "summer" | "school"

export interface Theme {
  key: ThemeKey
  emoji: string
  el: string
  en: string
  /** Gradient for the theme card. */
  color: [string, string]
  /** Events win over plain seasons when both apply (e.g. Easter in spring). */
  event: boolean
}

export const THEMES: Theme[] = [
  { key: "autumn", emoji: "🍂", el: "Φθινόπωρο", en: "Autumn", color: ["#fde68a", "#fdba74"], event: false },
  { key: "christmas", emoji: "🎄", el: "Χριστούγεννα", en: "Christmas", color: ["#bbf7d0", "#fecaca"], event: true },
  { key: "newyear", emoji: "🥧", el: "Πρωτοχρονιά & Φώτα", en: "New Year & Epiphany", color: ["#fef3c7", "#bae6fd"], event: true },
  { key: "winter", emoji: "❄️", el: "Χειμώνας", en: "Winter", color: ["#e0f2fe", "#c7d2fe"], event: false },
  { key: "carnival", emoji: "🎭", el: "Απόκριες & Καθαρά Δευτέρα", en: "Carnival & Clean Monday", color: ["#f5d0fe", "#fde68a"], event: true },
  { key: "spring", emoji: "🌸", el: "Άνοιξη", en: "Spring", color: ["#fce7f3", "#d9f99d"], event: false },
  { key: "easter", emoji: "🥚", el: "Πάσχα", en: "Easter", color: ["#fecaca", "#fef9c3"], event: true },
  { key: "summer", emoji: "☀️", el: "Καλοκαίρι", en: "Summer", color: ["#bae6fd", "#fde68a"], event: false },
  { key: "school", emoji: "🎒", el: "Πίσω στο σχολείο", en: "Back to school", color: ["#ddd6fe", "#bbf7d0"], event: true },
]

/** Orthodox Easter Sunday (Gregorian date), valid 1900–2099. */
export function orthodoxEaster(year: number): Date {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31) // Julian calendar
  const day = ((d + e + 114) % 31) + 1
  return new Date(year, month - 1, day + 13) // Julian → Gregorian (+13 days this century)
}

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)
const addDays = (dt: Date, n: number) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n)

/** The window [start, end] (inclusive days) of a theme in the season that contains or follows `year`. */
function windowsFor(key: ThemeKey, year: number): [Date, Date][] {
  const e = orthodoxEaster(year)
  switch (key) {
    case "autumn":
      return [[day(year, 9, 23), day(year, 11, 30)]]
    case "christmas":
      return [[day(year, 12, 1), day(year, 12, 26)]]
    case "newyear":
      return [[day(year - 1, 12, 27), day(year, 1, 10)], [day(year, 12, 27), day(year + 1, 1, 10)]]
    case "winter":
      return [[day(year, 1, 11), day(year, 3, 20)]]
    case "carnival":
      return [[addDays(e, -70), addDays(e, -48)]] // three weeks of Carnival up to Clean Monday
    case "spring":
      return [[day(year, 3, 21), day(year, 5, 31)]]
    case "easter":
      return [[addDays(e, -14), addDays(e, 7)]]
    case "summer":
      return [[day(year, 6, 1), day(year, 8, 31)]]
    case "school":
      return [[day(year, 9, 1), day(year, 9, 22)]]
  }
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export interface ThemeTiming {
  theme: Theme
  start: Date
  end: Date
}

/** Every theme window around `now` (this year and next), soonest first. */
function timings(now: Date): ThemeTiming[] {
  const y = now.getFullYear()
  const out: ThemeTiming[] = []
  for (const theme of THEMES) {
    for (const yr of [y, y + 1]) {
      for (const [start, end] of windowsFor(theme.key, yr)) out.push({ theme, start, end })
    }
  }
  return out
}

/** Themes happening today, events first (Christmas before Winter, Easter before Spring). */
export function currentThemes(now = new Date()): Theme[] {
  const t = startOfDay(now)
  const live = timings(now).filter((x) => x.start <= t && t <= x.end)
  const seen = new Set<ThemeKey>()
  return live
    .sort((a, b) => Number(b.theme.event) - Number(a.theme.event))
    .map((x) => x.theme)
    .filter((th) => (seen.has(th.key) ? false : (seen.add(th.key), true)))
}

/** The next theme that hasn't started yet, with days until it starts. */
export function nextTheme(now = new Date()): { theme: Theme; days: number } | null {
  const t = startOfDay(now)
  const live = new Set(currentThemes(now).map((x) => x.key))
  const next = timings(now)
    .filter((x) => x.start > t && !live.has(x.theme.key))
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0]
  return next ? { theme: next.theme, days: Math.round((next.start.getTime() - t.getTime()) / 86400000) } : null
}

/** Themes whose activities may be suggested at random right now: today's, plus one starting within two weeks. */
export function suggestableThemes(now = new Date()): Set<string> {
  const keys = new Set<string>(currentThemes(now).map((x) => x.key))
  const n = nextTheme(now)
  if (n && n.days <= 14) keys.add(n.theme.key)
  return keys
}

export function themeOf(tags: string[]): Theme | undefined {
  const tag = tags.find((x) => x.startsWith("season:"))
  return tag ? THEMES.find((x) => x.key === tag.slice(7)) : undefined
}
