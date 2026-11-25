import type { ReactNode } from "react"
import { FREE, activities } from "../lib/activities"
import { pick2 } from "../lib/i18n"
import { canStartTrial, hasPlus, startTrial, TRIAL_DAYS, trialDaysLeft } from "../lib/plus"
import { go } from "../lib/router"
import { useStore } from "../lib/store"

const PLUS_COUNT = activities.length - FREE.length

/** Rows of the Free vs Plus comparison. `free` is the free amount, or false when Plus only. */
const ROWS: { icon: string; el: string; en: string; free: [string, string] | false; plus: [string, string] }[] = [
  { icon: "🎨", el: "Δραστηριότητες", en: "Activities", free: [`${FREE.length}`, `${FREE.length}`], plus: [`${activities.length} (+${PLUS_COUNT})`, `${activities.length} (+${PLUS_COUNT})`] },
  { icon: "🔬", el: "STEM, οικογένεια, όλα τα packs", en: "STEM, family, all packs", free: false, plus: ["✓", "✓"] },
  { icon: "🤖", el: "PlayNest AI: νέες ιδέες από ό,τι έχετε", en: "PlayNest AI: new ideas from what you have", free: false, plus: ["✓", "✓"] },
  { icon: "📸", el: "Snap & Play: φωτογραφία → παιχνίδι", en: "Snap & Play: photo → game", free: false, plus: ["✓", "✓"] },
  { icon: "👶", el: "Παιδιά & Sibling Mode", en: "Children & Sibling Mode", free: ["1", "1"], plus: ["3", "3"] },
  { icon: "🏆", el: "7-Day Challenge", en: "7-Day Challenge", free: false, plus: ["✓", "✓"] },
  { icon: "📈", el: "Advanced Progress", en: "Advanced Progress", free: false, plus: ["✓", "✓"] },
  { icon: "🖨️", el: "Printables", en: "Printables", free: false, plus: ["✓", "✓"] },
  { icon: "⭐", el: "Αστεράκια, αυτοκόλλητα, ανταμοιβές", en: "Stars, stickers, rewards", free: ["✓", "✓"], plus: ["✓", "✓"] },
  { icon: "🧰", el: "Εργαλεία για γονείς", en: "Parent tools", free: ["✓", "✓"], plus: ["✓", "✓"] },
  { icon: "📅", el: "Εβδομάδα, ημερολόγιο, υπενθύμιση", en: "Week, journal, reminder", free: ["✓", "✓"], plus: ["✓", "✓"] },
]

/** Plus status and the action that fits it: trial, days left, or "coming soon". */
export function PlusStatus() {
  const { state, update, toast } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const plus = hasPlus(state)
  const days = trialDaysLeft(state)
  if (plus) {
    return (
      <div className="plusStatus on">
        <b>👑 {p("Το Plus είναι ενεργό", "Plus is active")}</b>
        {days > 0 && (
          <div className="small">
            {p(`Δωρεάν δοκιμή: ${days === 1 ? "μένει 1 μέρα" : `μένουν ${days} μέρες`}`, `Free trial: ${days} ${days === 1 ? "day" : "days"} left`)}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="plusStatus">
      {canStartTrial(state) ? (
        <button
          className="plusCTA"
          onClick={() => {
            update(startTrial)
            toast(p(`🎉 Το Plus είναι δικό σας για ${TRIAL_DAYS} μέρες!`, `🎉 Plus is yours for ${TRIAL_DAYS} days!`))
          }}
        >
          🎁 {p(`Δοκιμάστε το Plus δωρεάν για ${TRIAL_DAYS} μέρες`, `Try Plus free for ${TRIAL_DAYS} days`)}
        </button>
      ) : (
        <div className="small" style={{ fontWeight: 700 }}>
          {p("Η δωρεάν δοκιμή σας ολοκληρώθηκε.", "Your free trial has ended.")}
        </div>
      )}
      <button className="secondary" disabled style={{ width: "100%", marginTop: 8 }}>
        👑 {p("Συνδρομή Plus: έρχεται σύντομα", "Plus subscription: coming soon")}
      </button>
      <div className="small" style={{ textAlign: "center", marginTop: 6 }}>
        {p("Χωρίς χρέωση και χωρίς στοιχεία κάρτας για τη δοκιμή.", "No charge and no card details for the trial.")}
      </div>
    </div>
  )
}

export function PlusCompare() {
  const { state } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const i = l === "el" ? 0 : 1
  return (
    <div className="card2 compare">
      <div className="cmpRow cmpHead">
        <span />
        <b>{p("Δωρεάν", "Free")}</b>
        <b className="cmpPlus">👑 Plus</b>
      </div>
      {ROWS.map((r) => (
        <div key={r.el} className="cmpRow">
          <span>
            {r.icon} {l === "el" ? r.el : r.en}
          </span>
          <span className="cmpFree">{r.free ? r.free[i] : "—"}</span>
          <span className="cmpPlus">{r.plus[i]}</span>
        </div>
      ))}
    </div>
  )
}

/** Shown in place of a Plus feature for users without Plus. */
export function PlusLock({ icon, title, text }: { icon: string; title: string; text: string }) {
  const { state } = useStore()
  const l = state.lang
  return (
    <div className="card2 plusLock">
      <div className="plIcon">{icon}</div>
      <span className="plusBadge">👑 PLUS</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <PlusStatus />
      <button className="linkBtn" style={{ width: "100%", textAlign: "center" }} onClick={() => go("plus")}>
        {pick2(l, "Τι περιλαμβάνει το Plus →", "What's in Plus →")}
      </button>
    </div>
  )
}

/** Renders children with Plus, otherwise the lock card. */
export function PlusGate({ icon, title, text, children }: { icon: string; title: string; text: string; children: ReactNode }) {
  const { state } = useStore()
  return hasPlus(state) ? <>{children}</> : <PlusLock icon={icon} title={title} text={text} />
}
