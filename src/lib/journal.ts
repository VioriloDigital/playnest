import { getActivity } from "./activities"
import type { AppState, LogEntry, Rating } from "./types"

/** Local calendar day as YYYY-MM-DD (not UTC, so late-evening play counts for today). */
export function dayKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d
  const m = String(x.getMonth() + 1).padStart(2, "0")
  const day = String(x.getDate()).padStart(2, "0")
  return `${x.getFullYear()}-${m}-${day}`
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function addEntry(
  s: AppState,
  e: { actId: number; note?: string; rating?: Rating; weekDay?: number; childId?: string },
): AppState {
  const entry: LogEntry = { id: newId(), date: new Date().toISOString(), ...e }
  if (!entry.note) delete entry.note
  if (!entry.rating) delete entry.rating
  const ratings = e.rating ? { ...s.ratings, [e.actId]: e.rating } : s.ratings
  return { ...s, log: [entry, ...s.log], ratings }
}

export function removeEntry(s: AppState, id: string): AppState {
  return { ...s, log: s.log.filter((x) => x.id !== id) }
}

/** Consecutive days (ending today, or yesterday if nothing yet today) with at least one activity. */
export function streak(log: LogEntry[], now = new Date()): number {
  const days = new Set(log.map((e) => dayKey(e.date)))
  const d = new Date(now)
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(dayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function bestStreak(log: LogEntry[]): number {
  const days = [...new Set(log.map((e) => dayKey(e.date)))].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const k of days) {
    const d = new Date(k + "T12:00:00")
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/** Entries from Monday of the current week onward. */
export function thisWeek(log: LogEntry[], now = new Date()): LogEntry[] {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return log.filter((e) => new Date(e.date) >= monday)
}

export function stats(log: LogEntry[]) {
  const acts = log.map((e) => getActivity(e.actId)).filter((a) => !!a)
  const count = (fn: (a: NonNullable<(typeof acts)[number]>) => boolean) => acts.filter(fn).length
  return {
    total: log.length,
    week: thisWeek(log).length,
    streak: streak(log),
    best: bestStreak(log),
    creative: count((a) => a.types.includes("creative")),
    learning: count((a) => a.types.includes("learning")),
    movement: count((a) => a.types.includes("movement")),
    calm: count((a) => a.types.includes("calm")),
    outdoor: count((a) => a.places.includes("outside")),
    loved: log.filter((e) => e.rating === "love").length,
    notes: log.filter((e) => e.note).length,
    distinct: new Set(log.map((e) => e.actId)).size,
    days: new Set(log.map((e) => dayKey(e.date))).size,
  }
}

export type Stats = ReturnType<typeof stats>

export const BADGES: { id: string; el: string; en: string; test: (s: Stats) => boolean }[] = [
  { id: "first", el: "🌟 Πρώτη δραστηριότητα", en: "🌟 First activity", test: (s) => s.total >= 1 },
  { id: "streak3", el: "🔥 3 μέρες στη σειρά", en: "🔥 3-day streak", test: (s) => s.best >= 3 },
  { id: "streak7", el: "🏅 7 μέρες στη σειρά", en: "🏅 7-day streak", test: (s) => s.best >= 7 },
  { id: "creative", el: "🎨 Μικρός καλλιτέχνης", en: "🎨 Little artist", test: (s) => s.creative >= 5 },
  { id: "move", el: "🏃 Γεμάτος ενέργεια", en: "🏃 Full of energy", test: (s) => s.movement >= 5 },
  { id: "outdoor", el: "🌳 Ήρωας της φύσης", en: "🌳 Outdoor hero", test: (s) => s.outdoor >= 3 },
  { id: "calm", el: "😌 Ήρεμη δύναμη", en: "😌 Calm power", test: (s) => s.calm >= 5 },
  { id: "explorer", el: "🧭 Εξερευνητής: 20 διαφορετικές", en: "🧭 Explorer: 20 different", test: (s) => s.distinct >= 20 },
  { id: "memories", el: "📝 5 αναμνήσεις", en: "📝 5 memories", test: (s) => s.notes >= 5 },
  { id: "fifty", el: "🏆 50 δραστηριότητες", en: "🏆 50 activities", test: (s) => s.total >= 50 },
]
