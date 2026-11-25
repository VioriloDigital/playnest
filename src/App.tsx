import { useEffect } from "react"
import logo from "./logo.png"
import { t, type TKey } from "./lib/i18n"
import { back, canGoBack, go, useRoute } from "./lib/router"
import { onReminderTap, syncReminders } from "./lib/reminder"
import { useStore } from "./lib/store"
import { PlayMode } from "./views/play"
import { CelebrationOverlay, Diploma, Rewards } from "./views/rewards"
import { Intro, openTour, Tour } from "./views/intro"
import { InstallView } from "./views/install"
import { SeasonView } from "./views/season"
import { PlusGate } from "./views/premium"
import { Breathing, FeelingsWheel, RoutineTool, ToolsHome, VisualTimer } from "./views/tools"
import { ActivityView, Explore, Favorites, Home, Progress, ProfileEdit, Week } from "./views/core"
import {
  PlusAI,
  PlusChallenge,
  PlusHome,
  PlusPacks,
  PlusPrintables,
  PlusProfiles,
  PlusProgress,
  PlusSnap,
} from "./views/plus"

const NAV: [string, string, TKey][] = [
  ["", "🏠", "home"],
  ["week", "📅", "week"],
  ["favorites", "❤️", "favorites"],
  ["progress", "📊", "progress"],
  ["plus", "👑", "plus"],
]

const PLUS_VIEWS: Record<string, () => React.JSX.Element> = {
  ai: PlusAI,
  snap: PlusSnap,
  profiles: PlusProfiles,
  packs: PlusPacks,
  challenge: PlusChallenge,
  progress: PlusProgress,
  printables: PlusPrintables,
}

/** Lock cards for the Plus tools: icon, title el/en, text el/en. */
const PLUS_LOCKS: Record<string, [string, string, string, string, string]> = {
  ai: ["🤖", "PlayNest AI", "PlayNest AI", "Γράψτε τι έχετε στο σπίτι και το AI φτιάχνει μια καινούργια δραστηριότητα, ειδικά για την ηλικία του παιδιού.", "Type what you have at home and the AI creates a brand-new activity for your child's age."],
  snap: ["📸", "Snap & Play", "Snap & Play", "Φωτογραφίστε ό,τι έχετε μπροστά σας και πάρτε 2 ιδέες παιχνιδιού με αυτά.", "Photograph what's in front of you and get 2 play ideas with it."],
  packs: ["🧰", "Premium Packs", "Premium Packs", "Έτοιμες συλλογές για ταξίδι, βροχή, STEM, οικογένεια και άλλα.", "Ready-made collections for travel, rainy days, STEM, family and more."],
  challenge: ["🏆", "7-Day Challenge", "7-Day Challenge", "Μία μικρή αποστολή κάθε μέρα για μια εβδομάδα γεμάτη παιχνίδι.", "One small mission a day for a week full of play."],
  progress: ["📈", "Advanced Progress", "Advanced Progress", "Συνήθειες παιχνιδιού, ποικιλία και πρόοδος με μια ματιά.", "Play habits, variety and progress at a glance."],
  printables: ["🖨️", "Printables", "Printables", "Κάρτες δραστηριοτήτων για εκτύπωση και παιχνίδι μακριά από την οθόνη.", "Printable activity cards for screen-free play."],
}

export default function App() {
  const { state, update, toastMsg } = useStore()
  const { path, query } = useRoute()
  const l = state.lang
  const [root = "", sub] = path

  // Keep the rolling two-week reminder window filled, and open the activity a reminder names.
  useEffect(() => {
    syncReminders(state.reminder, state.lang).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lang])
  useEffect(() => {
    let off: (() => void) | undefined
    onReminderTap((id) => go(`activity/${id}`)).then((f) => (off = f))
    return () => off?.()
  }, [])

  let view: React.JSX.Element
  switch (root) {
    case "":
      view = <Home />
      break
    case "week":
      view = <Week />
      break
    case "favorites":
      view = <Favorites />
      break
    case "progress":
      view = <Progress />
      break
    case "profile":
      view = <ProfileEdit key={state.active} />
      break
    case "activity":
      view = <ActivityView id={Number(sub)} />
      break
    case "season":
      view = <SeasonView key={sub ?? "all"} themeKey={sub} />
      break
    case "install":
      view = <InstallView />
      break
    case "tools":
      view =
        sub === "timer" ? <VisualTimer /> : sub === "routine" ? <RoutineTool /> : sub === "emotions" ? <FeelingsWheel /> : sub === "breath" ? <Breathing /> : <ToolsHome />
      break
    case "rewards":
      view = <Rewards />
      break
    case "diploma":
      view = <Diploma />
      break
    case "play":
      view = <PlayMode key={sub} id={Number(sub)} />
      break
    case "explore":
      view = <Explore initialCat={query.get("cat") ?? "all"} />
      break
    case "plus": {
      const V = sub ? PLUS_VIEWS[sub] : PlusHome
      const lock = sub && sub !== "profiles" ? PLUS_LOCKS[sub] : undefined
      view = !V ? (
        <PlusHome />
      ) : lock ? (
        <PlusGate icon={lock[0]} title={l === "el" ? lock[1] : lock[2]} text={l === "el" ? lock[3] : lock[4]}>
          <V />
        </PlusGate>
      ) : (
        <V />
      )
      break
    }
    default:
      view = <Home />
  }

  const navActive = ["activity", "explore", "profile", "play", "rewards", "diploma", "tools", "install", "season"].includes(root) ? null : root
  const goTab = (to: string) => {
    if (to === root && !sub) return
    // Tabs replace the current entry when nothing is behind it, so Android back leaves the app from a tab.
    go(to, !canGoBack())
  }

  return (
    <div className="app">
      <header className={`noprint ${root === "play" ? "hidden" : ""}`}>
        <button className="logo" onClick={() => goTab("")} aria-label="PlayNest">
          <img src={logo} alt="PlayNest" width={120} height={120} />
        </button>
        <button className="helpBtn" onClick={openTour} aria-label={l === "el" ? "Ξενάγηση" : "Tour"} title={l === "el" ? "Ξενάγηση" : "Tour"}>
          ❓
        </button>
        <button
          className="lang"
          onClick={() => update((s) => ({ ...s, lang: s.lang === "el" ? "en" : "el" }))}
          aria-label="Language"
        >
          🌐 {l === "el" ? "ΕΛ" : "EN"}
        </button>
        <p>{t(l, "tagline")}</p>
      </header>
      <main key={path.join("/")}>{view}</main>
      <nav className="noprint">
        {NAV.map(([to, icon, key]) => (
          <button
            key={key}
            className={navActive === to ? "active" : ""}
            aria-current={navActive === to ? "page" : undefined}
            onClick={() => goTab(to)}
          >
            <span className="navIcon" aria-hidden>
              {icon}
            </span>
            <span className="navLabel">{t(l, key)}</span>
          </button>
        ))}
      </nav>
      {toastMsg && (
        <div className="toast" role="status" style={{ display: "block" }}>
          {toastMsg}
        </div>
      )}
      <CelebrationOverlay />
      <Tour />
      <Intro />
      <BackHandler />
    </div>
  )
}

/** Android hardware back button: go back inside the app, or exit from the first screen. */
function BackHandler() {
  useEffect(() => {
    let remove: (() => void) | undefined
    let cancelled = false
    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return
      const { App: CapApp } = await import("@capacitor/app")
      const h = await CapApp.addListener("backButton", () => {
        if (canGoBack()) back()
        else if (window.location.hash.replace(/^#\/?/, "") !== "") go("", true)
        else CapApp.exitApp()
      })
      if (cancelled) h.remove()
      else remove = () => h.remove()
    })
    return () => {
      cancelled = true
      remove?.()
    }
  }, [])
  return null
}
