// Builds a self-contained Worker (dist-worker/worker.js) that serves dist/ from memory.
// Fallback for deploying without Workers static-assets upload (see README).
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs"
import { join, relative, extname } from "node:path"

const root = "dist"
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json", ".json": "application/json",
}
const files = {}
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f)
  if (statSync(p).isDirectory()) return walk(p)
  const ext = extname(p)
  if (!types[ext]) throw new Error(`No content type for ${p}`)
  files["/" + relative(root, p).replaceAll("\\", "/")] = [types[ext], readFileSync(p, "utf8")]
})
walk(root)

const code = `const FILES = ${JSON.stringify(files)};
export default {
  fetch(req) {
    let path = new URL(req.url).pathname;
    if (path === "/" || !FILES[path]) path = FILES[path] ? path : "/index.html";
    const [type, body] = FILES[path];
    const cache = path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache";
    return new Response(body, { headers: { "content-type": type, "cache-control": cache } });
  },
};
`
mkdirSync("dist-worker", { recursive: true })
writeFileSync("dist-worker/worker.js", code)
console.log(`Embedded ${Object.keys(files).length} files, ${(code.length / 1024).toFixed(0)} KB`)
