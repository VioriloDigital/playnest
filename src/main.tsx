import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Capacitor } from "@capacitor/core"
import App from "./App"
import { StoreProvider } from "./lib/store"
import "./styles.css"
import "./extra.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)

// Offline support on the web (the mobile apps already ship their files).
if (import.meta.env.PROD && "serviceWorker" in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {})
  })
}
