import type { AppState } from "./types"

/** Length of the free Plus trial, once per device. */
export const TRIAL_DAYS = 7

/** What Plus unlocks, for the comparison screen and the lock cards. */
export type PlusFeature = "activities" | "ai" | "snap" | "profiles" | "packs" | "challenge" | "progress" | "printables"

export function trialEnd(s: AppState): Date | null {
  return s.plus.trialStart ? new Date(new Date(s.plus.trialStart).getTime() + TRIAL_DAYS * 86400000) : null
}

export function hasPlus(s: AppState, now = new Date()): boolean {
  if (s.plus.paidUntil && new Date(s.plus.paidUntil) > now) return true
  const end = trialEnd(s)
  return !!end && end > now
}

/** Whole days left in the trial (0 when none or over). */
export function trialDaysLeft(s: AppState, now = new Date()): number {
  const end = trialEnd(s)
  if (!end || end <= now || (s.plus.paidUntil && new Date(s.plus.paidUntil) > now)) return 0
  return Math.ceil((end.getTime() - now.getTime()) / 86400000)
}

export function canStartTrial(s: AppState): boolean {
  return !s.plus.trialStart && !s.plus.paidUntil
}

export function startTrial(s: AppState): AppState {
  return canStartTrial(s) ? { ...s, plus: { ...s.plus, trialStart: new Date().toISOString() } } : s
}
