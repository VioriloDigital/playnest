import { useState } from "react"
import { openActivity, PlusHead, RecCard, SectionTitle } from "../components"
import {
  activities,
  getActivity,
  PACKS,
  personalized,
  siblingPick,
  smartPick,
  snapSuggest,
  SNAP_ITEMS,
} from "../lib/activities"
import { actText, pick2 } from "../lib/i18n"
import { go } from "../lib/router"
import { aiActivity, AIError, aiErrorText, aiSnap, photoToJpeg } from "../lib/ai"
import { useStore } from "../lib/store"
import { AGES, MAX_PROFILES, type ActType, type Activity, type Age, type AppState, type Place } from "../lib/types"

export function PlusHome() {
  const { state, profile } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const features: [string, string, string, string][] = [
    ["plus/snap", "📸", "Snap & Play", p("Φωτογράφισε ό,τι έχεις και βρες παιχνίδι.", "Photograph what you have and find a game.")],
    ["plus/ai", "🤖", "PlayNest AI", p("Ιδέες με βάση ηλικία, χρόνο, χώρο και υλικά.", "Ideas based on age, time, place and materials.")],
    ["plus/profiles", "👶", p("Προφίλ & αδέλφια", "Profiles & siblings"), p("Έως 3 παιδιά και κοινές δραστηριότητες.", "Up to 3 children and sibling activities.")],
    ["week", "📅", "Smart Planner", p("Ισορροπημένο πρόγραμμα 7 ημερών.", "Balanced 7-day plan.")],
    ["plus/packs", "🧰", "Premium Packs", p("Ταξίδι, βροχή, STEM, χωρίς οθόνη και άλλα.", "Travel, rainy day, STEM, screen-free and more.")],
    ["plus/challenge", "🏆", "7-Day Challenge", p("Μία μικρή αποστολή κάθε μέρα.", "One small mission every day.")],
    ["plus/progress", "📈", "Advanced Progress", p("Συνήθειες, ποικιλία και πρόοδος.", "Habits, variety and progress.")],
    ["plus/printables", "🖨️", "Printables", p("Κάρτες παιχνιδιού και μικρές αποστολές.", "Play cards and mini missions.")],
  ]
  return (
    <>
      <div className="plusHeroV2">
        <span className="plusBadge">PLUS</span>
        <h1>👑 PlayNest Plus</h1>
        <p>
          {p(
            "Έξυπνες ιδέες, εξατομίκευση και εργαλεία που κάνουν το «τι να παίξουμε;» πανεύκολο.",
            "Smart ideas, personalization and tools that make “what should we play?” effortless.",
          )}
        </p>
        <button className="plusCTA" onClick={() => go("plus/ai")}>
          ✨ {p("Δημιούργησε δραστηριότητα τώρα", "Create an activity now")}
        </button>
      </div>
      <SectionTitle>{p("Τα εργαλεία σου", "Your tools")}</SectionTitle>
      <div className="plusGridV2">
        {features.map(([to, icon, title, sub]) => (
          <button key={to} className="plusFeature" onClick={() => go(to)}>
            <span className="pfIcon">{icon}</span>
            <b>{title}</b>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      <SectionTitle>✨ {p("Για εσάς", "For you")}</SectionTitle>
      <div className="recGrid">
        {personalized(profile).map((a) => (
          <RecCard key={a.id} a={a} />
        ))}
      </div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card2">
          <b>€2.99 / {p("μήνα", "month")}</b>
        </div>
        <div className="card2">
          <b>€19.99 / {p("έτος", "year")} ⭐</b>
        </div>
      </div>
      <div className="plusPanel">
        <b>{p("Plus preview ενεργό", "Plus preview active")}</b>
        <p className="small">
          {p(
            "Οι λειτουργίες Plus είναι ανοιχτές για δοκιμή. Οι συνδρομές δεν έχουν ενεργοποιηθεί ακόμη και δεν γίνεται καμία χρέωση.",
            "Plus features are open for testing. Subscriptions are not enabled yet and nothing is charged.",
          )}
        </p>
      </div>
    </>
  )
}

function ResultCard({ a, onAgain, note }: { a: Activity; onAgain?: () => void; note?: string }) {
  const { state } = useStore()
  const l = state.lang
  return (
    <div className="resultCard">
      <div className="bigEmoji">{a.emoji}</div>
      {a.ai ? <span className="aiBadge">✨ PlayNest AI</span> : <span className="plusBadge">{a.premium ? "PLUS" : "SMART PICK"}</span>}
      <h2>{actText.title(a, l)}</h2>
      <p>{actText.desc(a, l)}</p>
      {note && <p className="small">{note}</p>}
      <button className="primary" onClick={() => openActivity(a.id)}>
        {pick2(l, "Άνοιξε τη δραστηριότητα", "Open activity")}
      </button>
      {onAgain && (
        <button className="soft" style={{ width: "100%", marginTop: 8 }} onClick={onAgain}>
          🔄 {pick2(l, "Άλλη ιδέα", "Another idea")}
        </button>
      )}
    </div>
  )
}

function Loading({ text }: { text: string }) {
  return (
    <div className="loading" role="status">
      <span className="spin">✨</span>
      <div>{text}</div>
    </div>
  )
}

/** Keeps AI-created activities on the device (newest first, at most 50) so they can be reopened. */
function saveAI(list: Activity[]) {
  return (s: AppState): AppState => ({
    ...s,
    aiActivities: [...list, ...s.aiActivities].slice(0, 50),
    aiHistory: [...list.map((a) => a.id), ...s.aiHistory].slice(0, 10),
  })
}

export function PlusAI() {
  const { state, update, profile } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const [age, setAge] = useState<Age>(profile.age)
  const [time, setTime] = useState("15")
  const [place, setPlace] = useState<Place>("home")
  const [type, setType] = useState<ActType | "all">("all")
  const [mats, setMats] = useState("")
  const [result, setResult] = useState<Activity | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const generate = async () => {
    setBusy(true)
    setErr(null)
    try {
      const avoid = state.aiActivities.slice(0, 8).map((a) => a.titleEn)
      const a = await aiActivity({ lang: l, age, time, place, type, materials: mats.trim() || undefined, avoid })
      update(saveAI([a]))
      setResult(a)
    } catch (e) {
      const kind = e instanceof AIError ? e.kind : "failed"
      setErr(aiErrorText(kind, l))
      // Still give the parent something to do right now.
      if (kind !== "refused" && kind !== "busy") setResult(smartPick({ age, time, place, type, exclude: result ? [result.id] : [] }))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PlusHead icon="🤖" title="PlayNest AI" sub={p("Νέες δραστηριότητες, φτιαγμένες για εσάς", "New activities, made for you")} />
      <div className="plusPanel">
        <div className="plusForm">
          <label>
            {p("Ηλικία", "Age")}
            <select value={age} onChange={(e) => setAge(e.target.value as Age)}>
              {AGES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            {p("Χρόνος", "Time")}
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {["5", "15", "30", "60"].map((x) => (
                <option key={x} value={x}>
                  {x} {p("λεπτά", "min")}
                </option>
              ))}
            </select>
          </label>
          <label>
            {p("Πού βρίσκεστε;", "Where are you?")}
            <select value={place} onChange={(e) => setPlace(e.target.value as Place)}>
              <option value="home">🏠 {p("Σπίτι", "Home")}</option>
              <option value="outside">🌳 {p("Έξω", "Outside")}</option>
              <option value="car">🚗 {p("Αυτοκίνητο", "Car")}</option>
              <option value="restaurant">🍽️ {p("Εστιατόριο", "Restaurant")}</option>
            </select>
          </label>
          <label>
            {p("Τι διάθεση θέλεις;", "What kind of activity?")}
            <select value={type} onChange={(e) => setType(e.target.value as ActType | "all")}>
              <option value="all">✨ {p("Οτιδήποτε", "Anything")}</option>
              <option value="creative">🎨 {p("Δημιουργική", "Creative")}</option>
              <option value="learning">🧠 {p("Μάθηση", "Learning")}</option>
              <option value="movement">🏃 {p("Κίνηση", "Active")}</option>
              <option value="calm">😌 {p("Ήρεμη", "Calm")}</option>
            </select>
          </label>
          <label>
            {p("Τι έχεις διαθέσιμο; (προαιρετικά)", "What do you have? (optional)")}
            <textarea
              value={mats}
              maxLength={300}
              onChange={(e) => setMats(e.target.value)}
              placeholder={p("π.χ. ένα χαρτόκουτο, μαρκαδόροι και μανταλάκια", "e.g. a cardboard box, markers and clothes pegs")}
            />
          </label>
          <button className="primary" onClick={generate} disabled={busy}>
            ✨ {p("Δημιούργησέ το", "Create it")}
          </button>
        </div>
        {busy && <Loading text={p("Το PlayNest AI σκέφτεται μια ιδέα…", "PlayNest AI is thinking of an idea…")} />}
        {err && !busy && <div className="aiError">{err}</div>}
        {result && !busy && (
          <div ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <ResultCard key={result.id} a={result} onAgain={generate} />
          </div>
        )}
      </div>
      {state.aiActivities.length > 0 && (
        <>
          <SectionTitle>📚 {p("Οι δραστηριότητές σου από το AI", "Your AI activities")}</SectionTitle>
          <div className="recGrid">
            {state.aiActivities.slice(0, 12).map((a) => (
              <RecCard key={a.id} a={a} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

export function PlusSnap() {
  const { state, update, profile } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const [img, setImg] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [seen, setSeen] = useState<string[] | null>(null)
  const [results, setResults] = useState<Activity[]>([])
  const toggle = (k: string) =>
    update((s) => ({
      ...s,
      snapTags: s.snapTags.includes(k) ? s.snapTags.filter((x) => x !== k) : [...s.snapTags, k],
    }))
  const analyse = async () => {
    if (!file) return
    setBusy(true)
    setErr(null)
    setSeen(null)
    try {
      const r = await aiSnap({ lang: l, age: profile.age, image: await photoToJpeg(file) })
      setSeen(r.materials)
      setResults(r.activities)
      if (r.activities.length) update(saveAI(r.activities))
      else setErr(p("Δεν βρήκα κάτι για παιχνίδι στη φωτογραφία. Δοκίμασε άλλη ή διάλεξε υλικά από κάτω.", "I found nothing to play with in the photo. Try another or pick materials below."))
    } catch (e) {
      setErr(aiErrorText(e instanceof AIError ? e.kind : "failed", l, "manual"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PlusHead icon="📸" title="Snap & Play" sub={p("Φωτογραφία → ιδέες παιχνιδιού", "Photo → play ideas")} />
      <div className="plusPanel">
        <p>
          {p(
            "Βγάλε ή διάλεξε φωτογραφία με τα αντικείμενα που έχεις διαθέσιμα. Το PlayNest AI θα τα αναγνωρίσει και θα σου προτείνει παιχνίδια.",
            "Take or choose a photo of the things you have. PlayNest AI will recognise them and suggest games.",
          )}
        </p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          style={{ width: "100%" }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            if (img) URL.revokeObjectURL(img)
            setImg(URL.createObjectURL(f))
            setFile(f)
            setResults([])
            setSeen(null)
          }}
        />
        {img && <img src={img} className="snapPreview" style={{ display: "block" }} alt="" />}
        {file && (
          <button className="primary" style={{ marginTop: 12 }} onClick={analyse} disabled={busy}>
            ✨ {p("Βρες παιχνίδια από τη φωτογραφία", "Find games from the photo")}
          </button>
        )}
        <div className="noticeAI" style={{ marginTop: 10 }}>
          🔒{" "}
          {p(
            "Η φωτογραφία στέλνεται μόνο για την αναγνώριση και δεν αποθηκεύεται. Μη φωτογραφίζεις πρόσωπα.",
            "The photo is sent only for recognition and is not stored. Please don't photograph faces.",
          )}
        </div>
        {busy && <Loading text={p("Κοιτάζω τη φωτογραφία…", "Looking at the photo…")} />}
        {err && !busy && <div className="aiError">{err}</div>}
        {seen && seen.length > 0 && !busy && (
          <p className="small">
            <b>{p("Βλέπω:", "I see:")}</b> {seen.join(", ")}
          </p>
        )}
        {results.map((a) => (
          <ResultCard key={a.id} a={a} />
        ))}
      </div>
      <div className="plusPanel">
        <h3>{p("…ή διάλεξε τα υλικά μόνος σου", "…or pick the materials yourself")}</h3>
        <div className="plusChips">
          {SNAP_ITEMS.map((s) => (
            <button
              key={s.key}
              className={`plusChip ${state.snapTags.includes(s.key) ? "on" : ""}`}
              onClick={() => toggle(s.key)}
            >
              {s.icon} {l === "el" ? s.el : s.en}
            </button>
          ))}
        </div>
        <button className="primary" style={{ marginTop: 14 }} onClick={() => setResults(snapSuggest(state.snapTags))}>
          🔎 {p("Βρες από τη βιβλιοθήκη", "Find in the library")}
        </button>
      </div>
    </>
  )
}

export function PlusProfiles() {
  const { state, update } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [age, setAge] = useState<Age>("3-4")
  const [sib1, setSib1] = useState<Age>(state.profiles[0]?.age ?? "2-3")
  const [sib2, setSib2] = useState<Age>(state.profiles[1]?.age ?? "4-6")
  const [sib, setSib] = useState<Activity | null>(null)

  const add = () => {
    update((s) => ({
      ...s,
      profiles: [...s.profiles, { name: name.trim(), age, interests: [] }],
      active: s.profiles.length,
    }))
    setAdding(false)
    setName("")
  }
  const remove = (i: number) => {
    const who = state.profiles[i].name || p(`Παιδί ${i + 1}`, `Child ${i + 1}`)
    if (!confirm(p(`Διαγραφή του προφίλ «${who}»;`, `Delete the profile “${who}”?`))) return
    update((s) => {
      const profiles = s.profiles.filter((_, j) => j !== i)
      const active = s.active === i ? 0 : s.active > i ? s.active - 1 : s.active
      return { ...s, profiles, active }
    })
  }
  return (
    <>
      <PlusHead icon="👶" title={p("Προφίλ & αδέλφια", "Profiles & siblings")} sub={p("Έως 3 παιδικά προφίλ", "Up to 3 child profiles")} />
      <div className="plusPanel">
        {state.profiles.map((pr, i) => (
          <div key={i} className={`profileRow ${i === state.active ? "active" : ""}`}>
            <div className="profileAvatar">{["🧒", "👧", "👦"][i] ?? "🧒"}</div>
            <div>
              <b>{pr.name || p(`Παιδί ${i + 1}`, `Child ${i + 1}`)}</b>
              <div className="small">
                {pr.age} · {pr.interests.length} {p("ενδιαφέροντα", "interests")}
              </div>
            </div>
            <div className="profileActions">
              {i === state.active ? (
                <button className="soft" onClick={() => go("profile")}>
                  ✏️
                </button>
              ) : (
                <button className="soft" onClick={() => update((s) => ({ ...s, active: i }))}>
                  {p("Επιλογή", "Select")}
                </button>
              )}
              {state.profiles.length > 1 && (
                <button className="soft" aria-label="delete" onClick={() => remove(i)}>
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
        {state.profiles.length < MAX_PROFILES &&
          (adding ? (
            <div className="plusForm" style={{ marginTop: 10 }}>
              <label>
                {p("Όνομα ή ψευδώνυμο", "Name or nickname")}
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />
              </label>
              <label>
                {p("Ηλικία", "Age")}
                <select value={age} onChange={(e) => setAge(e.target.value as Age)}>
                  {AGES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <div className="grid2">
                <button className="secondary" onClick={() => setAdding(false)}>
                  {p("Άκυρο", "Cancel")}
                </button>
                <button className="primary" onClick={add}>
                  {p("Προσθήκη", "Add")}
                </button>
              </div>
            </div>
          ) : (
            <button className="primary" onClick={() => setAdding(true)}>
              ＋ {p("Προσθήκη παιδιού", "Add child")}
            </button>
          ))}
      </div>
      <div className="plusPanel">
        <h3>👫 Sibling Mode</h3>
        <p className="small">
          {p(
            "Βρες δραστηριότητες που μπορούν να κάνουν μαζί δύο παιδιά διαφορετικών ηλικιών.",
            "Find activities two children of different ages can enjoy together.",
          )}
        </p>
        <div className="plusForm">
          <label>
            {p("Ηλικία 1", "Age 1")}
            <select value={sib1} onChange={(e) => setSib1(e.target.value as Age)}>
              {AGES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            {p("Ηλικία 2", "Age 2")}
            <select value={sib2} onChange={(e) => setSib2(e.target.value as Age)}>
              {AGES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button className="primary" onClick={() => setSib(siblingPick(sib1, sib2))}>
            ✨ {p("Βρες κοινή δραστηριότητα", "Find shared activity")}
          </button>
        </div>
        {sib && <ResultCard a={sib} onAgain={() => setSib(siblingPick(sib1, sib2))} />}
      </div>
    </>
  )
}

export function PlusPacks() {
  const { state } = useStore()
  const l = state.lang
  return (
    <>
      <PlusHead
        icon="🧰"
        title="Premium Packs"
        sub={pick2(l, "Έτοιμες συλλογές για κάθε στιγμή", "Ready-made collections for every moment")}
      />
      <div className="packGrid">
        {PACKS.map((pk) => (
          <button key={pk.tag} className="pack" onClick={() => go(`explore?cat=${pk.tag}`)}>
            <span style={{ fontSize: 32 }}>{pk.icon}</span>
            <b>{l === "el" ? pk.el : pk.en}</b>
            <small>
              {activities.filter((a) => a.tags.includes(pk.tag)).length} {pick2(l, "δραστηριότητες", "activities")}
            </small>
          </button>
        ))}
      </div>
    </>
  )
}

const CHALLENGE = activities.filter((a) => a.premium).slice(0, 7)

export function PlusChallenge() {
  const { state, update } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const done = state.challenge.filter(Boolean).length
  const toggle = (i: number) =>
    update((s) => {
      const challenge = [...s.challenge]
      challenge[i] = !challenge[i]
      return { ...s, challenge }
    })
  return (
    <>
      <PlusHead icon="🏆" title="7-Day Challenge" sub={p("7 μέρες • 7 μικρές αποστολές", "7 days • 7 mini missions")} />
      <div className="plusPanel">
        <div className="row between">
          <b>
            {done}/7 {p("ολοκληρώθηκαν", "completed")}
          </b>
          <span>{Math.round((done / 7) * 100)}%</span>
        </div>
        <div className="progressBar" style={{ margin: "10px 0 14px" }}>
          <div className="progressFill" style={{ width: `${(done / 7) * 100}%` }} />
        </div>
        {CHALLENGE.map((a, i) => (
          <div key={a.id} className="challengeDay">
            <div style={{ fontSize: 28 }}>{a.emoji}</div>
            <button className="dayBody" onClick={() => openActivity(a.id)}>
              <b>
                {p("Μέρα", "Day")} {i + 1}: {actText.title(a, l)}
              </b>
              <div className="small">{a.times[0]}'</div>
            </button>
            <button className="iconbtn" aria-label="done" onClick={() => toggle(i)}>
              {state.challenge[i] ? "✅" : "⬜"}
            </button>
          </div>
        ))}
        {done === 7 && <p>🎉 {p("Μπράβο! Ολοκληρώσατε την πρόκληση!", "Well done! You completed the challenge!")}</p>}
        {done > 0 && (
          <button
            className="soft"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => update((s) => ({ ...s, challenge: Array(7).fill(false) }))}
          >
            ↺ {p("Ξεκίνα από την αρχή", "Start over")}
          </button>
        )}
      </div>
    </>
  )
}

export function PlusProgress() {
  const { state } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const completed = state.done.length
  const ch = state.challenge.filter(Boolean).length
  const variety = new Set(
    state.done.map((i) => getActivity(state.week[i])?.types[0]).filter(Boolean),
  ).size
  const loved = Object.values(state.ratings).filter((r) => r === "love").length
  return (
    <>
      <PlusHead icon="📈" title="Advanced Progress" sub={p("Μικρή εικόνα των συνηθειών παιχνιδιού", "A snapshot of play habits")} />
      <div className="miniStatGrid">
        <div className="miniStat">
          <b>{completed}</b>
          <span>{p("ολοκληρωμένες", "completed")}</span>
        </div>
        <div className="miniStat">
          <b>{state.favs.length}</b>
          <span>{p("αγαπημένες", "favorites")}</span>
        </div>
        <div className="miniStat">
          <b>{ch}/7</b>
          <span>challenge</span>
        </div>
        <div className="miniStat">
          <b>{loved}</b>
          <span>{p("του άρεσαν ❤️", "loved ❤️")}</span>
        </div>
      </div>
      <div className="plusPanel">
        <h3>🌈 {p("Ποικιλία εβδομάδας", "Weekly variety")}</h3>
        <div className="progressBar">
          <div className="progressFill" style={{ width: `${Math.min(100, variety * 25)}%` }} />
        </div>
        <p className="small">
          {p(
            "Στόχος: δημιουργική, μαθησιακή, κινητική και ήρεμη δραστηριότητα μέσα στην εβδομάδα.",
            "Goal: creative, learning, active and calm activity during the week.",
          )}{" "}
          ({variety}/4)
        </p>
      </div>
      <div className="plusPanel">
        <h3>🔥 {p("Συνέπεια", "Consistency")}</h3>
        <p>
          {completed + ch >= 5 ? "🔥🔥🔥" : completed + ch >= 2 ? "🔥🔥" : "🔥"}{" "}
          {p("Συνέχισε έτσι! Κάθε μικρή δραστηριότητα μετράει.", "Keep going! Every small activity counts.")}
        </p>
      </div>
    </>
  )
}

const PRINTABLES = activities.filter((a) => a.premium && a.tags.includes("screenfree")).slice(0, 6)

export function PlusPrintables() {
  const { state } = useStore()
  const l = state.lang
  return (
    <>
      <PlusHead
        icon="🖨️"
        title="Printables"
        sub={pick2(l, "Κάρτες δραστηριοτήτων για εκτύπωση", "Activity cards to print")}
      />
      <div className="plusPanel">
        <p className="small">
          {pick2(
            l,
            "Άνοιξε μια κάρτα και πάτησε «🖨️ Εκτύπωση» ή κράτησέ τη ως screenshot.",
            "Open a card and tap “🖨️ Print”, or keep it as a screenshot.",
          )}
        </p>
      </div>
      <div className="recGrid">
        {PRINTABLES.map((a) => (
          <RecCard key={a.id} a={a} sub={`${a.times[0]}' · ${pick2(l, "χωρίς οθόνη", "screen-free")}`} />
        ))}
      </div>
    </>
  )
}
