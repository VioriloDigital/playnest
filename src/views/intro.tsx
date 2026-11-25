import { useEffect, useState } from "react"
import logo from "../logo.png"
import { pick2 } from "../lib/i18n"
import { go } from "../lib/router"
import { useStore } from "../lib/store"
import { AGES, type Age, type Lang } from "../lib/types"

/** Open the tour from anywhere (header button, About, welcome screen). */
const TOUR_EVENT = "playnest:tour"
export const openTour = () => window.dispatchEvent(new Event(TOUR_EVENT))

type Slide = {
  emoji: string
  img: string
  to?: string
  el: { title: string; text: string; points: string[]; cta?: string }
  en: { title: string; text: string; points: string[]; cta?: string }
}

const SLIDES: Slide[] = [
  {
    emoji: "👋",
    img: "home",
    el: {
      title: "Καλώς ήρθατε στο PlayNest",
      text: "Ιδέες παιχνιδιού για παιδιά 1–8 ετών, για κάθε στιγμή της μέρας. Δείτε σε ένα λεπτό τι μπορείτε να κάνετε.",
      points: ["200 δραστηριότητες με υλικά, δεξιότητες και βήματα", "Αστεράκια και αυτοκόλλητα για τα παιδιά", "Χωρίς λογαριασμό: όλα μένουν στη συσκευή σας"],
    },
    en: {
      title: "Welcome to PlayNest",
      text: "Play ideas for children aged 1–8, for every moment of the day. Here's what you can do, in one minute.",
      points: ["200 activities with materials, skills and steps", "Stars and stickers for the children", "No account: everything stays on your device"],
    },
  },
  {
    emoji: "✨",
    img: "home",
    to: "",
    el: {
      title: "Βρες μου κάτι τώρα",
      text: "Η Αρχική σας δίνει ιδέα με ένα πάτημα, ανάλογα με την ηλικία του παιδιού.",
      points: ["«Γρήγορες περιστάσεις»: βρέχει, 10 λεπτά, έχει ενέργεια, πριν τον ύπνο, αυτοκίνητο", "Η δραστηριότητα της ημέρας", "Δημιουργικές, μαθησιακές, κινητικές ή ήρεμες"],
      cta: "Αρχική",
    },
    en: {
      title: "Find me something now",
      text: "Home gives you an idea in one tap, matched to your child's age.",
      points: ["Quick situations: rainy day, 10 minutes, lots of energy, bedtime, in the car", "The activity of the day", "Creative, learning, active or calm"],
      cta: "Home",
    },
  },
  {
    emoji: "🔎",
    img: "explore",
    to: "explore",
    el: {
      title: "Explore: όλες οι δραστηριότητες",
      text: "Ψάξτε σε 200 δραστηριότητες με κατηγορίες, διάρκεια και αναζήτηση.",
      points: ["13 κατηγορίες: STEM, έξω, ταξίδι, βροχερή μέρα, νήπια…", "Αναζήτηση και στα υλικά: γράψτε «χαρτί» ή «κουτί»", "Φίλτρο διάρκειας: 5, 15, 30 ή 60 λεπτά"],
      cta: "Explore",
    },
    en: {
      title: "Explore: every activity",
      text: "Browse 200 activities by category, length and search.",
      points: ["13 categories: STEM, outdoor, travel, rainy day, toddlers…", "Search materials too: type “paper” or “box”", "Filter by length: 5, 15, 30 or 60 minutes"],
      cta: "Explore",
    },
  },
  {
    emoji: "▶️",
    img: "play",
    to: "play/3",
    el: {
      title: "Παίζουμε βήμα-βήμα",
      text: "Σε κάθε δραστηριότητα πατήστε «▶️ Ξεκινάμε!» για οδηγίες σε μεγάλα γράμματα.",
      points: ["Λίστα υλικών για να τα ετοιμάσετε", "Χρονόμετρο και οθόνη που δεν σβήνει", "«✅ Το κάναμε!» με αξιολόγηση και μια μικρή ανάμνηση"],
      cta: "Δοκιμάστε",
    },
    en: {
      title: "Play step by step",
      text: "On any activity tap “▶️ Let's play!” for big, clear instructions.",
      points: ["A materials checklist to get ready", "A timer, and the screen stays on", "“✅ We did it!” with a rating and a little memory"],
      cta: "Try it",
    },
  },
  {
    emoji: "⭐",
    img: "rewards",
    to: "rewards",
    el: {
      title: "Αστεράκια & ανταμοιβές",
      text: "Κάθε δραστηριότητα που ολοκληρώνει το παιδί του δίνει ένα αστεράκι, με γιορτή και κομφετί!",
      points: ["Κάθε 3 αστεράκια, ένα νέο αυτοκόλλητο στο άλμπουμ", "Ορίστε ανταμοιβές: «10 ⭐ = παγωτό»", "Δίπλωμα Μικρού Εξερευνητή για εκτύπωση"],
      cta: "Ανταμοιβές",
    },
    en: {
      title: "Stars & rewards",
      text: "Every activity your child finishes earns a star, with a celebration and confetti!",
      points: ["A new sticker in the album every 3 stars", "Set rewards: “10 ⭐ = ice cream”", "A printable Little Explorer certificate"],
      cta: "Rewards",
    },
  },
  {
    emoji: "🧰",
    img: "tools",
    to: "tools",
    el: {
      title: "Εργαλεία για γονείς",
      text: "Για τις δύσκολες στιγμές: αλλαγές, ρουτίνες, ξεσπάσματα.",
      points: ["⏱️ Χρονόμετρο που «βλέπει» το παιδί", "📋 Τώρα → Μετά: πρωινό και βραδινό με εικόνες", "💗 Τροχός συναισθημάτων και 🧘 ανάσες ηρεμίας"],
      cta: "Εργαλεία",
    },
    en: {
      title: "Parent tools",
      text: "For the tricky moments: transitions, routines, big feelings.",
      points: ["⏱️ A timer children can see", "📋 Now → Next: morning and bedtime in pictures", "💗 Feelings wheel and 🧘 calm breathing"],
      cta: "Tools",
    },
  },
  {
    emoji: "📊",
    img: "progress",
    to: "progress",
    el: {
      title: "Εβδομάδα & πρόοδος",
      text: "Ένα ισορροπημένο πρόγραμμα 7 ημερών και ένα ημερολόγιο με όσα κάνατε μαζί.",
      points: ["Πρόγραμμα εβδομάδας με διαφορετικά είδη παιχνιδιού", "Σερί ημερών, γράφημα και σήματα", "Ημερολόγιο με τις αναμνήσεις σας"],
      cta: "Πρόοδος",
    },
    en: {
      title: "Week & progress",
      text: "A balanced 7-day plan and a journal of what you did together.",
      points: ["A weekly plan with different kinds of play", "Day streaks, a chart and badges", "A journal of your memories"],
      cta: "Progress",
    },
  },
  {
    emoji: "👑",
    img: "plus",
    to: "plus",
    el: {
      title: "PlayNest Plus",
      text: "Έξυπνα εργαλεία, δωρεάν κατά τη δοκιμαστική περίοδο.",
      points: ["PlayNest AI: νέα δραστηριότητα από όσα έχετε στο σπίτι", "Snap & Play: φωτογραφία → ιδέες παιχνιδιού", "Έως 3 παιδιά και κοινές δραστηριότητες για αδέλφια"],
      cta: "Plus",
    },
    en: {
      title: "PlayNest Plus",
      text: "Smart tools, free during the trial period.",
      points: ["PlayNest AI: a new activity from what you have at home", "Snap & Play: photo → play ideas", "Up to 3 children and shared activities for siblings"],
      cta: "Plus",
    },
  },
  {
    emoji: "🔔",
    img: "profile",
    to: "profile",
    el: {
      title: "Προφίλ, υπενθύμιση & απόρρητο",
      text: "Από το ✏️ στην κάρτα του παιδιού αλλάζετε το προφίλ και τις ρυθμίσεις.",
      points: ["Καθημερινή υπενθύμιση με την ιδέα της ημέρας (στο κινητό)", "Ελληνικά ή αγγλικά από το 🌐", "Την ξενάγηση την ξαναβλέπετε από το ❓ πάνω αριστερά"],
      cta: "Προφίλ",
    },
    en: {
      title: "Profile, reminder & privacy",
      text: "Tap ✏️ on your child's card to change the profile and settings.",
      points: ["A daily reminder with the idea of the day (on the phone)", "Greek or English from 🌐", "Watch this tour again from ❓ at the top left"],
      cta: "Profile",
    },
  },
]

export function Tour() {
  const { state } = useStore()
  const l = state.lang
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  useEffect(() => {
    const on = () => {
      setI(0)
      setOpen(true)
    }
    window.addEventListener(TOUR_EVENT, on)
    return () => window.removeEventListener(TOUR_EVENT, on)
  }, [])
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key === "ArrowRight") setI((x) => Math.min(SLIDES.length - 1, x + 1))
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1))
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [open])
  if (!open) return null
  const s = SLIDES[i]
  const t = l === "el" ? s.el : s.en
  const last = i === SLIDES.length - 1
  return (
    <div className="overlay tourOverlay" role="dialog" aria-modal="true" aria-label={pick2(l, "Ξενάγηση", "Tour")}>
      <div className="tourCard">
        <button className="tourClose" aria-label={pick2(l, "Κλείσιμο", "Close")} onClick={() => setOpen(false)}>
          ✕
        </button>
        <div className="tourShot">
          <img src={`tour/${s.img}.webp`} alt="" loading="eager" />
        </div>
        <div className="tourBody">
          <div className="tourStep">
            {i + 1} / {SLIDES.length}
          </div>
          <h2>
            {s.emoji} {t.title}
          </h2>
          <p>{t.text}</p>
          <ul>
            {t.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
          {s.to !== undefined && t.cta && (
            <button
              className="soft tourGo"
              onClick={() => {
                setOpen(false)
                go(s.to!)
              }}
            >
              👉 {pick2(l, "Δείξε μου", "Show me")}: {t.cta}
            </button>
          )}
        </div>
        <div className="tourDots" aria-hidden>
          {SLIDES.map((_, k) => (
            <button key={k} className={k === i ? "on" : ""} onClick={() => setI(k)} tabIndex={-1} />
          ))}
        </div>
        <div className="grid2 tourNav">
          <button className="secondary" onClick={() => setI((x) => x - 1)} disabled={i === 0}>
            ← {pick2(l, "Πίσω", "Back")}
          </button>
          <button className="primary" onClick={() => (last ? setOpen(false) : setI((x) => x + 1))}>
            {last ? pick2(l, "Ξεκινάμε! 🎉", "Let's start! 🎉") : `${pick2(l, "Επόμενο", "Next")} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

const AGE_LABEL: Record<Age, [string, string]> = {
  "1-2": ["1–2 ετών", "1–2 years"],
  "2-3": ["2–3 ετών", "2–3 years"],
  "3-4": ["3–4 ετών", "3–4 years"],
  "4-6": ["4–6 ετών", "4–6 years"],
  "6-8": ["6–8 ετών", "6–8 years"],
}

/** First-launch welcome: what PlayNest is, the child's name and age, then the app or the tour. */
export function Intro() {
  const { state, update, profile } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile.name)
  const [age, setAge] = useState<Age>(profile.age)
  if (state.introSeen) return null

  const finish = (tour: boolean) => {
    update((s) => {
      const profiles = [...s.profiles]
      profiles[s.active] = { ...profiles[s.active], name: name.trim().slice(0, 40), age }
      return { ...s, profiles, introSeen: true }
    })
    go("", true)
    if (tour) window.setTimeout(openTour, 50)
  }
  const setLang = (lang: Lang) => update((s) => ({ ...s, lang }))

  return (
    <div className="intro" role="dialog" aria-modal="true">
      <div className="introInner">
        <div className="introLang">
          <button className={l === "el" ? "on" : ""} onClick={() => setLang("el")}>
            ΕΛ
          </button>
          <button className={l === "en" ? "on" : ""} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
        {step === 0 ? (
          <>
            <img src={logo} alt="PlayNest" className="introLogo" />
            <h1>{p("Τι θα παίξουμε σήμερα;", "What shall we play today?")}</h1>
            <p className="introLead">
              {p(
                "Ιδέες παιχνιδιού για παιδιά 1–8 ετών, για κάθε στιγμή: στο σπίτι, έξω, στο αυτοκίνητο.",
                "Play ideas for children aged 1–8, for every moment: at home, outside, in the car.",
              )}
            </p>
            <div className="introFeatures">
              <div>🎨<span>{p("200 δραστηριότητες", "200 activities")}</span></div>
              <div>⭐<span>{p("Αστεράκια & αυτοκόλλητα", "Stars & stickers")}</span></div>
              <div>🧰<span>{p("Εργαλεία για γονείς", "Parent tools")}</span></div>
              <div>🔒<span>{p("Χωρίς λογαριασμό", "No account")}</span></div>
            </div>
            <button className="primary" onClick={() => setStep(1)}>
              {p("Ας ξεκινήσουμε →", "Let's begin →")}
            </button>
          </>
        ) : (
          <>
            <div className="introBird">🐥</div>
            <h1>{p("Για ποιο παιδί παίζουμε;", "Who are we playing with?")}</h1>
            <p className="introLead">{p("Έτσι οι ιδέες ταιριάζουν στην ηλικία του.", "So the ideas fit their age.")}</p>
            <label className="fields introField">
              {p("Όνομα ή ψευδώνυμο (προαιρετικά)", "Name or nickname (optional)")}
              <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={p("π.χ. Ελένη", "e.g. Alex")} />
            </label>
            <div className="small" style={{ margin: "12px 0 6px", fontWeight: 700 }}>
              {p("Ηλικία", "Age")}
            </div>
            <div className="introAges">
              {AGES.map((a) => (
                <button key={a} className={age === a ? "on" : ""} onClick={() => setAge(a)}>
                  {AGE_LABEL[a][l === "el" ? 0 : 1]}
                </button>
              ))}
            </div>
            <p className="small introPrivacy">
              🔒 {p("Τα στοιχεία μένουν μόνο σε αυτή τη συσκευή.", "This stays only on this device.")}
            </p>
            <button className="primary" onClick={() => finish(true)}>
              {p("Δείτε τι κάνει η εφαρμογή (1 λεπτό)", "See what the app does (1 minute)")}
            </button>
            <button className="secondary" style={{ width: "100%", marginTop: 10 }} onClick={() => finish(false)}>
              {p("Κατευθείαν στην εφαρμογή", "Go straight to the app")}
            </button>
            <button className="linkBtn" onClick={() => setStep(0)}>
              ← {p("Πίσω", "Back")}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
