import { useEffect, useState } from "react"

export interface Route {
  path: string[]
  query: URLSearchParams
}

function parse(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "")
  const [p, q = ""] = hash.split("?")
  return { path: p.split("/").filter(Boolean), query: new URLSearchParams(q) }
}

/** How many in-app screens sit behind the current one (stored in history.state). */
function depth(): number {
  const d = (history.state as { d?: number } | null)?.d
  return typeof d === "number" ? d : 0
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return route
}

export function go(to: string, replace = false): void {
  const target = "#/" + to.replace(/^\//, "")
  if (target === window.location.hash || (target === "#/" && !window.location.hash)) return
  if (replace) history.replaceState({ d: depth() }, "", target)
  else history.pushState({ d: depth() + 1 }, "", target)
  window.dispatchEvent(new HashChangeEvent("hashchange"))
}

/** True when there is an in-app screen to go back to. */
export function canGoBack(): boolean {
  return depth() > 0
}

export function back(fallback = ""): void {
  if (depth() > 0) history.back()
  else go(fallback, true)
}
