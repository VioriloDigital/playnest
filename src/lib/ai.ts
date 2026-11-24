import { Capacitor } from "@capacitor/core"
import type { ActType, Activity, Age, Lang, Place } from "./types"

/** The mobile apps load from https://localhost, so they call the deployed Worker directly. */
const API_BASE = Capacitor.isNativePlatform() ? "https://playnest.kosbouris.workers.dev" : ""

export type AIErrorKind = "not_configured" | "limit" | "refused" | "offline" | "busy" | "failed"

export class AIError extends Error {
  constructor(public kind: AIErrorKind) {
    super(kind)
  }
}

function deviceId(): string {
  try {
    let id = localStorage.getItem("playnest_device")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("playnest_device", id)
    }
    return id
  } catch {
    return ""
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/ai/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-playnest-device": deviceId() },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AIError("offline")
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    const e = data.error
    throw new AIError(
      e === "not_configured" || e === "limit" || e === "refused" || e === "busy" ? e : "failed",
    )
  }
  return data as T
}

type Generated = Omit<Activity, "id" | "premium" | "tags" | "ai">

let seq = 0
/** Turns a generated activity into a library-shaped one with a unique id and Explore tags. */
export function toActivity(g: Generated): Activity {
  const tags = new Set<string>(["screenfree"])
  if (g.types.includes("creative")) tags.add("creative")
  if (g.types.includes("learning")) tags.add("learning")
  if (g.types.includes("movement")) tags.add("active")
  if (g.types.includes("calm")) tags.add("calm")
  if (g.places.includes("outside")) tags.add("outdoor")
  if (g.places.includes("car")) tags.add("travel")
  if (g.places.includes("restaurant")) tags.add("restaurant")
  if (g.ages.some((x) => x === "1-2" || x === "2-3")) tags.add("toddler")
  if (g.places.includes("home") && g.types.some((x) => x !== "movement")) tags.add("rainy")
  return { ...g, id: 1_000_000_000_000 + Date.now() * 10 + (seq++ % 10), premium: false, ai: true, tags: [...tags] }
}

export async function aiActivity(req: {
  lang: Lang
  age: Age
  time: string
  place: Place
  type: ActType | "all"
  materials?: string
  avoid?: string[]
}): Promise<Activity> {
  return toActivity(await call<Generated>("activity", req))
}

export interface SnapResult {
  materials: string[]
  activities: Activity[]
}

/** Shrinks the photo to at most 1024 px on its long side, as JPEG, before upload. */
export async function photoToJpeg(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
}

export async function aiSnap(req: { lang: Lang; age: Age; image: string }): Promise<SnapResult> {
  const r = await call<{ materialsEl: string[]; materialsEn: string[]; activities: Generated[] }>("snap", {
    ...req,
    mediaType: "image/jpeg",
  })
  return {
    materials: req.lang === "el" ? r.materialsEl : r.materialsEn,
    activities: r.activities.map(toActivity),
  }
}

/** Sends an AI activity the parent flagged, with the chosen reason. */
export async function reportActivity(a: Activity, reason: string): Promise<void> {
  await call<{ ok: boolean }>("report", {
    reason,
    activity: { emoji: a.emoji, titleEl: a.titleEl, titleEn: a.titleEn, descEl: a.descEl, stepsEl: a.stepsEl, materialsEl: a.materialsEl, ages: a.ages },
  })
}

/** `fallback` describes what the screen offers instead (a library pick, or picking materials by hand). */
export function aiErrorText(kind: AIErrorKind, lang: Lang, fallback: "library" | "manual" = "library"): string {
  const el: Record<AIErrorKind, string> = {
    not_configured: "Το PlayNest AI δεν έχει ενεργοποιηθεί ακόμη.",
    limit: "Έφτασες το σημερινό όριο του PlayNest AI. Δοκίμασε ξανά αύριο!",
    refused: "Δεν μπόρεσα να το φτιάξω αυτό. Δοκίμασε να το περιγράψεις αλλιώς.",
    offline: "Χρειάζεται σύνδεση στο internet για το PlayNest AI.",
    busy: "Το PlayNest AI είναι πολύ απασχολημένο αυτή τη στιγμή. Δοκίμασε σε λίγο.",
    failed: "Κάτι πήγε στραβά με το PlayNest AI.",
  }
  const en: Record<AIErrorKind, string> = {
    not_configured: "PlayNest AI is not enabled yet.",
    limit: "You reached today's PlayNest AI limit. Try again tomorrow!",
    refused: "I couldn't create that. Try describing it differently.",
    offline: "PlayNest AI needs an internet connection.",
    busy: "PlayNest AI is very busy right now. Try again in a moment.",
    failed: "Something went wrong with PlayNest AI.",
  }
  const base = (lang === "el" ? el : en)[kind]
  if (kind === "refused" || kind === "busy") return base
  const extra =
    fallback === "library"
      ? lang === "el" ? " Μέχρι τότε, μια ιδέα από τη βιβλιοθήκη:" : " Meanwhile, an idea from the library:"
      : lang === "el" ? " Μπορείς να διαλέξεις τα υλικά από κάτω." : " You can pick the materials below."
  return base + extra
}
