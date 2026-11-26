# PlayNest Family

Το site που παρουσιάζει τις τρεις εφαρμογές: PlayNest, PlayNest Skills και PlayNest Pro.

- Σελίδα: `family/site/index.html` (στατική, χωρίς build), εικόνες στο `family/site/img/`.
- Live: https://playnest-family.kosbouris.workers.dev

Deploy (Cloudflare Worker `playnest-family`):

```bash
node family/embed.mjs
npx wrangler deploy -c family/wrangler.jsonc
```

Το `embed.mjs` πακετάρει το `site/` στο `family/dist/files.js` και το `worker.js` το σερβίρει από τη μνήμη.
