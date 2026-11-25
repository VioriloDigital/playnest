import { Capacitor } from "@capacitor/core"
import { useEffect, useState } from "react"
import { SectionTitle } from "../components"
import { pick2 } from "../lib/i18n"
import { back, go } from "../lib/router"
import { useStore } from "../lib/store"

/* "Install as an app" for the web version (PWA). The mobile apps never show any of this. */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())

/** Call once at startup: Chrome/Edge/Android fire this before we can offer installation. */
export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    notify()
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    notify()
  })
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

const ua = navigator.userAgent
const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
const isAndroid = /Android/.test(ua)

/** Whether there's anything to offer: web only, not already installed. */
export function canOfferInstall(): boolean {
  return !Capacitor.isNativePlatform() && !isStandalone()
}

function useDeferred() {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])
  return deferred
}

/** Opens the browser's install dialog, or the instructions page when the browser has none. */
export async function installApp(): Promise<void> {
  if (deferred) {
    const e = deferred
    deferred = null
    notify()
    await e.prompt()
    await e.userChoice.catch(() => undefined)
  } else {
    go("install")
  }
}

const DISMISS_KEY = "playnest_install_dismissed"

/** Small dismissible banner on Home (web, not installed). */
export function InstallBanner() {
  const { state } = useStore()
  const l = state.lang
  useDeferred()
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      return false
    }
  })
  if (hidden || !canOfferInstall()) return null
  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="card2 installBanner">
      <div className="ibIcon">📲</div>
      <div style={{ flex: 1 }}>
        <b>{pick2(l, "Βάλε το PlayNest στην αρχική οθόνη", "Add PlayNest to your home screen")}</b>
        <div className="small">{pick2(l, "Ανοίγει σαν εφαρμογή, και χωρίς internet.", "Opens like an app, even offline.")}</div>
      </div>
      <button className="primary small-btn" onClick={() => installApp()}>
        {pick2(l, "Εγκατάσταση", "Install")}
      </button>
      <button className="ibClose" aria-label={pick2(l, "Κλείσιμο", "Close")} onClick={dismiss}>
        ✕
      </button>
    </div>
  )
}

export function InstallView() {
  const { state } = useStore()
  const l = state.lang
  const p = (a: string, b: string) => pick2(l, a, b)
  const prompt = useDeferred()
  const native = Capacitor.isNativePlatform()
  const installed = isStandalone()

  return (
    <>
      <button className="back noprint" onClick={() => back()}>
        ← {p("Πίσω", "Back")}
      </button>
      <SectionTitle>📲 {p("Εγκατάσταση ως εφαρμογή", "Install as an app")}</SectionTitle>
      {native || installed ? (
        <div className="card2">
          <p>✅ {p("Το PlayNest είναι ήδη εγκατεστημένο σε αυτή τη συσκευή.", "PlayNest is already installed on this device.")}</p>
          <button className="primary" onClick={() => go("", true)}>
            {p("Στην αρχική", "Go home")}
          </button>
        </div>
      ) : (
        <>
          <div className="card2">
            <p style={{ marginTop: 0 }}>
              {p(
                "Το PlayNest μπαίνει στην αρχική οθόνη σαν κανονική εφαρμογή: ανοίγει με ένα πάτημα, σε πλήρη οθόνη, και δουλεύει και χωρίς internet.",
                "PlayNest goes on your home screen like a regular app: it opens in one tap, full screen, and works offline too.",
              )}
            </p>
            {prompt && (
              <button className="primary" onClick={() => installApp()}>
                📲 {p("Εγκατάσταση τώρα", "Install now")}
              </button>
            )}
          </div>

          <div className={`card2 installSteps ${isIOS ? "here" : ""}`}>
            <h3>🍏 iPhone & iPad (Safari)</h3>
            <ol>
              <li>{p("Ανοίξτε το PlayNest στο Safari.", "Open PlayNest in Safari.")}</li>
              <li>
                {p("Πατήστε «Κοινοποίηση»", "Tap “Share”")} <span className="kbd">⬆️</span>{" "}
                {p("κάτω στη μέση.", "at the bottom.")}
              </li>
              <li>{p("Επιλέξτε «Προσθήκη στην οθόνη Αφετηρίας».", "Choose “Add to Home Screen”.")}</li>
              <li>{p("Πατήστε «Προσθήκη».", "Tap “Add”.")}</li>
            </ol>
          </div>
          <div className={`card2 installSteps ${isAndroid ? "here" : ""}`}>
            <h3>🤖 Android (Chrome)</h3>
            <ol>
              <li>{p("Πατήστε το μενού ⋮ πάνω δεξιά.", "Tap the ⋮ menu at the top right.")}</li>
              <li>{p("Επιλέξτε «Εγκατάσταση εφαρμογής» ή «Προσθήκη στην αρχική οθόνη».", "Choose “Install app” or “Add to Home screen”.")}</li>
            </ol>
            <p className="small">
              {p("Ή κατεβάστε την εφαρμογή Android:", "Or download the Android app:")}{" "}
              <a href="https://github.com/VioriloDigital/playnest/releases/latest/download/PlayNest.apk">PlayNest.apk</a>
            </p>
          </div>
          <div className={`card2 installSteps ${!isIOS && !isAndroid ? "here" : ""}`}>
            <h3>💻 {p("Υπολογιστής (Chrome, Edge)", "Computer (Chrome, Edge)")}</h3>
            <ol>
              <li>{p("Πατήστε το εικονίδιο εγκατάστασης ⊕ στη γραμμή διευθύνσεων, δεξιά.", "Click the install icon ⊕ at the right of the address bar.")}</li>
              <li>{p("Επιλέξτε «Εγκατάσταση».", "Choose “Install”.")}</li>
            </ol>
          </div>
        </>
      )}
    </>
  )
}
