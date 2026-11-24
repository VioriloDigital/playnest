# PlayNest 2.0

Ιδέες παιχνιδιού για παιδιά 1–8 ετών: 200 αναλυτικές δραστηριότητες (υλικά, δεξιότητες, βήματα) σε ελληνικά και αγγλικά, ανάλογα με την ηλικία, τον χρόνο και τον χώρο.

Ένας κώδικας για **web**, **Android** και **iOS**: Vite + React + TypeScript, με Capacitor για τις εφαρμογές κινητού και Cloudflare Workers για το web.

## Λειτουργίες
- **Αρχική:** «Βρες μου κάτι τώρα», γρήγορες περιστάσεις (βροχή, 10 λεπτά, αυτοκίνητο…), δραστηριότητα της ημέρας, προφίλ παιδιού.
- **Explore:** όλες οι 200 δραστηριότητες με 13 κατηγορίες και αναζήτηση (χωρίς τόνους, ελληνικά/αγγλικά).
- **Δραστηριότητα:** αγαπημένο, αξιολόγηση (❤️ 😐 👎), κοινοποίηση και εκτύπωση.
- **Εβδομάδα:** ισορροπημένο πρόγραμμα 7 ημερών χωρίς επαναλήψεις, αλλαγή ημέρας, σημείωση ολοκλήρωσης.
- **Πρόοδος:** μετρητές και σήματα που ξεκλειδώνονται.
- **Plus (preview, χωρίς χρεώσεις):** PlayNest AI, Snap & Play, έως 3 προφίλ και Sibling Mode, Premium Packs, 7-Day Challenge, Advanced Progress, Printables.

Τα δεδομένα μένουν μόνο στη συσκευή (`localStorage`, κλειδί `playnest_state_v3`). Τα δεδομένα της V1 (`pn_*`, `playnest_plus_v2`) μεταφέρονται αυτόματα στο πρώτο άνοιγμα στον ίδιο browser.

Δεν υπάρχουν ακόμη λογαριασμοί, πραγματικό AI/αναγνώριση εικόνας ή συνδρομές.

## Ανάπτυξη
```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm build          # έλεγχος τύπων + build στο dist/
pnpm deploy:web     # Cloudflare Workers (static assets) → https://playnest.kosbouris.workers.dev
pnpm cap:sync       # build + αντιγραφή στο android/ και ios/
pnpm android:apk    # debug APK (χρειάζεται Android SDK, JDK 21)
```

## Δομή
- `src/data/activities.json`: οι 200 δραστηριότητες
- `src/lib/`: τύποι, μεταφράσεις, επιλογή δραστηριοτήτων, αποθήκευση/μεταφορά δεδομένων, routing (`#/…`)
- `src/views/`: οθόνες (`core.tsx`, `plus.tsx`)
- `android/`, `ios/`: projects του Capacitor (`gr.playnest.app`)

## CI
- `.github/workflows/android.yml`: debug APK σε κάθε push στο `main` (artifact `PlayNest-APK`)
- `.github/workflows/ios.yml`: build για iOS Simulator
- `.github/workflows/deploy-web.yml`: χειροκίνητο deploy στο Cloudflare (secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

## Deploy χωρίς static-assets upload
Αν το upload των assets του Wrangler αποτύχει (π.χ. πίσω από proxy που αλλάζει το `Authorization`), το `scripts/embed-worker.mjs` βάζει όλο το `dist/` μέσα σε ένα Worker:
```bash
pnpm build && node scripts/embed-worker.mjs && wrangler deploy -c wrangler.embedded.jsonc
```
