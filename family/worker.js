// PlayNest Family site: serves the files packed by embed.mjs.
import { FILES } from "./dist/files.js"

const decoded = new Map()
const body = (path) => {
  const [, data, bin] = FILES[path]
  if (!bin) return data
  if (!decoded.has(path)) decoded.set(path, Uint8Array.from(atob(data), (c) => c.charCodeAt(0)))
  return decoded.get(path)
}

export default {
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname
    if (FILES[path + "/index.html"]) return Response.redirect(url.origin + path + "/" + url.search, 301)
    if (path.endsWith("/")) path += "index.html"
    const file = FILES[path] ?? FILES[path + ".html"]
    if (!file) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } })
    const key = FILES[path] ? path : path + ".html"
    return new Response(body(key), {
      headers: {
        "content-type": file[0],
        "cache-control": file[0].startsWith("text/html") ? "public, max-age=300" : "public, max-age=86400",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
    })
  },
}
