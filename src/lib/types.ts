export type Lang = "el" | "en"
export type Age = "1-2" | "2-3" | "3-4" | "4-6" | "6-8"
export type Place = "home" | "outside" | "car" | "restaurant"
export type ActType = "creative" | "learning" | "movement" | "calm"
export type Interest =
  | "vehicle"
  | "animals"
  | "art"
  | "music"
  | "building"
  | "nature"
  | "languages"
  | "numbers"

export interface Activity {
  id: number
  titleEl: string
  titleEn: string
  ages: Age[]
  times: string[]
  places: Place[]
  types: ActType[]
  emoji: string
  descEl: string
  descEn: string
  materialsEl: string[]
  materialsEn: string[]
  skillsEl: string[]
  skillsEn: string[]
  stepsEl: string[]
  stepsEn: string[]
  premium: boolean
  tags: string[]
  /** Created by PlayNest AI (kept on the device in `AppState.aiActivities`). */
  ai?: boolean
}

/** A reward the parent sets up, e.g. "10 stars = a trip to the park". */
export interface Reward {
  id: string
  emoji: string
  title: string
  cost: number
  /** ISO date when the child claimed it; a claimed reward's stars are spent. */
  redeemedAt?: string
}

export interface ChildProfile {
  /** Stable id: journal entries and rewards point to it, so deleting another child doesn't shift them. */
  id: string
  name: string
  age: Age
  interests: Interest[]
  rewards: Reward[]
}

export type Rating = "love" | "ok" | "no"

/** One completed activity in the play journal. */
export interface LogEntry {
  id: string
  actId: number
  /** ISO timestamp of when it was done. */
  date: string
  note?: string
  rating?: Rating
  /** Set when the entry came from ticking a day in the weekly plan. */
  weekDay?: number
  /** The child (ChildProfile.id) who did it; earns that child a star. */
  childId?: string
}

export interface Reminder {
  on: boolean
  /** "HH:MM", 24-hour. */
  time: string
}

/** A picture routine for the "Now → Next" tool (e.g. morning, bedtime). */
export interface Routine {
  id: string
  emoji: string
  name: string
  items: { emoji: string; label: string }[]
}

export interface AppState {
  lang: Lang
  profiles: ChildProfile[]
  active: number
  favs: number[]
  /** Activity ids for Monday..Sunday. */
  week: number[]
  /** Indexes (0-6) of completed days in `week`. */
  done: number[]
  ratings: Record<string, Rating>
  challenge: boolean[]
  snapTags: string[]
  aiHistory: number[]
  log: LogEntry[]
  reminder: Reminder
  /** Activities created by PlayNest AI, newest first. */
  aiActivities: Activity[]
  /** Picture routines (Tools → Now & Next). Empty means "use the defaults for the language". */
  routines: Routine[]
  /** False until the welcome screen has been completed (or skipped) once. */
  introSeen: boolean
}

export const AGES: Age[] = ["1-2", "2-3", "3-4", "4-6", "6-8"]
export const INTERESTS: Interest[] = [
  "vehicle",
  "animals",
  "art",
  "music",
  "building",
  "nature",
  "languages",
  "numbers",
]
export const MAX_PROFILES = 3

/** Profile avatars by position: friendly animals, so no child is given a gender. */
export const AVATARS = ["🐥", "🦊", "🐼"]
