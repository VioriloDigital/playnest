import { useEffect, useRef, useState } from "react"
import { SectionTitle } from "../components"
import { pick2 } from "../lib/i18n"
import { back, go } from "../lib/router"
import { newId, useStore } from "../lib/store"
import type { Lang, Routine } from "../lib/types"

/* Tools for parents, adapted from the classroom tools of the Taxis app for home with children aged 1–8. */

function beep(times = 3, freq = 880) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    for (let i = 0; i < times; i++) {
      const t = i * 0.35
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.3)
    }
  } catch {
    /* no sound */
  }
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* not supported */
  }
}

/** Keeps the screen on while a tool runs, where the browser allows it. */
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

type ToolId = "timer" | "routine" | "emotions" | "breath"
const TOOLS: { id: ToolId; emoji: string; el: [string, string]; en: [string, string] }[] = [
  { id: "timer", emoji: "⏱️", el: ["Χρονόμετρο", "«Άλλα 5 λεπτά», τακτοποίηση, σειρά"], en: ["Timer", "“5 more minutes”, tidy-up, taking turns"] },
  { id: "routine", emoji: "📋", el: ["Τώρα → Μετά", "Πρωινό και βραδινό με εικόνες"], en: ["Now → Next", "Morning and bedtime in pictures"] },
  { id: "emotions", emoji: "💗", el: ["Τροχός συναισθημάτων", "Πώς νιώθω; Τι με βοηθά;"], en: ["Feelings wheel", "How do I feel? What helps?"] },
  { id: "breath", emoji: "🧘", el: ["Ανάσες", "Ένα λεπτό ηρεμίας"], en: ["Breathing", "One calm minute"] },
]

export function ToolsHome() {
  const { state } = useStore()
  const l = state.lang
  return (
    <>
      <SectionTitle>🧰 {pick2(l, "Εργαλεία για γονείς", "Parent tools")}</SectionTitle>
      <p className="small" style={{ margin: "0 2px 10px" }}>
        {pick2(
          l,
          "Για τις δύσκολες στιγμές της μέρας: αλλαγές, ρουτίνες, ξεσπάσματα.",
          "For the tricky moments of the day: transitions, routines, big feelings.",
        )}
      </p>
      <div className="plusGridV2">
        {TOOLS.map((t) => (
          <button key={t.id} className="plusFeature" onClick={() => go(`tools/${t.id}`)}>
            <span className="pfIcon">{t.emoji}</span>
            <b>{(l === "el" ? t.el : t.en)[0]}</b>
            <small>{(l === "el" ? t.el : t.en)[1]}</small>
          </button>
        ))}
      </div>
    </>
  )
}

/** Small entry card for the Home screen. */
export function ToolsCard() {
  const { state } = useStore()
  const l = state.lang
  return (
    <button className="card2 starsCard toolsCard" onClick={() => go("tools")}>
      <div className="starsBig">🧰</div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <b>{pick2(l, "Εργαλεία για γονείς", "Parent tools")}</b>
        <div className="small">⏱️ 📋 💗 🧘 {pick2(l, "Χρονόμετρο, ρουτίνες, συναισθήματα, ανάσες", "Timer, routines, feelings, breathing")}</div>
      </div>
      <span className="chev">›</span>
    </button>
  )
}

function ToolHead({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="plusTop">
      <button className="plusBack" aria-label="Back" onClick={() => back("tools")}>
        ←
      </button>
      <b>
        {emoji} {title}
      </b>
    </div>
  )
}

/* ---------- Visual timer ---------- */

const TIMER_PRESETS = [1, 2, 3, 5, 10, 15, 20]
const TIMER_LABELS: [string, string, string][] = [
  ["🧸", "Ακόμη λίγο παιχνίδι", "A little more play"],
  ["🧹", "Τακτοποίηση", "Tidy-up"],
  ["🔄", "Η σειρά σου", "Your turn"],
  ["🪥", "Βούρτσισμα δοντιών", "Brushing teeth"],
  ["📺", "Χρόνος οθόνης", "Screen time"],
  ["🍽️", "Φαγητό", "Mealtime"],
]

export function VisualTimer() {
  const { state } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const [total, setTotal] = useState(5 * 60)
  const [left, setLeft] = useState(5 * 60)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState(0)
  const endAt = useRef(0)
  useWakeLock(running)

  useEffect(() => {
    if (!running) return
    const iv = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        setRunning(false)
        beep()
      }
    }, 200)
    return () => window.clearInterval(iv)
  }, [running])

  const set = (secs: number) => {
    setRunning(false)
    setTotal(secs)
    setLeft(secs)
  }
  const start = () => {
    const from = left === 0 ? total : left
    setLeft(from)
    endAt.current = Date.now() + from * 1000
    setRunning(true)
  }
  const frac = total ? left / total : 0
  // "Time Timer" style: the red part is the time that's left, it shrinks clockwise.
  const angle = frac * 360
  const r = 46
  const end = ((angle - 90) * Math.PI) / 180
  const x = 50 + r * Math.cos(end)
  const y = 50 + r * Math.sin(end)
  const path =
    frac >= 1
      ? ""
      : `M50,50 L50,${50 - r} A${r},${r} 0 ${angle > 180 ? 1 : 0} 1 ${x.toFixed(2)},${y.toFixed(2)} Z`
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, "0")
  const [emoji, el, en] = TIMER_LABELS[label]

  return (
    <>
      <ToolHead emoji="⏱️" title={p("Χρονόμετρο", "Timer")} />
      <div className="plusPanel timerTool">
        <div className="chips">
          {TIMER_LABELS.map(([e, a, b], i) => (
            <button key={i} className={`chip ${label === i ? "sel" : ""}`} onClick={() => setLabel(i)}>
              {e} {l === "el" ? a : b}
            </button>
          ))}
        </div>
        <div className="ttLabel">
          {emoji} {l === "el" ? el : en}
        </div>
        <svg viewBox="0 0 100 100" className={`ttDial ${left === 0 ? "done" : ""}`} role="img" aria-label={`${mm}:${ss}`}>
          <circle cx="50" cy="50" r="49" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180
            return (
              <line
                key={i}
                x1={50 + 44 * Math.sin(a)}
                y1={50 - 44 * Math.cos(a)}
                x2={50 + 48 * Math.sin(a)}
                y2={50 - 48 * Math.cos(a)}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            )
          })}
          {frac >= 1 ? <circle cx="50" cy="50" r={r} fill="#f43f5e" /> : frac > 0 && <path d={path} fill="#f43f5e" />}
          <circle cx="50" cy="50" r="6" fill="#fff" stroke="#e2e8f0" />
        </svg>
        <div className={`ttTime ${left === 0 ? "over" : ""}`}>{left === 0 ? p("⏰ Τέλος χρόνου!", "⏰ Time's up!") : `${mm}:${ss}`}</div>
        <div className="chips ttPresets">
          {TIMER_PRESETS.map((m) => (
            <button key={m} className={`chip ${total === m * 60 ? "sel" : ""}`} onClick={() => set(m * 60)}>
              {m}′
            </button>
          ))}
        </div>
        <div className="grid2">
          {running ? (
            <button className="secondary" onClick={() => setRunning(false)}>
              ⏸ {p("Παύση", "Pause")}
            </button>
          ) : (
            <button className="primary" onClick={start}>
              ▶️ {left === total || left === 0 ? p("Έναρξη", "Start") : p("Συνέχεια", "Resume")}
            </button>
          )}
          <button className="secondary" onClick={() => set(total)}>
            ↺ {p("Από την αρχή", "Reset")}
          </button>
        </div>
        <p className="small" style={{ textAlign: "center" }}>
          {p(
            "Το κόκκινο κομμάτι είναι ο χρόνος που μένει. Τα μικρά παιδιά καταλαβαίνουν τον χρόνο καλύτερα όταν τον βλέπουν να μικραίνει.",
            "The red part is the time left. Young children understand time better when they can see it shrink.",
          )}
        </p>
      </div>
    </>
  )
}

/* ---------- Now → Next picture routines ---------- */

function defaultRoutines(l: Lang): Routine[] {
  const t = (a: string, b: string) => (l === "el" ? a : b)
  return [
    {
      id: "morning",
      emoji: "🌅",
      name: t("Πρωινό", "Morning"),
      items: [
        { emoji: "⏰", label: t("Ξύπνημα", "Wake up") },
        { emoji: "🚽", label: t("Τουαλέτα", "Toilet") },
        { emoji: "🧼", label: t("Πλύσιμο", "Wash up") },
        { emoji: "👕", label: t("Ντύσιμο", "Get dressed") },
        { emoji: "🥣", label: t("Πρωινό", "Breakfast") },
        { emoji: "🪥", label: t("Δόντια", "Brush teeth") },
        { emoji: "👟", label: t("Παπούτσια", "Shoes on") },
        { emoji: "🎒", label: t("Πάμε!", "Let’s go!") },
      ],
    },
    {
      id: "bedtime",
      emoji: "🌙",
      name: t("Βραδινό", "Bedtime"),
      items: [
        { emoji: "🧸", label: t("Μαζεύουμε τα παιχνίδια", "Tidy the toys") },
        { emoji: "🍽️", label: t("Βραδινό φαγητό", "Dinner") },
        { emoji: "🛁", label: t("Μπάνιο", "Bath") },
        { emoji: "👕", label: t("Πιτζάμες", "Pyjamas") },
        { emoji: "🪥", label: t("Δόντια", "Brush teeth") },
        { emoji: "📖", label: t("Παραμύθι", "Story") },
        { emoji: "🤗", label: t("Αγκαλιά", "Cuddle") },
        { emoji: "😴", label: t("Καληνύχτα", "Good night") },
      ],
    },
  ]
}

const ROUTINE_EMOJIS = ["⏰", "🚽", "🧼", "👕", "🥣", "🪥", "👟", "🎒", "🧸", "🍽️", "🛁", "📖", "🤗", "😴", "🥪", "🍎", "🛝", "🎨", "🧩", "🎵", "🚗", "🏠", "🧹", "💧", "🧥", "🏫", "📺", "⭐"]

export function RoutineTool() {
  const { state, update } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const routines = state.routines.length ? state.routines : defaultRoutines(l)
  const [rid, setRid] = useState(routines[0].id)
  const [cur, setCur] = useState(0)
  const [edit, setEdit] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const r = routines.find((x) => x.id === rid) ?? routines[0]
  const items = r.items
  const i = Math.min(cur, items.length)

  const save = (fn: (list: Routine[]) => Routine[]) => update((s) => ({ ...s, routines: fn(s.routines.length ? s.routines : defaultRoutines(l)) }))
  const setItems = (fn: (it: Routine["items"]) => Routine["items"]) =>
    save((list) => list.map((x) => (x.id === r.id ? { ...x, items: fn(x.items) } : x)))
  const choose = (id: string) => {
    setRid(id)
    setCur(0)
    setEdit(false)
  }
  const next = () => {
    const n = i + 1
    setCur(n)
    if (n === items.length) beep(2, 660)
  }

  return (
    <>
      <ToolHead emoji="📋" title={p("Τώρα → Μετά", "Now → Next")} />
      <div className="chips">
        {routines.map((x) => (
          <button key={x.id} className={`chip ${x.id === r.id ? "sel" : ""}`} onClick={() => choose(x.id)}>
            {x.emoji} {x.name}
          </button>
        ))}
        <button
          className="chip"
          onClick={() => {
            const id = newId("rt")
            save((list) => [...list, { id, emoji: "⭐", name: p("Νέα ρουτίνα", "New routine"), items: [{ emoji: "⭐", label: p("Πρώτο βήμα", "First step") }] }])
            setRid(id)
            setCur(0)
            setEdit(true)
          }}
        >
          ＋ {p("Νέα", "New")}
        </button>
      </div>

      {edit ? (
        <div className="plusPanel routineEdit">
          <label className="fields">
            {p("Όνομα ρουτίνας", "Routine name")}
            <input value={r.name} maxLength={30} onChange={(e) => save((list) => list.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))} />
          </label>
          {items.map((it, k) => (
            <div key={k} className="reRow">
              <button className="reEmoji" onClick={() => setPick(pick === k ? null : k)} aria-label="icon">
                {it.emoji}
              </button>
              <input
                value={it.label}
                maxLength={30}
                onChange={(e) => setItems((a) => a.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)))}
              />
              <button className="iconbtn" aria-label="up" disabled={k === 0} onClick={() => setItems((a) => { const b = [...a]; [b[k - 1], b[k]] = [b[k], b[k - 1]]; return b })}>
                ↑
              </button>
              <button className="iconbtn" aria-label="delete" onClick={() => setItems((a) => a.filter((_, j) => j !== k))}>
                🗑️
              </button>
              {pick === k && (
                <div className="emojiPick rePick">
                  {ROUTINE_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setItems((a) => a.map((x, j) => (j === k ? { ...x, emoji: e } : x)))
                        setPick(null)
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="grid2">
            <button className="secondary" onClick={() => setItems((a) => [...a, { emoji: "⭐", label: p("Νέο βήμα", "New step") }])}>
              ＋ {p("Βήμα", "Step")}
            </button>
            <button className="primary" onClick={() => setEdit(false)}>
              ✓ {p("Τέλος", "Done")}
            </button>
          </div>
          <button
            className="soft"
            style={{ width: "100%" }}
            onClick={() => {
              if (!confirm(p("Επαναφορά όλων των ρουτινών στις αρχικές;", "Reset all routines to the defaults?"))) return
              update((s) => ({ ...s, routines: [] }))
              setRid("morning")
              setCur(0)
              setEdit(false)
            }}
          >
            ↺ {p("Αρχικές ρουτίνες", "Default routines")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card2">
          <p>{p("Η ρουτίνα δεν έχει βήματα.", "This routine has no steps.")}</p>
          <button className="primary" onClick={() => setEdit(true)}>
            ✏️ {p("Επεξεργασία", "Edit")}
          </button>
        </div>
      ) : (
        <>
          <div className="nowNext">
            {[
              { t: p("ΤΩΡΑ", "NOW"), it: items[i], cls: "now" },
              { t: p("ΜΕΤΑ", "NEXT"), it: items[i + 1], cls: "next" },
            ].map(({ t, it, cls }) => (
              <div key={cls} className={`nnCard ${cls}`}>
                <div className="nnTag">{t}</div>
                {it ? (
                  <>
                    <div className="nnEmoji">{it.emoji}</div>
                    <div className="nnLabel">{it.label}</div>
                  </>
                ) : (
                  <div className="nnLabel nnEnd">{cls === "now" ? "🎉" : "🏁"}</div>
                )}
              </div>
            ))}
          </div>
          {i >= items.length && <div className="routineDone">🎉 {p("Τα καταφέραμε! Μπράβο!", "We did it! Well done!")}</div>}
          <div className="strip">
            {items.map((it, k) => (
              <button key={k} className={`stripItem ${k === i ? "on" : k < i ? "past" : ""}`} onClick={() => setCur(k)}>
                <span>{k < i ? "✅" : it.emoji}</span>
                <small>{it.label}</small>
              </button>
            ))}
          </div>
          <div className="grid2" style={{ marginTop: 12 }}>
            <button className="secondary" onClick={() => setCur(Math.max(0, i - 1))} disabled={i === 0}>
              ← {p("Πίσω", "Back")}
            </button>
            {i >= items.length ? (
              <button className="primary" onClick={() => setCur(0)}>
                ↺ {p("Ξανά", "Again")}
              </button>
            ) : (
              <button className="primary" onClick={next}>
                ✅ {p("Έγινε!", "Done!")}
              </button>
            )}
          </div>
          <button className="soft" style={{ width: "100%", marginTop: 10 }} onClick={() => setEdit(true)}>
            ✏️ {p("Επεξεργασία ρουτίνας", "Edit routine")}
          </button>
        </>
      )}
    </>
  )
}

/* ---------- Feelings wheel ---------- */

type Feeling = {
  el: string
  en: string
  emoji: string
  color: string
  soft: string
  body: [string, string]
  ask: [string, string]
  help: [string, string][]
}
const FEELINGS: Feeling[] = [
  {
    el: "Χαρά", en: "Happy", emoji: "😊", color: "#f59e0b", soft: "#fef3c7",
    body: ["Χαμογελάω, νιώθω ελαφρύς, θέλω να χοροπηδήξω.", "I smile, I feel light, I want to jump."],
    ask: ["Τι σε έκανε να χαρείς σήμερα;", "What made you happy today?"],
    help: [["Μοιράσου τη χαρά σου με κάποιον", "Share your joy with someone"], ["Πες «ευχαριστώ» σε όποιον σε βοήθησε", "Say “thank you” to someone who helped"], ["Ζωγράφισε τη στιγμή που χάρηκες", "Draw the happy moment"]],
  },
  {
    el: "Ηρεμία", en: "Calm", emoji: "😌", color: "#10b981", soft: "#d1fae5",
    body: ["Αναπνέω αργά, το σώμα μου είναι χαλαρό.", "I breathe slowly, my body is relaxed."],
    ask: ["Πού νιώθεις πιο ήρεμος;", "Where do you feel calmest?"],
    help: [["Κράτα τη στιγμή: 3 αργές ανάσες", "Keep the moment: 3 slow breaths"], ["Διάβασε ή άκουσε ένα παραμύθι", "Read or listen to a story"], ["Αγκαλιά με τη μαμά ή τον μπαμπά", "A cuddle with mum or dad"]],
  },
  {
    el: "Έκπληξη", en: "Surprised", emoji: "😮", color: "#06b6d4", soft: "#cffafe",
    body: ["Ανοίγουν τα μάτια μου, η καρδιά χτυπά γρήγορα.", "My eyes open wide, my heart beats fast."],
    ask: ["Τι σε ξάφνιασε τελευταία φορά;", "What surprised you last time?"],
    help: [["Σταμάτα για λίγο και κοίτα τι έγινε", "Stop for a moment and look"], ["Ρώτα για να καταλάβεις", "Ask questions to understand"], ["Πες σε κάποιον τι σε ξάφνιασε", "Tell someone what surprised you"]],
  },
  {
    el: "Λύπη", en: "Sad", emoji: "😢", color: "#3b82f6", soft: "#dbeafe",
    body: ["Νιώθω βαριά, έχω δάκρυα, δεν θέλω να παίξω.", "I feel heavy, I have tears, I don’t want to play."],
    ask: ["Τι σε βοηθά όταν είσαι λυπημένος;", "What helps you when you’re sad?"],
    help: [["Μίλησε σε κάποιον που αγαπάς", "Talk to someone you love"], ["Ζήτα μια αγκαλιά", "Ask for a hug"], ["Ζωγράφισε πώς νιώθεις", "Draw how you feel"]],
  },
  {
    el: "Φόβος", en: "Scared", emoji: "😨", color: "#8b5cf6", soft: "#ede9fe",
    body: ["Σφίγγεται η κοιλιά μου, τρέμουν τα χέρια μου.", "My tummy feels tight, my hands shake."],
    ask: ["Τι σε κάνει να νιώθεις ασφαλής;", "What makes you feel safe?"],
    help: [["Πάρε 5 αργές, βαθιές ανάσες", "Take 5 slow, deep breaths"], ["Πες σε έναν μεγάλο τι σε φοβίζει", "Tell a grown-up what scares you"], ["Κράτα το αγαπημένο σου λούτρινο", "Hold your favourite cuddly toy"]],
  },
  {
    el: "Θυμός", en: "Angry", emoji: "😠", color: "#ef4444", soft: "#fee2e2",
    body: ["Ζεσταίνομαι, σφίγγω τις γροθιές, μιλάω δυνατά.", "I get hot, I clench my fists, I speak loudly."],
    ask: ["Τι μπορείς να κάνεις πριν θυμώσεις πολύ;", "What can you do before you get very angry?"],
    help: [["Σταμάτα και μέτρα αργά ως το 10", "Stop and count slowly to 10"], ["Σφίξε και χαλάρωσε τις γροθιές σου", "Squeeze and relax your fists"], ["Πες «θύμωσα επειδή…» αντί να φωνάξεις", "Say “I’m angry because…” instead of shouting"]],
  },
]

export function FeelingsWheel() {
  const { state } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const [sel, setSel] = useState<number | null>(null)
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const R = 100
  const seg = 360 / FEELINGS.length
  const xy = (rad: number, deg: number) => [R + rad * Math.cos(((deg - 90) * Math.PI) / 180), R + rad * Math.sin(((deg - 90) * Math.PI) / 180)]
  const arc = (a0: number, a1: number, ri: number, ro: number) => {
    const [x0, y0] = xy(ro, a0)
    const [x1, y1] = xy(ro, a1)
    const [x2, y2] = xy(ri, a1)
    const [x3, y3] = xy(ri, a0)
    return `M${x0},${y0} A${ro},${ro} 0 0 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 0 0 ${x3},${y3} Z`
  }
  const spin = () => {
    if (spinning) return
    const k = Math.floor(Math.random() * FEELINGS.length)
    setSel(null)
    setSpinning(true)
    setAngle(angle - (angle % 360) + 360 * 5 + (k + 0.5) * seg)
    window.setTimeout(() => {
      setSpinning(false)
      setSel(k)
      beep(1, 660)
    }, 3600)
  }
  const f = sel !== null ? FEELINGS[sel] : null

  return (
    <>
      <ToolHead emoji="💗" title={p("Τροχός συναισθημάτων", "Feelings wheel")} />
      <div className="plusPanel feelStage" style={{ background: f ? f.soft : undefined }}>
        <svg viewBox="-6 -6 212 212" className="feelWheel" role="img" aria-label={p("Τροχός συναισθημάτων", "Feelings wheel")}>
          <circle cx={R} cy={R} r={R + 4} fill="#1e293b" />
          {FEELINGS.map((fe, i) => {
            const a0 = i * seg
            const a1 = a0 + seg
            const [tx, ty] = xy(64, a0 + seg / 2)
            const on = sel === i
            return (
              <g key={fe.el} onClick={() => !spinning && setSel(i)} style={{ cursor: "pointer", opacity: sel !== null && !on ? 0.55 : 1 }}>
                <path d={arc(a0 + 1, a1 - 1, 30, R - 2)} fill={fe.color} />
                <text x={tx} y={ty - 2} textAnchor="middle" fontSize="24">{fe.emoji}</text>
                <text x={tx} y={ty + 17} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{l === "el" ? fe.el : fe.en}</text>
              </g>
            )
          })}
          {(angle !== 0 || spinning) && (
            <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${R}px ${R}px`, transition: spinning ? "transform 3.6s cubic-bezier(.12,.67,.15,1)" : "none" }}>
              <path d={`M${R - 7},${R} L${R},${14} L${R + 7},${R} Z`} fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />
            </g>
          )}
          <circle cx={R} cy={R} r="28" fill="#fff" stroke="#fbbf24" strokeWidth="3" />
          <text x={R} y={R + 9} textAnchor="middle" fontSize="26">{f?.emoji ?? "💗"}</text>
        </svg>
        <button className="primary" onClick={spin} disabled={spinning}>
          {spinning ? p("Γυρίζει…", "Spinning…") : p("✨ Γύρισε τον τροχό", "✨ Spin the wheel")}
        </button>
        <p className="small" style={{ textAlign: "center" }}>
          {p("Πάτα το συναίσθημα που νιώθεις, ή γύρισε τον τροχό για κουβέντα: «Πότε ένιωσες…;»", "Tap how you feel, or spin to talk: “When did you feel…?”")}
        </p>
      </div>
      {f && (
        <div className="card2 feelCard" style={{ borderColor: f.color }}>
          <div className="feelHead" style={{ background: f.color }}>
            <span className="feelEmoji">{f.emoji}</span>
            <div>
              <div className="feelName">{l === "el" ? f.el : f.en}</div>
              <div>{f.body[l === "el" ? 0 : 1]}</div>
            </div>
          </div>
          <div className="small" style={{ fontWeight: 800, margin: "12px 0 6px" }}>{p("ΤΙ ΜΠΟΡΩ ΝΑ ΚΑΝΩ", "WHAT CAN I DO")}</div>
          <ol className="feelHelp">
            {f.help.map(([a, b], k) => (
              <li key={k} style={{ background: `${f.color}1a` }}>
                <span style={{ background: f.color }}>{k + 1}</span>
                {l === "el" ? a : b}
              </li>
            ))}
          </ol>
          <div className="feelAsk" style={{ borderColor: f.color }}>
            <div className="small" style={{ fontWeight: 800 }}>{p("ΑΣ ΜΙΛΗΣΟΥΜΕ", "LET'S TALK")}</div>
            «{f.ask[l === "el" ? 0 : 1]}»
          </div>
          {(sel === 3 || sel === 4 || sel === 5) && (
            <button className="secondary" style={{ width: "100%", marginTop: 10 }} onClick={() => go("tools/breath")}>
              🧘 {p("Πάμε για ανάσες ηρεμίας", "Let’s do calm breathing")}
            </button>
          )}
        </div>
      )}
    </>
  )
}

/* ---------- Calm breathing ---------- */

type Step = [string, string, number] // el, en, seconds
const PATTERNS: Record<string, { el: string; en: string; steps: Step[] }> = {
  calm: { el: "Ήρεμη (4-4)", en: "Calm (4-4)", steps: [["Εισπνοή", "Breathe in", 4], ["Εκπνοή", "Breathe out", 4]] },
  balloon: { el: "Μπαλόνι (3-5)", en: "Balloon (3-5)", steps: [["Φούσκωσε το μπαλόνι", "Blow up the balloon", 3], ["Ξεφούσκωσε σιγά-σιγά", "Let it out slowly", 5]] },
  box: { el: "Κουτί (4-4-4-4)", en: "Box (4-4-4-4)", steps: [["Εισπνοή", "Breathe in", 4], ["Κράτημα", "Hold", 4], ["Εκπνοή", "Breathe out", 4], ["Κράτημα", "Hold", 4]] },
}

export function Breathing() {
  const { state } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const [pat, setPat] = useState<keyof typeof PATTERNS>("calm")
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [left, setLeft] = useState(0)
  const [rounds, setRounds] = useState(0)
  const steps = PATTERNS[pat].steps
  useWakeLock(running)

  useEffect(() => {
    if (!running) return
    let i = 0
    let t = steps[0][2]
    setStep(0)
    setLeft(t)
    setRounds(0)
    const iv = window.setInterval(() => {
      t -= 1
      if (t <= 0) {
        i = (i + 1) % steps.length
        if (i === 0) setRounds((r) => r + 1)
        t = steps[i][2]
        setStep(i)
      }
      setLeft(t)
    }, 1000)
    return () => window.clearInterval(iv)
  }, [running, steps])

  const [el, en, secs] = steps[step]
  const inhale = el === "Εισπνοή" || el === "Φούσκωσε το μπαλόνι"
  const exhale = el === "Εκπνοή" || el === "Ξεφούσκωσε σιγά-σιγά"
  const prevInhale = step > 0 && (steps[step - 1][0] === "Εισπνοή")
  const big = !running ? false : inhale ? true : exhale ? false : prevInhale

  return (
    <>
      <ToolHead emoji="🧘" title={p("Ανάσες ηρεμίας", "Calm breathing")} />
      <div className="plusPanel breathStage">
        <div className="breathBox">
          <div
            className="breathBall"
            style={{ width: big ? "100%" : "42%", height: big ? "100%" : "42%", transition: `all ${running ? secs : 0.4}s ease-in-out` }}
          >
            <div>
              <div className="bLabel">{running ? (l === "el" ? el : en) : p("Έτοιμοι;", "Ready?")}</div>
              {running && <div className="bNum">{left}</div>}
            </div>
          </div>
        </div>
        {running && (
          <p className="small" style={{ textAlign: "center" }}>
            {p("Γύροι", "Rounds")}: {rounds}
            {rounds >= 5 && ` · ${p("Μπράβο, πολύ ήρεμα! 🌿", "Well done, so calm! 🌿")}`}
          </p>
        )}
        <div className="chips" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(PATTERNS).map(([k, v]) => (
            <button
              key={k}
              className={`chip ${pat === k ? "sel" : ""}`}
              onClick={() => {
                setPat(k)
                setRunning(false)
              }}
            >
              {l === "el" ? v.el : v.en}
            </button>
          ))}
        </div>
        <button className="primary" onClick={() => setRunning((r) => !r)}>
          {running ? p("Τέλος", "Stop") : p("Ξεκινάμε", "Start")}
        </button>
        <p className="small" style={{ textAlign: "center" }}>
          {p(
            "Κάντε το μαζί: ο κύκλος μεγαλώνει όσο παίρνουμε ανάσα και μικραίνει όσο τη βγάζουμε.",
            "Do it together: the circle grows as we breathe in and shrinks as we breathe out.",
          )}
        </p>
      </div>
    </>
  )
}
