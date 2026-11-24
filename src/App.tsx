import { useEffect } from "react"
import { t, type TKey } from "./lib/i18n"
import { back, canGoBack, go, useRoute } from "./lib/router"
import { useStore } from "./lib/store"
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

export default function App() {
  const { state, update, toastMsg } = useStore()
  const { path, query } = useRoute()
  const l = state.lang
  const [root = "", sub] = path

  useEffect(() => {
    document.title = "PlayNest"
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
    case "explore":
      view = <Explore initialCat={query.get("cat") ?? "all"} />
      break
    case "plus": {
      const V = sub ? PLUS_VIEWS[sub] : PlusHome
      view = V ? <V /> : <PlusHome />
      break
    }
    default:
      view = <Home />
  }

  const navActive = root === "activity" || root === "explore" || root === "profile" ? null : root
  const goTab = (to: string) => {
    if (to === root && !sub) return
    // Tabs replace the current entry when nothing is behind it, so Android back leaves the app from a tab.
    go(to, !canGoBack())
  }

  return (
    <div className="app">
      <header className="noprint">
        <button className="logo" onClick={() => goTab("")} aria-label="PlayNest">
          Play<span>Nest</span>
          <span className="bird">🐦</span>
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
          <button key={key} className={navActive === to ? "active" : ""} onClick={() => goTab(to)}>
            {icon}
            <span>{t(l, key)}</span>
          </button>
        ))}
      </nav>
      {toastMsg && (
        <div className="toast" role="status" style={{ display: "block" }}>
          {toastMsg}
        </div>
      )}
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
