import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { registerCustom } from "./activities"
import { AGES, type AppState, type ChildProfile, type Lang } from "./types"

const KEY = "playnest_state_v3"

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function newId(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function cleanProfile(p: Partial<ChildProfile> | undefined): ChildProfile {
  return {
    id: typeof p?.id === "string" && p.id ? p.id : newId("c"),
    name: typeof p?.name === "string" ? p.name : "",
    age: p?.age && AGES.includes(p.age) ? p.age : "3-4",
    interests: Array.isArray(p?.interests) ? p.interests : [],
    rewards: Array.isArray(p?.rewards) ? p.rewards : [],
  }
}

/** Journal entries from before per-child stars belong to the child that was active. */
function withChildIds(s: AppState): AppState {
  const fallback = (s.profiles[s.active] ?? s.profiles[0]).id
  if (s.log.every((e) => e.childId)) return s
  return { ...s, log: s.log.map((e) => (e.childId ? e : { ...e, childId: fallback })) }
}

export const defaultState: AppState = {
  lang: "el",
  profiles: [{ id: "c-first", name: "", age: "3-4", interests: ["vehicle", "art"], rewards: [] }],
  active: 0,
  favs: [],
  week: [],
  done: [],
  ratings: {},
  challenge: [false, false, false, false, false, false, false],
  snapTags: [],
  aiHistory: [],
  log: [],
  reminder: { on: false, time: "17:30" },
  aiActivities: [],
}

/** Load state, migrating data saved by PlayNest V1 (pn_* keys and playnest_plus_v2). */
export function loadState(): AppState {
  const saved = read<Partial<AppState> | null>(KEY, null)
  if (saved) {
    const profiles = (saved.profiles?.length ? saved.profiles : defaultState.profiles).map(cleanProfile)
    // Before the journal existed, completed days only lived in `done`: turn them into entries once.
    const log =
      saved.log ??
      (saved.done ?? [])
        .filter((i) => typeof saved.week?.[i] === "number")
        .map((i) => ({ id: `w${i}`, actId: saved.week![i], date: new Date().toISOString(), weekDay: i }))
    return withChildIds({
      ...defaultState,
      ...saved,
      log,
      profiles,
      active: Math.min(Math.max(saved.active ?? 0, 0), profiles.length - 1),
    })
  }

  let lang: Lang = "el"
  try {
    if (localStorage.getItem("pn_lang") === "en") lang = "en"
  } catch {
    /* storage unavailable */
  }
  const legacyProfile = read<Partial<ChildProfile> | null>("pn_profile", null)
  const plus = read<{
    profiles?: Partial<ChildProfile>[]
    active?: number
    challenge?: boolean[]
    snapTags?: string[]
    aiHistory?: number[]
  } | null>("playnest_plus_v2", null)

  const profiles = plus?.profiles?.length
    ? plus.profiles.map(cleanProfile)
    : legacyProfile
      ? [cleanProfile(legacyProfile)]
      : defaultState.profiles
  const active = Math.min(Math.max(plus?.active ?? 0, 0), profiles.length - 1)
  // V1 edited `pn_profile` from the profile screen; it is the freshest copy of the active child.
  if (legacyProfile && plus?.profiles?.length) profiles[active] = cleanProfile(legacyProfile)

  return withChildIds({
    ...defaultState,
    lang,
    profiles,
    active,
    favs: read<number[]>("pn_favs", read<number[]>("playnest-favs", [])),
    week: read<number[]>("pn_week", []),
    done: read<number[]>("pn_done", []),
    log: read<number[]>("pn_done", [])
      .filter((i) => typeof read<number[]>("pn_week", [])[i] === "number")
      .map((i) => ({ id: `w${i}`, actId: read<number[]>("pn_week", [])[i], date: new Date().toISOString(), weekDay: i })),
    challenge: plus?.challenge?.length === 7 ? plus.challenge : defaultState.challenge,
    snapTags: plus?.snapTags ?? [],
    aiHistory: plus?.aiHistory ?? [],
  })
}

/** Full-screen "well done" moment after a child finishes an activity. */
export interface Celebration {
  name: string
  stars: number
  sticker?: { emoji: string; el: string; en: string }
  reward?: { emoji: string; title: string }
}

interface Store {
  celebration: Celebration | null
  celebrate: (c: Celebration | null) => void
  state: AppState
  update: (fn: (s: AppState) => AppState) => void
  profile: ChildProfile
  toast: (msg: string) => void
  toastMsg: string | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [celebration, celebrate] = useState<Celebration | null>(null)
  const timer = useRef<number | undefined>(undefined)

  registerCustom(state.aiActivities)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked: keep working in memory */
    }
    document.documentElement.lang = state.lang
  }, [state])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 1600)
  }, [])

  const value = useMemo<Store>(
    () => ({
      state,
      update: setState,
      profile: state.profiles[state.active] ?? state.profiles[0],
      toast,
      toastMsg,
      celebration,
      celebrate,
    }),
    [state, toast, toastMsg, celebration],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error("useStore outside StoreProvider")
  return s
}
