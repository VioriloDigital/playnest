import { Capacitor, registerPlugin } from "@capacitor/core"
import type { AppState } from "./types"

const LegacyData = registerPlugin<{ get(): Promise<{ json: string }> }>("LegacyData")
const STATE_KEY = "playnest_state_v3"
const DONE_KEY = "playnest_legacy_imported"

/** True when the new app holds nothing the parent created (safe to replace with imported data). */
function untouched(): boolean {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return true
    const s = JSON.parse(raw) as Partial<AppState>
    return !s.log?.length && !s.favs?.length && !s.week?.length && !s.aiActivities?.length && !s.profiles?.[0]?.name
  } catch {
    return false
  }
}

/**
 * Android only: brings over data saved by PlayNest 1.x (read natively by MainActivity).
 * Writes the old keys, drops the fresh v3 state and reloads, so loadState() migrates them as on the web.
 */
export async function importLegacyData(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return
  try {
    if (localStorage.getItem(DONE_KEY)) return
    const { json } = await LegacyData.get()
    const data = JSON.parse(json || "{}") as Record<string, string>
    const keys = Object.keys(data).filter((k) => /^(pn_|playnest)/.test(k) && k !== STATE_KEY)
    localStorage.setItem(DONE_KEY, "1")
    if (!keys.length || !untouched()) return
    for (const k of keys) localStorage.setItem(k, data[k])
    localStorage.removeItem(STATE_KEY)
    location.reload()
  } catch {
    /* plugin missing (older native build) or storage blocked: nothing to import */
  }
}
