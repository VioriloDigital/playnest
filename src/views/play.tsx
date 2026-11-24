import { useEffect, useRef, useState } from "react"
import { getActivity } from "../lib/activities"
import { actText, pick2 } from "../lib/i18n"
import { addEntry } from "../lib/journal"
import { back, go } from "../lib/router"
import { useStore } from "../lib/store"

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Keeps the screen on while playing, where the browser allows it. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    navigator.wakeLock
      .request("screen")
      .then((l) => {
        if (cancelled) l.release()
        else lock = l
      })
      .catch(() => {})
    return () => {
      cancelled = true
      lock?.release().catch(() => {})
    }
  }, [active])
}

export function PlayMode({ id }: { id: number }) {
  const { state, update, toast } = useStore()
  const l = state.lang
  const a = getActivity(id)
  const [step, setStep] = useState(-1) // -1 = materials checklist
  const total = Number(a?.times[0] ?? 15) * 60
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const [have, setHave] = useState<number[]>([])
  const tick = useRef<number | undefined>(undefined)

  useWakeLock(true)

  useEffect(() => {
    if (!running) return
    tick.current = window.setInterval(() => {
      setLeft((x) => {
        if (x <= 1) {
          setRunning(false)
          try {
            navigator.vibrate?.([200, 100, 200])
          } catch {
            /* not supported */
          }
          return 0
        }
        return x - 1
      })
    }, 1000)
    return () => window.clearInterval(tick.current)
  }, [running])

  if (!a) {
    return (
      <div className="card2">
        <p>{pick2(l, "Η δραστηριότητα δεν βρέθηκε.", "Activity not found.")}</p>
        <button className="primary" onClick={() => go("", true)}>
          {pick2(l, "Αρχική", "Home")}
        </button>
      </div>
    )
  }
  const steps = actText.steps(a, l)
  const mats = actText.materials(a, l)
  const last = step === steps.length - 1
  const finish = () => {
    update((s) => addEntry(s, { actId: a.id }))
    toast(pick2(l, "Μπράβο! Καταγράφηκε στο ημερολόγιο 🎉", "Well done! Added to your journal 🎉"))
    go(`activity/${a.id}`, true)
  }

  return (
    <div className="play">
      <div className="playTop">
        <button className="plusBack" aria-label="close" onClick={() => back(`activity/${a.id}`)}>
          ✕
        </button>
        <b>
          {a.emoji} {actText.title(a, l)}
        </b>
      </div>

      <div className="timerCard">
        <div className={`timer ${left === 0 ? "over" : ""}`}>{left === 0 ? "⏰" : fmt(left)}</div>
        <div className="timerBtns">
          <button className="soft" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
            {running ? "⏸" : "▶️"} {running ? pick2(l, "Παύση", "Pause") : pick2(l, "Χρονόμετρο", "Timer")}
          </button>
          <button
            className="soft"
            onClick={() => {
              setRunning(false)
              setLeft(total)
            }}
          >
            ↺
          </button>
        </div>
        <div className="progressBar">
          <div className="progressFill" style={{ width: `${((total - left) / total) * 100}%` }} />
        </div>
      </div>

      {step === -1 ? (
        <div className="stepCard">
          <div className="stepLabel">🧰 {pick2(l, "Ετοιμάστε τα υλικά", "Get the materials ready")}</div>
          {mats.map((m, i) => (
            <button
              key={m}
              className={`matRow ${have.includes(i) ? "on" : ""}`}
              onClick={() => setHave((h) => (h.includes(i) ? h.filter((x) => x !== i) : [...h, i]))}
            >
              <span>{have.includes(i) ? "✅" : "⬜"}</span> {m}
            </button>
          ))}
        </div>
      ) : (
        <div className="stepCard">
          <div className="stepLabel">
            {pick2(l, "Βήμα", "Step")} {step + 1} / {steps.length}
          </div>
          <p className="stepText">{steps[step]}</p>
        </div>
      )}

      <div className="dots" aria-hidden>
        {[-1, ...steps.map((_, i) => i)].map((i) => (
          <span key={i} className={i === step ? "on" : i < step ? "past" : ""} />
        ))}
      </div>

      <div className="grid2 playNav">
        <button className="secondary" disabled={step === -1} onClick={() => setStep((x) => x - 1)}>
          ← {pick2(l, "Πίσω", "Back")}
        </button>
        {last ? (
          <button className="primary" onClick={finish}>
            ✅ {pick2(l, "Τελειώσαμε!", "We’re done!")}
          </button>
        ) : (
          <button
            className="primary"
            onClick={() => {
              if (step === -1 && !running && left === total) setRunning(true)
              setStep((x) => x + 1)
            }}
          >
            {step === -1 ? pick2(l, "Ξεκινάμε →", "Start →") : pick2(l, "Επόμενο →", "Next →")}
          </button>
        )}
      </div>
    </div>
  )
}
