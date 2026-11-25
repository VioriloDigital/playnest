import raw from "../data/activities.json"
import seasonalRaw from "../data/seasonal.json"
import { suggestableThemes, themeOf } from "./seasons"
import type { ActType, Activity, Age, ChildProfile, Interest, Place } from "./types"

/** The 200-activity library plus the seasonal themes (ids 1001+, tagged `season:<theme>`). */
export const activities = [...(raw as Activity[]), ...(seasonalRaw as Activity[])]
export const FREE = activities.filter((a) => !a.premium)
const byId = new Map(activities.map((a) => [a.id, a]))

let custom = new Map<number, Activity>()
let premiumAccess = false

/** Whether Plus activities may be suggested (called by the store on every render). */
export function setPremiumAccess(on: boolean): void {
  premiumAccess = on
}

export function isLocked(a: Activity): boolean {
  return a.premium && !premiumAccess
}

/**
 * Activities this user can be offered at random: everything with Plus, the free ones without,
 * and seasonal ones only in their season (no Christmas crafts in July).
 */
function available(now = new Date()): Activity[] {
  const live = suggestableThemes(now)
  return (premiumAccess ? activities : FREE).filter((a) => {
    const th = themeOf(a.tags)
    return !th || live.has(th.key)
  })
}

/** Make AI-created activities resolvable by id (called by the store on every render). */
export function registerCustom(list: Activity[]): void {
  if (list.length !== custom.size || list.some((a) => !custom.has(a.id))) {
    custom = new Map(list.map((a) => [a.id, a]))
  }
}

export function getActivity(id: number): Activity | undefined {
  return byId.get(id) ?? custom.get(id)
}

export interface Filter {
  age?: Age
  time?: string
  place?: Place
  type?: ActType
  /** Ids to avoid (e.g. the activity currently on screen). */
  exclude?: number[]
}

function randomOf<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function matches(a: Activity, f: Filter): boolean {
  return (
    (!f.age || a.ages.includes(f.age)) &&
    (!f.time || a.times.includes(f.time)) &&
    (!f.place || a.places.includes(f.place)) &&
    (!f.type || a.types.includes(f.type))
  )
}

/**
 * Random activity matching the filter. Relaxes the filter step by step
 * (time, place, type) before falling back to any activity for the age.
 */
export function pickActivity(f: Filter = {}): Activity {
  const exclude = new Set(f.exclude ?? [])
  const attempts: Filter[] = [
    f,
    { ...f, time: undefined },
    { ...f, time: undefined, place: undefined },
    { age: f.age },
    {},
  ]
  const all = available()
  for (const attempt of attempts) {
    const pool = all.filter((a) => !exclude.has(a.id) && matches(a, attempt))
    if (pool.length) return randomOf(pool)
  }
  return randomOf(all)
}

export function activityOfTheDay(now = new Date()): Activity {
  const key = now.getFullYear() * 372 + now.getMonth() * 31 + now.getDate()
  // The base library only, so the activity of the day doesn't jump with the seasons.
  const all = available(now).filter((a) => !themeOf(a.tags))
  return all[key % all.length]
}

export type QuickKey = "rain" | "nomat" | "ten" | "energy" | "bed" | "car" | "rest"

export function quickFilter(k: QuickKey, age: Age): Filter {
  const f: Filter = { age }
  if (k === "rain") f.place = "home"
  if (k === "ten") f.time = "15"
  if (k === "energy") f.type = "movement"
  if (k === "bed" || k === "nomat") f.type = "calm"
  if (k === "car") f.place = "car"
  if (k === "rest") f.place = "restaurant"
  return f
}

const WEEK_PLAN: { type: ActType; place: Place }[] = [
  { type: "creative", place: "home" },
  { type: "learning", place: "home" },
  { type: "movement", place: "home" },
  { type: "calm", place: "home" },
  { type: "creative", place: "home" },
  { type: "movement", place: "outside" },
  { type: "calm", place: "home" },
]

export function buildWeek(age: Age): number[] {
  const used: number[] = []
  for (const day of WEEK_PLAN) {
    used.push(pickActivity({ age, ...day, exclude: used }).id)
  }
  return used
}

const INTEREST_TAGS: Record<Interest, string[]> = {
  vehicle: ["travel", "active"],
  animals: ["outdoor", "learning"],
  art: ["creative"],
  music: ["creative", "calm"],
  building: ["stem", "creative"],
  nature: ["outdoor"],
  languages: ["learning"],
  numbers: ["learning", "stem"],
}

export function personalized(p: ChildProfile | undefined, count = 4): Activity[] {
  let list = activities.filter((a) => a.premium)
  if (p?.age) list = list.filter((a) => a.ages.includes(p.age))
  if (p?.interests.length) {
    const wanted = new Set(p.interests.flatMap((x) => INTEREST_TAGS[x] ?? []))
    list = list
      .map((a) => ({ a, s: a.tags.filter((tag) => wanted.has(tag)).length }))
      .sort((x, y) => y.s - x.s)
      .map((x) => x.a)
  }
  return list.slice(0, count)
}

export const SNAP_ITEMS: { key: string; icon: string; el: string; en: string; tags: string[] }[] = [
  { key: "box", icon: "📦", el: "Κουτί", en: "Box", tags: ["creative", "stem"] },
  { key: "paper", icon: "📄", el: "Χαρτί", en: "Paper", tags: ["creative", "learning"] },
  { key: "markers", icon: "🖍️", el: "Μαρκαδόροι", en: "Markers", tags: ["creative"] },
  { key: "cups", icon: "🥤", el: "Ποτήρια", en: "Cups", tags: ["movement", "stem"] },
  { key: "cars", icon: "🚗", el: "Αυτοκινητάκια", en: "Toy cars", tags: ["movement", "travel"] },
  { key: "blocks", icon: "🧱", el: "Τουβλάκια", en: "Blocks", tags: ["stem", "creative"] },
  { key: "toys", icon: "🧸", el: "Παιχνίδια", en: "Toys", tags: ["creative"] },
  { key: "spoons", icon: "🥄", el: "Κουτάλια", en: "Spoons", tags: ["movement", "learning"] },
  { key: "string", icon: "🧵", el: "Σπάγκος", en: "String", tags: ["creative", "movement"] },
  { key: "nature", icon: "🍃", el: "Φύλλα/πέτρες", en: "Leaves/stones", tags: ["outdoor", "learning"] },
]

export function snapSuggest(keys: string[], count = 3): Activity[] {
  const wanted = new Set(
    SNAP_ITEMS.filter((s) => keys.includes(s.key)).flatMap((s) => s.tags),
  )
  let pool = activities.filter((a) =>
    [...wanted].some((tag) => (a.types as string[]).includes(tag) || a.tags.includes(tag)),
  )
  if (!pool.length) pool = activities.filter((a) => a.premium)
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}

export function siblingPick(a1: Age, a2: Age): Activity {
  let pool = available().filter((a) => a.ages.includes(a1) && a.ages.includes(a2))
  if (!pool.length) pool = available().filter((a) => a.ages.includes(a1) || a.ages.includes(a2))
  return randomOf(pool)
}

export function smartPick(opts: {
  age: Age
  time: string
  place: Place
  type: ActType | "all"
  exclude?: number[]
}): Activity {
  return pickActivity({
    age: opts.age,
    time: opts.time,
    place: opts.place,
    type: opts.type === "all" ? undefined : opts.type,
    exclude: opts.exclude,
  })
}

export const CATEGORIES: [string, string, string][] = [
  ["all", "✨ Όλα", "✨ All"],
  ["season", "🎉 Εποχής", "🎉 Seasonal"],
  ["creative", "🎨 Δημιουργικές", "🎨 Creative"],
  ["learning", "🧠 Μάθηση", "🧠 Learning"],
  ["active", "🏃 Κίνηση", "🏃 Active"],
  ["calm", "😌 Ήρεμες", "😌 Calm"],
  ["stem", "🔬 STEM", "🔬 STEM"],
  ["outdoor", "🌳 Έξω", "🌳 Outdoor"],
  ["screenfree", "📵 Χωρίς οθόνη", "📵 Screen-Free"],
  ["travel", "🚗 Ταξίδι", "🚗 Travel"],
  ["restaurant", "🍽️ Εστιατόριο", "🍽️ Restaurant"],
  ["rainy", "🌧️ Βροχερή μέρα", "🌧️ Rainy Day"],
  ["toddler", "🧸 Νήπια", "🧸 Toddler"],
  ["family", "👨‍👩‍👧 Οικογένεια", "👨‍👩‍👧 Family"],
]

export const PACKS: { tag: string; icon: string; el: string; en: string }[] = [
  { tag: "screenfree", icon: "📵", el: "Χωρίς οθόνη", en: "Screen-Free" },
  { tag: "stem", icon: "🔬", el: "STEM", en: "STEM" },
  { tag: "travel", icon: "🚗", el: "Ταξίδι", en: "Travel" },
  { tag: "rainy", icon: "🌧️", el: "Βροχερή μέρα", en: "Rainy Day" },
  { tag: "outdoor", icon: "🌳", el: "Έξω", en: "Outdoor" },
  { tag: "toddler", icon: "🧸", el: "Νήπια", en: "Toddler" },
  { tag: "family", icon: "👨‍👩‍👧", el: "Οικογένεια", en: "Family" },
  { tag: "calm", icon: "🌙", el: "Ήρεμες", en: "Calm" },
]

/** Greek-insensitive normalisation for search (strip accents, lower-case). */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}
