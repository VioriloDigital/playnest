import { useEffect, useMemo, useRef, useState } from "react"
import { ActivityMini, openActivity, SectionTitle } from "../components"
import {
  activities,
  activityOfTheDay,
  buildWeek,
  CATEGORIES,
  getActivity,
  norm,
  pickActivity,
  quickFilter,
  type QuickKey,
} from "../lib/activities"
import { actText, DAYS, greeting, label, PLACE_LABEL, pick2, t, TYPE_LABEL } from "../lib/i18n"
import { BADGES, dayKey, removeEntry, stats } from "../lib/journal"
import { useCompleteActivity } from "../lib/rewards"
import { StarsCard } from "./rewards"
import { openTour } from "./intro"
import { ToolsCard } from "./tools"
import { reportActivity } from "../lib/ai"
import { remindersSupported, syncReminders } from "../lib/reminder"
import { back, go } from "../lib/router"
import { useStore } from "../lib/store"
import { AGES, INTERESTS, type ActType, type Activity, type Age, type Interest, type LogEntry, type Rating, AVATARS } from "../lib/types"

export function ProfileCard() {
  const { state, profile } = useStore()
  const l = state.lang
  return (
    <div className="card2 row">
      <div className="avatar">{AVATARS[state.active] ?? "🐥"}</div>
      <div style={{ flex: 1 }}>
        <div className="small">{t(l, "profile")}</div>
        <b>{profile.name || t(l, "myChild")}</b>
        <div className="small">
          {profile.age}
          {profile.interests.length > 0 && " • " + profile.interests.slice(0, 3).map((x) => t(l, x)).join(", ")}
        </div>
      </div>
      <button className="iconbtn" aria-label={t(l, "profile")} onClick={() => go("profile")}>
        ✏️
      </button>
    </div>
  )
}

const QUICK: QuickKey[] = ["rain", "nomat", "ten", "energy", "bed", "car", "rest"]
const TYPES: ActType[] = ["creative", "learning", "movement", "calm"]

export function Home() {
  const { state, profile } = useStore()
  const l = state.lang
  const open = (f: Parameters<typeof pickActivity>[0]) => openActivity(pickActivity(f).id)
  return (
    <>
      <div className="hero2">
        <div className="small">{greeting(l)}</div>
        <h1>{t(l, "what")}</h1>
        <p>{t(l, "heroSub")}</p>
        <button className="primary" onClick={() => open({ age: profile.age })}>
          {t(l, "now")}
        </button>
      </div>
      <button className="exploreBtn" onClick={() => go("explore")}>
        {t(l, "explore")}
      </button>
      <ProfileCard />
      <StarsCard />
      <ToolsCard />
      <SectionTitle>{t(l, "quick")}</SectionTitle>
      <div className="chips">
        {QUICK.map((k) => (
          <button key={k} className="chip" onClick={() => open(quickFilter(k, profile.age))}>
            {t(l, k)}
          </button>
        ))}
      </div>
      <SectionTitle badge="FREE">{t(l, "today")}</SectionTitle>
      <ActivityMini a={activityOfTheDay()} />
      <SectionTitle>{t(l, "find")}</SectionTitle>
      <div className="card2">
        <div className="chips">
          {TYPES.map((x) => (
            <button key={x} className="chip" onClick={() => open({ age: profile.age, type: x })}>
              {label(l, TYPE_LABEL[x])}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function activityText(a: Activity, l: "el" | "en"): string {
  return [
    `${a.emoji} ${actText.title(a, l)}`,
    actText.desc(a, l),
    `${t(l, "materials")}:\n` + actText.materials(a, l).map((x) => `• ${x}`).join("\n"),
    `${t(l, "steps")}:\n` + actText.steps(a, l).map((x, i) => `${i + 1}. ${x}`).join("\n"),
    "— PlayNest",
  ].join("\n\n")
}

const RATINGS: [Rating, string][] = [
  ["love", "❤️"],
  ["ok", "😐"],
  ["no", "👎"],
]

export function ActivityView({ id }: { id: number }) {
  const { state, update, profile, toast } = useStore()
  const l = state.lang
  const a = getActivity(id)
  if (!a) {
    return (
      <div className="card2">
        <p>{pick2(l, "Η δραστηριότητα δεν βρέθηκε.", "Activity not found.")}</p>
        <button className="primary" onClick={() => go("", true)}>
          {t(l, "home")}
        </button>
      </div>
    )
  }
  const fav = state.favs.includes(a.id)
  const rating = state.ratings[a.id]
  const toggleFav = () =>
    update((s) => ({ ...s, favs: fav ? s.favs.filter((x) => x !== a.id) : [...s.favs, a.id] }))
  const [doneOpen, setDoneOpen] = useState(false)
  const [note, setNote] = useState("")
  const [doneRating, setDoneRating] = useState<Rating | undefined>(rating)
  const timesDone = state.log.filter((e) => e.actId === a.id).length
  const complete = useCompleteActivity()
  const saveDone = () => {
    complete({ actId: a.id, note: note.trim(), rating: doneRating })
    setDoneOpen(false)
    setNote("")
  }
  const share = async () => {
    const text = activityText(a, l)
    try {
      if (navigator.share) await navigator.share({ title: actText.title(a, l), text })
      else {
        await navigator.clipboard.writeText(text)
        toast(t(l, "copied"))
      }
    } catch {
      /* user cancelled */
    }
  }
  return (
    <>
      <button className="back noprint" onClick={() => back()}>
        ← {pick2(l, "Πίσω", "Back")}
      </button>
      <article className="activity-card">
        <div className="heroEmoji">{a.emoji}</div>
        <div>
          <span className="pill">{label(l, TYPE_LABEL[a.types[0]])}</span>
          {a.premium && <span className="plusBadge" style={{ marginLeft: 6 }}>👑 PLUS</span>}
          <h1>{actText.title(a, l)}</h1>
          <p>{actText.desc(a, l)}</p>
          <div className="meta">
            <span>👶 {a.ages.join(", ")}</span>
            <span>
              ⏱️ {a.times.join("/")} {t(l, "minutes")}
            </span>
            {a.places.map((p) => (
              <span key={p}>{label(l, PLACE_LABEL[p])}</span>
            ))}
          </div>
        </div>
      </article>
      <div className="grid2">
        <section className="info">
          <h2>🧰 {t(l, "materials")}</h2>
          <ol>
            {actText.materials(a, l).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </section>
        <section className="info">
          <h2>🌱 {t(l, "skills")}</h2>
          <ol>
            {actText.skills(a, l).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </section>
      </div>
      <section className="info">
        <h2>🪄 {t(l, "steps")}</h2>
        <ol>
          {actText.steps(a, l).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      </section>
      <div className="grid2 noprint">
        <button className="primary" onClick={() => go(`play/${a.id}`)}>
          ▶️ {pick2(l, "Ξεκινάμε!", "Let’s play!")}
        </button>
        <button className="secondary doneBtn" onClick={() => setDoneOpen(true)}>
          ✅ {pick2(l, "Το κάναμε!", "We did it!")}
          {timesDone > 0 && <small> ×{timesDone}</small>}
        </button>
      </div>
      {doneOpen && (
        <div className="card2 noprint doneSheet">
          <h2>{t(l, "liked")}</h2>
          <div className="rating">
            {RATINGS.map(([r, icon]) => (
              <button
                key={r}
                className={`soft ${doneRating === r ? "sel" : ""}`}
                aria-pressed={doneRating === r}
                onClick={() => setDoneRating(r)}
              >
                {icon}
              </button>
            ))}
          </div>
          <label className="fields" style={{ marginTop: 12 }}>
            {pick2(l, "Μια σημείωση ή ανάμνηση (προαιρετικά)", "A note or memory (optional)")}
            <textarea
              className="noteInput"
              value={note}
              maxLength={400}
              onChange={(e) => setNote(e.target.value)}
              placeholder={pick2(l, "π.χ. Γέλασε πολύ με το κόκκινο χρώμα!", "e.g. Loved finding red things!")}
            />
          </label>
          <div className="grid2" style={{ marginTop: 10 }}>
            <button className="secondary" onClick={() => setDoneOpen(false)}>
              {pick2(l, "Άκυρο", "Cancel")}
            </button>
            <button className="primary" onClick={saveDone}>
              {t(l, "save")}
            </button>
          </div>
        </div>
      )}
      <div className="miniActions noprint">
        <button onClick={toggleFav} aria-pressed={fav}>
          <span>{fav ? "❤️" : "🤍"}</span>
          {t(l, "fav")}
        </button>
        <button onClick={() => go(`activity/${pickActivity({ age: profile.age, exclude: [a.id] }).id}`, true)}>
          <span>🔄</span>
          {pick2(l, "Άλλη", "Another")}
        </button>
        <button onClick={share}>
          <span>📤</span>
          {pick2(l, "Κοινοποίηση", "Share")}
        </button>
        <button onClick={() => window.print()}>
          <span>🖨️</span>
          {pick2(l, "Εκτύπωση", "Print")}
        </button>
      </div>
      {a.ai && <ReportAI a={a} />}
      <div className="printFooter">PlayNest · {pick2(l, "Ιδέες παιχνιδιού για κάθε στιγμή", "Play ideas for every moment")}</div>
    </>
  )
}

const REPORT_REASONS: [string, string, string][] = [
  ["unsafe", "⚠️ Μη ασφαλές για την ηλικία", "⚠️ Unsafe for the age"],
  ["inappropriate", "🚫 Ακατάλληλο περιεχόμενο", "🚫 Inappropriate content"],
  ["wrong", "❓ Λάθος ή ακατανόητο", "❓ Wrong or confusing"],
]

/** Lets parents flag an AI-generated activity (required for AI content on Google Play). */
function ReportAI({ a }: { a: Activity }) {
  const { state, toast } = useStore()
  const l = state.lang
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const send = async (reason: string) => {
    setOpen(false)
    try {
      await reportActivity(a, reason)
      setSent(true)
      toast(pick2(l, "Ευχαριστούμε! Η αναφορά στάλθηκε.", "Thank you! The report was sent."))
    } catch {
      toast(pick2(l, "Δεν στάλθηκε. Δοκίμασε ξανά με σύνδεση στο internet.", "Not sent. Try again when online."))
    }
  }
  return (
    <div className="card2 noprint reportBox">
      <p className="small">
        ✨{" "}
        {pick2(
          l,
          "Τη δημιούργησε το PlayNest AI. Ελέγξτε την πριν την κάνετε και να είστε πάντα κοντά στο παιδί.",
          "Created by PlayNest AI. Check it before you start and always stay close to the child.",
        )}
      </p>
      {sent ? (
        <p className="small">✅ {pick2(l, "Η αναφορά στάλθηκε.", "Report sent.")}</p>
      ) : open ? (
        <div className="reportReasons">
          {REPORT_REASONS.map(([k, gr, en]) => (
            <button key={k} className="soft" onClick={() => send(k)}>
              {l === "el" ? gr : en}
            </button>
          ))}
          <button className="soft" onClick={() => setOpen(false)}>
            {pick2(l, "Άκυρο", "Cancel")}
          </button>
        </div>
      ) : (
        <button className="soft" onClick={() => setOpen(true)}>
          🚩 {pick2(l, "Αναφορά δραστηριότητας", "Report this activity")}
        </button>
      )}
    </div>
  )
}

export function Week() {
  const { state, update, profile, toast } = useStore()
  const l = state.lang
  const generate = () => {
    // Journal entries stay; only the link to the old plan's days is dropped.
    update((s) => ({
      ...s,
      week: buildWeek(profile.age),
      done: [],
      log: s.log.map(({ weekDay: _w, ...e }) => e),
    }))
    toast(t(l, "weekReady"))
  }
  const swap = (i: number) =>
    update((s) => {
      const week = [...s.week]
      week[i] = pickActivity({ age: profile.age, exclude: s.week }).id
      const log = s.log.map((e) => (e.weekDay === i ? { ...e, weekDay: undefined } : e))
      return { ...s, week, log, done: s.done.filter((x) => x !== i) }
    })
  const complete = useCompleteActivity()
  const mark = (i: number) => {
    if (state.done.includes(i)) {
      update((s) => {
        const entry = s.log.find((e) => e.weekDay === i && e.actId === s.week[i])
        const next = entry ? removeEntry(s, entry.id) : s
        return { ...next, done: s.done.filter((x) => x !== i) }
      })
    } else {
      complete({ actId: state.week[i], weekDay: i })
      update((s) => ({ ...s, done: [...s.done, i] }))
    }
  }
  return (
    <>
      <SectionTitle badge="PLUS">{t(l, "planner")}</SectionTitle>
      <div className="card2 plusCard">
        <p>{t(l, "plannerSub")}</p>
        <button className="primary" onClick={generate}>
          {t(l, state.week.length ? "regenerate" : "generate")}
        </button>
      </div>
      {state.week.length > 0 && (
        <div className="week">
          {state.week.map((id, i) => {
            const a = getActivity(id)
            if (!a) return null
            return (
              <div className="day" key={i}>
                <strong>{DAYS[l][i]}</strong>
                <button className="dayBody" onClick={() => openActivity(a.id)}>
                  <div className="dt">
                    {a.emoji} {actText.title(a, l)}
                  </div>
                  <div className="small">
                    {a.times[0]}' • {label(l, TYPE_LABEL[a.types[0]])}
                  </div>
                </button>
                <div>
                  <button className="iconbtn" aria-label="swap" onClick={() => swap(i)}>
                    🔄
                  </button>
                  <button className="iconbtn" aria-label="done" onClick={() => mark(i)}>
                    {state.done.includes(i) ? "✅" : "⬜"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export function Favorites() {
  const { state } = useStore()
  const l = state.lang
  const list = state.favs.map(getActivity).filter((a): a is Activity => !!a)
  return (
    <>
      <SectionTitle>❤️ {t(l, "favorites")}</SectionTitle>
      {list.length ? (
        list.map((a) => <ActivityMini key={a.id} a={a} />)
      ) : (
        <div className="card2">
          <p>{t(l, "empty")}</p>
          <p className="small">{t(l, "emptyHint")}</p>
        </div>
      )}
    </>
  )
}

function JournalItem({ e }: { e: LogEntry }) {
  const { state, update } = useStore()
  const l = state.lang
  const a = getActivity(e.actId)
  const d = new Date(e.date)
  const when = d.toLocaleDateString(l === "el" ? "el-GR" : "en-GB", { weekday: "short", day: "numeric", month: "short" })
  const remove = () => {
    if (!confirm(pick2(l, "Διαγραφή από το ημερολόγιο;", "Remove from the journal?"))) return
    update((s) => {
      const next = removeEntry(s, e.id)
      return e.weekDay !== undefined ? { ...next, done: next.done.filter((x) => x !== e.weekDay) } : next
    })
  }
  return (
    <div className="journalItem">
      <div className="jEmoji">{a?.emoji ?? "🎈"}</div>
      <button className="dayBody" onClick={() => a && openActivity(a.id)}>
        <b>{a ? actText.title(a, l) : "—"}</b>
        <div className="small">
          {when}
          {e.rating && ` · ${{ love: "❤️", ok: "😐", no: "👎" }[e.rating]}`}
        </div>
        {e.note && <div className="jNote">“{e.note}”</div>}
      </button>
      <button className="iconbtn" aria-label="delete" onClick={remove}>
        🗑️
      </button>
    </div>
  )
}

export function Progress() {
  const { state } = useStore()
  const l = state.lang
  const st = stats(state.log)
  const [all, setAll] = useState(false)
  const today = dayKey(new Date())
  const doneToday = state.log.some((e) => dayKey(e.date) === today)
  // Last 7 days, oldest first, for the mini bar chart.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const k = dayKey(d)
    return {
      k,
      label: d.toLocaleDateString(l === "el" ? "el-GR" : "en-GB", { weekday: "narrow" }),
      n: state.log.filter((e) => dayKey(e.date) === k).length,
    }
  })
  const max = Math.max(1, ...days.map((d) => d.n))
  const shown = all ? state.log : state.log.slice(0, 10)
  return (
    <>
      <SectionTitle>📊 {t(l, "progress")}</SectionTitle>
      <StarsCard />
      <div className="card2 streakCard">
        <div className="streakNum">🔥 {st.streak}</div>
        <div>
          <b>{pick2(l, st.streak === 1 ? "μέρα στη σειρά" : "μέρες στη σειρά", st.streak === 1 ? "day in a row" : "days in a row")}</b>
          <div className="small">
            {doneToday
              ? pick2(l, "Παίξατε ήδη σήμερα. Μπράβο!", "You already played today. Well done!")
              : pick2(l, "Κάντε μια δραστηριότητα σήμερα για να συνεχίσει το σερί.", "Do one activity today to keep the streak going.")}
            {st.best > 1 && ` ${pick2(l, "Ρεκόρ", "Best")}: ${st.best}`}
          </div>
        </div>
      </div>
      <div className="stats">
        <div className="stat">
          <b>{st.week}</b>
          <span className="small">{pick2(l, "αυτή την εβδομάδα", "this week")}</span>
        </div>
        <div className="stat">
          <b>{st.total}</b>
          <span className="small">{pick2(l, "συνολικά", "in total")}</span>
        </div>
        <div className="stat">
          <b>{st.creative}</b>
          <span className="small">{t(l, "creative")}</span>
        </div>
        <div className="stat">
          <b>{st.movement}</b>
          <span className="small">{t(l, "movement")}</span>
        </div>
      </div>
      <div className="card2">
        <h2>{pick2(l, "Οι τελευταίες 7 μέρες", "The last 7 days")}</h2>
        <div className="bars" role="img" aria-label={days.map((d) => `${d.label}: ${d.n}`).join(", ")}>
          {days.map((d) => (
            <div key={d.k} className="barCol">
              <span className="barN">{d.n || ""}</span>
              <div className={`bar ${d.k === today ? "today" : ""}`} style={{ height: `${(d.n / max) * 100}%` }} />
              <span className="small">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card2">
        <h2>{t(l, "badges")}</h2>
        <div className="chips">
          {BADGES.map((b) => (
            <span key={b.id} className={`chip ${b.test(st) ? "sel" : "locked"}`}>
              {l === "el" ? b.el : b.en}
            </span>
          ))}
        </div>
      </div>
      <SectionTitle>📔 {pick2(l, "Ημερολόγιο παιχνιδιού", "Play journal")}</SectionTitle>
      {state.log.length === 0 ? (
        <div className="card2">
          <p>{pick2(l, "Δεν υπάρχει ακόμη τίποτα εδώ.", "Nothing here yet.")}</p>
          <p className="small">
            {pick2(
              l,
              "Όταν κάνετε μια δραστηριότητα, πατήστε «✅ Το κάναμε!» και γράψτε μια μικρή ανάμνηση.",
              "When you do an activity, tap “✅ We did it!” and write a little memory.",
            )}
          </p>
        </div>
      ) : (
        <div className="card2">
          {shown.map((e) => (
            <JournalItem key={e.id} e={e} />
          ))}
          {state.log.length > 10 && !all && (
            <button className="soft" style={{ width: "100%", marginTop: 8 }} onClick={() => setAll(true)}>
              {pick2(l, `Όλες (${state.log.length})`, `Show all (${state.log.length})`)}
            </button>
          )}
        </div>
      )}
    </>
  )
}

export function ProfileEdit() {
  const { state, update, profile, toast } = useStore()
  const l = state.lang
  const [name, setName] = useState(profile.name)
  const [age, setAge] = useState<Age>(profile.age)
  const [ints, setInts] = useState<Interest[]>(profile.interests)
  const toggle = (x: Interest) => setInts((v) => (v.includes(x) ? v.filter((y) => y !== x) : [...v, x]))
  const save = () => {
    update((s) => {
      const profiles = [...s.profiles]
      profiles[s.active] = { ...profiles[s.active], name: name.trim(), age, interests: ints }
      return { ...s, profiles }
    })
    toast(t(l, "saved"))
    back()
  }
  return (
    <>
      <SectionTitle>👶 {t(l, "profile")}</SectionTitle>
      <div className="card2 fields">
        <label>
          {t(l, "name")}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(l, "namePh")} maxLength={40} />
        </label>
        <label>
          {t(l, "age")}
          <select value={age} onChange={(e) => setAge(e.target.value as Age)}>
            {AGES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <div>
          <div className="small">{t(l, "interests")}</div>
          <div className="interests">
            {INTERESTS.map((x) => (
              <button key={x} className={`interest ${ints.includes(x) ? "sel" : ""}`} onClick={() => toggle(x)}>
                {t(l, x)}
              </button>
            ))}
          </div>
        </div>
        <button className="primary" onClick={save}>
          {t(l, "save")}
        </button>
      </div>
      <ReminderSettings />
      <About />
    </>
  )
}

const SITE = "https://playnest.kosbouris.workers.dev"

function About() {
  const { state, update } = useStore()
  const l = state.lang
  return (
    <>
      <SectionTitle>ℹ️ {pick2(l, "Σχετικά", "About")}</SectionTitle>
      <div className="card2 aboutLinks">
        <button className="linkBtn aboutTour" onClick={openTour}>
          🧭 {pick2(l, "Ξενάγηση στην εφαρμογή", "App tour")}
        </button>
        <button className="linkBtn aboutTour" onClick={() => update((s) => ({ ...s, introSeen: false }))}>
          👋 {pick2(l, "Οθόνη υποδοχής", "Welcome screen")}
        </button>
        <a href={`${SITE}/privacy.html`} target="_blank" rel="noopener">
          🔒 {pick2(l, "Πολιτική απορρήτου", "Privacy policy")}
        </a>
        <a href={`${SITE}/terms.html`} target="_blank" rel="noopener">
          📄 {pick2(l, "Όροι χρήσης", "Terms of use")}
        </a>
        <a href="mailto:info@viorilo.gr">✉️ info@viorilo.gr</a>
        <p className="small">
          PlayNest 2.0 · Viorilo Digital ·{" "}
          {pick2(l, "Τα δεδομένα σου μένουν μόνο σε αυτή τη συσκευή.", "Your data stays on this device only.")}
        </p>
      </div>
    </>
  )
}

function ReminderSettings() {
  const { state, update, toast } = useStore()
  const l = state.lang
  const r = state.reminder
  const apply = async (next: typeof r) => {
    update((s) => ({ ...s, reminder: next }))
    const ok = await syncReminders(next, l)
    if (next.on && !ok) {
      update((s) => ({ ...s, reminder: { ...next, on: false } }))
      toast(pick2(l, "Επίτρεψε τις ειδοποιήσεις στις ρυθμίσεις του κινητού.", "Allow notifications in your phone settings."))
    } else if (next.on) toast(pick2(l, `Υπενθύμιση κάθε μέρα στις ${next.time}`, `Reminder every day at ${next.time}`))
  }
  return (
    <>
      <SectionTitle>🔔 {pick2(l, "Καθημερινή υπενθύμιση", "Daily reminder")}</SectionTitle>
      <div className="card2 fields">
        {remindersSupported() ? (
          <>
            <label className="row between">
              <span>{pick2(l, "Ειδοποίηση με την ιδέα της ημέρας", "Notification with the idea of the day")}</span>
              <input
                type="checkbox"
                className="toggle"
                checked={r.on}
                onChange={(e) => apply({ ...r, on: e.target.checked })}
              />
            </label>
            <label>
              {pick2(l, "Ώρα", "Time")}
              <input type="time" value={r.time} onChange={(e) => e.target.value && apply({ ...r, time: e.target.value })} />
            </label>
          </>
        ) : (
          <p className="small">
            {pick2(
              l,
              "Οι υπενθυμίσεις λειτουργούν στην εφαρμογή PlayNest για κινητό (Android/iOS).",
              "Reminders work in the PlayNest mobile app (Android/iOS).",
            )}
          </p>
        )}
      </div>
    </>
  )
}

export function Explore({ initialCat }: { initialCat: string }) {
  const { state } = useStore()
  const l = state.lang
  const [cat, setCat] = useState(CATEGORIES.some((c) => c[0] === initialCat) ? initialCat : "all")
  const [q, setQ] = useState("")
  const [time, setTime] = useState("all")
  const list = useMemo(() => {
    // Every word must match somewhere: title (both languages), description or materials.
    const words = norm(q.trim()).split(/\s+/).filter(Boolean)
    return activities.filter((a) => {
      if (cat !== "all" && !a.tags.includes(cat)) return false
      if (time !== "all" && !a.times.includes(time)) return false
      if (!words.length) return true
      const hay = norm(`${a.titleEl} ${a.titleEn} ${actText.desc(a, l)} ${actText.materials(a, l).join(" ")}`)
      return words.every((w) => hay.includes(w))
    })
  }, [cat, q, l, time])
  const chips = useRef<HTMLDivElement>(null)
  useEffect(() => {
    chips.current?.querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [cat])
  const pickCat = (c: string) => {
    setCat(c)
    go(c === "all" ? "explore" : `explore?cat=${c}`, true)
  }
  return (
    <div className="exwrap">
      <div className="exhead">
        <div>
          <b style={{ fontSize: 24, color: "#3da9b6" }}>PlayNest Explore</b>
          <div>
            {list.length} / {activities.length}
          </div>
        </div>
        <button className="exclose" aria-label="close" onClick={() => back()}>
          ✕
        </button>
      </div>
      <input
        className="exsearch"
        type="search"
        placeholder={pick2(l, "Αναζήτηση: τίτλος ή υλικό (π.χ. χαρτί)…", "Search: title or material (e.g. paper)…")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="exfilters" ref={chips}>
        {CATEGORIES.map(([key, gr, eng]) => (
          <button key={key} className={cat === key ? "on" : ""} onClick={() => pickCat(key)}>
            {l === "el" ? gr : eng}
          </button>
        ))}
      </div>
      <div className="exfilters timeFilters">
        {["all", "5", "15", "30", "60"].map((x) => (
          <button key={x} className={time === x ? "on" : ""} onClick={() => setTime(x)}>
            ⏱ {x === "all" ? pick2(l, "Κάθε διάρκεια", "Any length") : `${x}'`}
          </button>
        ))}
      </div>
      {list.length === 0 && <div className="card2">{t(l, "noResults")}</div>}
      <div className="exgrid">
        {list.map((a) => (
          <button key={a.id} className="excard" onClick={() => openActivity(a.id)}>
            <span className={`exbadge ${a.premium ? "plus" : ""}`}>{a.premium ? "👑 PLUS" : "FREE"}</span>
            <div className="exart">{a.emoji}</div>
            <h3>{actText.title(a, l)}</h3>
            <div className="exmeta">
              👶 {a.ages.join(", ")} · ⏱ {a.times[0]}'
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
