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
import { back, go } from "../lib/router"
import { useStore } from "../lib/store"
import { AGES, INTERESTS, type ActType, type Activity, type Age, type Interest, type Rating } from "../lib/types"

export function ProfileCard() {
  const { state, profile } = useStore()
  const l = state.lang
  return (
    <div className="card2 row">
      <div className="avatar">{["🧒", "👧", "👦"][state.active] ?? "🧒"}</div>
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
  const rate = (r: Rating) => {
    update((s) => ({ ...s, ratings: { ...s.ratings, [a.id]: r } }))
    toast(t(l, "saved"))
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
        <button className="secondary" onClick={toggleFav}>
          {fav ? "❤️" : "🤍"} {t(l, "fav")}
        </button>
        <button
          className="primary"
          onClick={() => go(`activity/${pickActivity({ age: profile.age, exclude: [a.id] }).id}`, true)}
        >
          🔄 {t(l, "another")}
        </button>
      </div>
      <div className="grid2 noprint" style={{ marginTop: 10 }}>
        <button className="secondary" onClick={share}>
          {t(l, "share")}
        </button>
        <button className="secondary" onClick={() => window.print()}>
          {t(l, "print")}
        </button>
      </div>
      <div className="card2 noprint">
        <h2>{t(l, "liked")}</h2>
        <div className="rating">
          {RATINGS.map(([r, icon]) => (
            <button
              key={r}
              className={`soft ${rating === r ? "sel" : ""}`}
              aria-pressed={rating === r}
              onClick={() => rate(r)}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export function Week() {
  const { state, update, profile, toast } = useStore()
  const l = state.lang
  const generate = () => {
    update((s) => ({ ...s, week: buildWeek(profile.age), done: [] }))
    toast(t(l, "weekReady"))
  }
  const swap = (i: number) =>
    update((s) => {
      const week = [...s.week]
      week[i] = pickActivity({ age: profile.age, exclude: s.week }).id
      return { ...s, week, done: s.done.filter((x) => x !== i) }
    })
  const mark = (i: number) =>
    update((s) => ({ ...s, done: s.done.includes(i) ? s.done.filter((x) => x !== i) : [...s.done, i] }))
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

export function Progress() {
  const { state } = useStore()
  const l = state.lang
  const doneActs = state.done.map((i) => getActivity(state.week[i])).filter((a): a is Activity => !!a)
  const c = doneActs.length
  const cr = doneActs.filter((a) => a.types.includes("creative")).length
  const mv = doneActs.filter((a) => a.types.includes("movement")).length
  const outdoor = doneActs.filter((a) => a.places.includes("outside")).length
  const badges = [
    { on: c >= 1, text: pick2(l, "🌟 Μικρός εξερευνητής", "🌟 Little Explorer") },
    { on: cr >= 2, text: pick2(l, "🎨 Δημιουργική εβδομάδα", "🎨 Creative Week") },
    { on: outdoor >= 1, text: pick2(l, "🌳 Ήρωας της φύσης", "🌳 Outdoor Hero") },
    { on: c >= 7, text: pick2(l, "🏅 Πλήρης εβδομάδα", "🏅 Full Week") },
  ]
  return (
    <>
      <SectionTitle>📊 {t(l, "progress")}</SectionTitle>
      <div className="stats">
        <div className="stat">
          <b>{c}</b>
          <span className="small">{t(l, "done")}</span>
        </div>
        <div className="stat">
          <b>{cr}</b>
          <span className="small">{t(l, "creative")}</span>
        </div>
        <div className="stat">
          <b>{mv}</b>
          <span className="small">{t(l, "movement")}</span>
        </div>
        <div className="stat">
          <b>{c}</b>
          <span className="small">{t(l, "screen")}</span>
        </div>
      </div>
      <div className="card2">
        <h2>{t(l, "badges")}</h2>
        <div className="chips">
          {badges.map((b) => (
            <span key={b.text} className={`chip ${b.on ? "sel" : "locked"}`}>
              {b.text}
            </span>
          ))}
        </div>
        {c === 0 && (
          <p className="small">
            {pick2(
              l,
              "Φτιάξε εβδομαδιαίο πρόγραμμα και σημείωσε ✅ όσες δραστηριότητες κάνετε.",
              "Create a weekly plan and tick ✅ the activities you do.",
            )}
          </p>
        )}
      </div>
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
      profiles[s.active] = { name: name.trim(), age, interests: ints }
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
    </>
  )
}

export function Explore({ initialCat }: { initialCat: string }) {
  const { state } = useStore()
  const l = state.lang
  const [cat, setCat] = useState(CATEGORIES.some((c) => c[0] === initialCat) ? initialCat : "all")
  const [q, setQ] = useState("")
  const list = useMemo(() => {
    const nq = norm(q.trim())
    return activities.filter(
      (a) =>
        (cat === "all" || a.tags.includes(cat)) &&
        (!nq || norm(`${a.titleEl} ${a.titleEn} ${actText.desc(a, l)}`).includes(nq)),
    )
  }, [cat, q, l])
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
        placeholder={t(l, "search")}
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
