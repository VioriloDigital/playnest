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
}

export interface ChildProfile {
  name: string
  age: Age
  interests: Interest[]
}

export type Rating = "love" | "ok" | "no"

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
