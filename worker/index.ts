import Anthropic from "@anthropic-ai/sdk"
import { FILES } from "../dist-worker/files.js"
import { AIRefusal, createActivity, snapAndPlay, type ActivityRequest, type SnapRequest } from "./ai"

interface Env {
  ANTHROPIC_API_KEY?: string
  AI_USAGE: KVNamespace
  AI_DAILY_PER_DEVICE?: string
  AI_DAILY_TOTAL?: string
}

const ALLOWED_ORIGINS = ["https://localhost", "capacitor://localhost", "http://localhost:5173"]

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? ""
  return ALLOWED_ORIGINS.includes(origin)
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type, x-playnest-device",
        "access-control-max-age": "86400",
        vary: "origin",
      }
    : {}
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors(req) },
  })
}

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback

/**
 * Daily quota: per device (and per IP, so a script can't mint device ids) plus a global
 * ceiling that bounds the total API spend per day. Counts attempts, not successes.
 */
async function takeQuota(req: Request, env: Env): Promise<{ ok: true } | { ok: false; scope: string }> {
  const day = new Date().toISOString().slice(0, 10)
  const perDevice = Number(env.AI_DAILY_PER_DEVICE ?? 10)
  const total = Number(env.AI_DAILY_TOTAL ?? 300)
  const device = (req.headers.get("x-playnest-device") ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 40)
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown"
  const keys: [string, number, string][] = [
    [`all:${day}`, total, "total"],
    [`ip:${ip}:${day}`, perDevice * 3, "device"],
  ]
  if (device) keys.push([`dev:${device}:${day}`, perDevice, "device"])
  const counts = await Promise.all(keys.map(([k]) => env.AI_USAGE.get(k)))
  for (let i = 0; i < keys.length; i++) {
    if (Number(counts[i] ?? 0) >= keys[i][1]) return { ok: false, scope: keys[i][2] }
  }
  await Promise.all(
    keys.map(([k], i) => env.AI_USAGE.put(k, String(Number(counts[i] ?? 0) + 1), { expirationTtl: 172800 })),
  )
  return { ok: true }
}

async function handleAI(req: Request, env: Env, kind: string): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) return json(req, { error: "not_configured" }, 503)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(req, { error: "bad_request" }, 400)
  }
  const lang = pick(body.lang, ["el", "en"] as const, "el")
  const age = pick(body.age, ["1-2", "2-3", "3-4", "4-6", "6-8"] as const, "3-4")

  let run: (c: Anthropic) => Promise<unknown>
  if (kind === "activity") {
    const r: ActivityRequest = {
      lang,
      age,
      time: pick(body.time, ["5", "15", "30", "60"] as const, "15"),
      place: pick(body.place, ["home", "outside", "car", "restaurant"] as const, "home"),
      type: pick(body.type, ["all", "creative", "learning", "movement", "calm"] as const, "all"),
      materials: typeof body.materials === "string" ? body.materials.slice(0, 300) : undefined,
      avoid: Array.isArray(body.avoid) ? body.avoid.filter((x) => typeof x === "string").slice(0, 10) : undefined,
    }
    run = (c) => createActivity(c, r)
  } else if (kind === "snap") {
    if (typeof body.image !== "string" || body.image.length > 2_000_000) return json(req, { error: "bad_image" }, 400)
    const r: SnapRequest = {
      lang,
      age,
      image: body.image,
      mediaType: pick(body.mediaType, ["image/jpeg", "image/png", "image/webp"] as const, "image/jpeg"),
    }
    run = (c) => snapAndPlay(c, r)
  } else {
    return json(req, { error: "not_found" }, 404)
  }

  const quota = await takeQuota(req, env)
  if (!quota.ok) return json(req, { error: "limit", scope: quota.scope }, 429)

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 })
  try {
    return json(req, await run(client))
  } catch (e) {
    if (e instanceof AIRefusal) return json(req, { error: "refused" }, 422)
    if (e instanceof Anthropic.RateLimitError) return json(req, { error: "busy" }, 503)
    if (e instanceof Anthropic.APIError) {
      console.error("Anthropic API error", e.status, e.message)
      return json(req, { error: "upstream" }, 502)
    }
    console.error("AI failure", e)
    return json(req, { error: "failed" }, 500)
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname.startsWith("/api/")) {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) })
      if (req.method !== "POST") return json(req, { error: "method" }, 405)
      const m = url.pathname.match(/^\/api\/ai\/([a-z]+)$/)
      return m ? handleAI(req, env, m[1]) : json(req, { error: "not_found" }, 404)
    }

    let path = url.pathname
    if (!FILES[path]) path = "/index.html"
    const [type, data, binary] = FILES[path]
    const body = binary ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0)) : data
    const cache = path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache"
    return new Response(body, {
      headers: {
        "content-type": type,
        "cache-control": cache,
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
    })
  },
} satisfies ExportedHandler<Env>
