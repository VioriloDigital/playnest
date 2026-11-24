import { Capacitor } from "@capacitor/core"
import { activityOfTheDay } from "./activities"
import { actText } from "./i18n"
import type { Lang, Reminder } from "./types"

const DAYS_AHEAD = 14
const BASE_ID = 7100

export function remindersSupported(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Schedules one notification per day for the next two weeks, each naming that day's
 * "activity of the day". Called on every app start, so the window keeps rolling forward.
 * Returns false when the user denied notification permission.
 */
export async function syncReminders(r: Reminder, lang: Lang): Promise<boolean> {
  if (!remindersSupported()) return false
  const { LocalNotifications } = await import("@capacitor/local-notifications")
  const pending = await LocalNotifications.getPending()
  const ours = pending.notifications.filter((n) => n.id >= BASE_ID && n.id < BASE_ID + DAYS_AHEAD)
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) })
  if (!r.on) return true

  let perm = await LocalNotifications.checkPermissions()
  if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions()
  if (perm.display !== "granted") return false

  const [h, m] = r.time.split(":").map(Number)
  const now = new Date()
  const notifications = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const at = new Date(now)
    at.setDate(now.getDate() + i)
    at.setHours(h, m, 0, 0)
    if (at <= now) continue
    const a = activityOfTheDay(at)
    notifications.push({
      id: BASE_ID + i,
      title: lang === "el" ? "🐦 Ώρα για παιχνίδι!" : "🐦 Time to play!",
      body: `${a.emoji} ${actText.title(a, lang)}: ${actText.desc(a, lang)}`,
      schedule: { at, allowWhileIdle: true },
      extra: { actId: a.id },
    })
  }
  await LocalNotifications.schedule({ notifications })
  return true
}

/** Opens the activity when the user taps a reminder. */
export async function onReminderTap(open: (actId: number) => void): Promise<() => void> {
  if (!remindersSupported()) return () => {}
  const { LocalNotifications } = await import("@capacitor/local-notifications")
  const h = await LocalNotifications.addListener("localNotificationActionPerformed", (ev) => {
    const id = Number(ev.notification.extra?.actId)
    if (id) open(id)
  })
  return () => h.remove()
}
