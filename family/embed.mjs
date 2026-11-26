// Packs family/site/ into family/dist/files.js; worker.js serves it from memory.
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs"
import { join, relative, extname, dirname } from "node:path"
import { fileURLToPath } from "node:url"
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "site")
const types = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" }
const files = {}
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f)
  if (statSync(p).isDirectory()) return walk(p)
  const t = types[extname(p)]
  if (!t) throw new Error(`No content type for ${p}`)
  const bin = t.startsWith("image/") && !t.includes("svg")
  files["/" + relative(root, p).replaceAll("\\", "/")] = [t, readFileSync(p).toString(bin ? "base64" : "utf8"), bin]
})
walk(root)
mkdirSync(join(here, "dist"), { recursive: true })
writeFileSync(join(here, "dist/files.js"), `export const FILES = ${JSON.stringify(files)};\n`)
console.log(`Embedded ${Object.keys(files).length} files`)
