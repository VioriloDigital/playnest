# PlayNest στο Google Play

Όλα όσα χρειάζονται για την πρώτη δημοσίευση του `gr.playnest.app` από τον εταιρικό λογαριασμό της Viorilo Digital.

## 1. Το αρχείο που ανεβαίνει (AAB)

1. GitHub → **Actions** → **Build PlayNest for Google Play** → **Run workflow** (branch `main`).
2. Μόλις τελειώσει (~3 λεπτά), κατέβασε το artifact **PlayNest-Play-Store-AAB** και αποσυμπίεσέ το: μέσα είναι το `app-release.aab`.

Το bundle υπογράφεται με το κλειδί PlayNest (secrets `PLAYNEST_KEYSTORE_BASE64`, `PLAYNEST_KEYSTORE_PASSWORD`), που στο Play Console λειτουργεί ως **upload key**. Το Google Play κρατά δικό του κλειδί για την τελική υπογραφή (Play App Signing).

> Το APK του δημόσιου συνδέσμου και η έκδοση του Play Store έχουν διαφορετική υπογραφή, οπότε δεν ενημερώνει το ένα το άλλο. Όποιος έχει το APK, για να περάσει στο Play Store κάνει μία φορά απεγκατάσταση.

## 2. Δημιουργία εφαρμογής στο Play Console

**Create app** →
- App name: **PlayNest – Ιδέες παιχνιδιού**
- Default language: **Ελληνικά – el-GR**
- App or game: **App**
- Free or paid: **Free**
- Αποδοχή των δηλώσεων (Developer Program Policies, US export laws).

## 3. Store listing (Main store listing)

**Όνομα (≤30):** `PlayNest – Ιδέες παιχνιδιού`

**Σύντομη περιγραφή (≤80):**
`Ιδέες παιχνιδιού για παιδιά 1–8 ετών, για κάθε στιγμή της μέρας.`

**Πλήρης περιγραφή:**

```
Τι θα κάνουμε σήμερα; Το PlayNest δίνει στους γονείς έτοιμες, απλές ιδέες παιχνιδιού για παιδιά 1–8 ετών, ανάλογα με την ηλικία, τον χρόνο και τον χώρο που έχετε.

🌟 200 αναλυτικές δραστηριότητες
50 δωρεάν και 150 ακόμη με το PlayNest Plus. Κάθε δραστηριότητα έχει υλικά, δεξιότητες που αναπτύσσει και βήματα. Δημιουργικές, μαθησιακές, κινητικές και ήρεμες, για το σπίτι, έξω, το αυτοκίνητο ή το εστιατόριο.

⚡ Γρήγορες λύσεις
Βρέχει; Έχετε 10 λεπτά; Το παιδί έχει ενέργεια ή είναι ώρα για ύπνο; Ένα πάτημα και έχετε ιδέα.

▶️ Βήμα-βήμα με χρονόμετρο
Μεγάλα γράμματα, λίστα υλικών και χρονόμετρο, για να παίζετε χωρίς να κοιτάτε συνέχεια την οθόνη.

📔 Ημερολόγιο παιχνιδιού
Σημειώστε «Το κάναμε!», κρατήστε μια μικρή ανάμνηση, δείτε το σερί των ημερών και κερδίστε σήματα.

📅 Εβδομαδιαίο πρόγραμμα
Ένα ισορροπημένο πρόγραμμα 7 ημερών με διαφορετικά είδη παιχνιδιού.

👑 PlayNest Plus: AI και Snap & Play
Με το Plus, πείτε τι έχετε στο σπίτι ή βγάλτε μια φωτογραφία με αντικείμενα του σπιτιού, και το PlayNest AI φτιάχνει μια νέα δραστηριότητα για εσάς. Το Plus περιλαμβάνει επίσης και τις 200 δραστηριότητες, έως 3 παιδιά, packs και printables.

🔔 Καθημερινή υπενθύμιση
Η ιδέα της ημέρας, την ώρα που σας βολεύει.

👶 Έως 3 προφίλ παιδιών και Sibling Mode για δραστηριότητες που κάνουν μαζί αδέλφια διαφορετικών ηλικιών.

🔒 Χωρίς λογαριασμό, χωρίς διαφημίσεις. Τα δεδομένα σας μένουν στη συσκευή σας.

Το PlayNest απευθύνεται σε γονείς και κηδεμόνες. Όλες οι δραστηριότητες γίνονται με την επίβλεψη ενήλικα.
```

**Γραφικά** (στον φάκελο αυτό):
- App icon: `icon-512.png` (512×512)
- Feature graphic: `feature-graphic.png` (1024×500)
- Phone screenshots: `screenshots/1-home.png` … `7-plus.png` (1080×1920, χρειάζονται τουλάχιστον 2)

**Κατηγορία:** Parenting (Γονείς) · **Tags:** Parenting, Education, Kids activities
**Email επικοινωνίας:** info@viorilo.gr · **Website:** https://playnest.kosbouris.workers.dev

## 4. App content (Policy → App content)

| Ενότητα | Απάντηση |
|---|---|
| **Privacy policy** | https://playnest.kosbouris.workers.dev/privacy.html |
| **App access** | All functionality is available without special access (δεν υπάρχει login) |
| **Ads** | No, my app does not contain ads |
| **Content rating** | Ερωτηματολόγιο IARC, κατηγορία *Reference, News, or Educational*: όλα «Όχι» (βία, σεξ, γλώσσα, ουσίες, τζόγος). Επικοινωνία χρηστών: Όχι. Κοινοποίηση τοποθεσίας: Όχι. Ψηφιακές αγορές: Όχι. Αναμενόμενη βαθμολογία: PEGI 3 / Everyone. |
| **Target audience** | **18 και άνω** (η εφαρμογή είναι για γονείς). Στο «Could your app unintentionally appeal to children?» → *No*. Αν επιλέξετε ηλικίες κάτω των 13, μπαίνετε στο πρόγραμμα Families με επιπλέον απαιτήσεις. |
| **News app** | No |
| **COVID-19 / Health** | Δεν ισχύει / No health features |
| **Data safety** | Βλ. παρακάτω |
| **Government app** | No |
| **Financial features** | None |
| **AI-generated content** | Ναι: δημιουργία δραστηριοτήτων με AI. Οι χρήστες αναφέρουν ακατάλληλο περιεχόμενο με το κουμπί «🚩 Αναφορά δραστηριότητας». |

### Data safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all data encrypted in transit?** Yes (HTTPS).
**Do you provide a way to request data deletion?** Τα δεδομένα μένουν στη συσκευή και διαγράφονται με απεγκατάσταση ή εκκαθάριση δεδομένων. Τα μόνα δεδομένα στον server (μετρητές ορίων) σβήνονται αυτόματα σε 2 ημέρες. Αιτήματα: info@viorilo.gr.

| Τύπος δεδομένων | Συλλέγεται | Κοινοποιείται | Επεξεργασία | Υποχρεωτικό | Σκοπός |
|---|---|---|---|---|---|
| Photos and videos → Photos | Ναι | Όχι* | Ephemeral (δεν αποθηκεύεται) | Προαιρετικό | App functionality (Snap & Play) |
| App activity → Other user-generated content (κείμενο υλικών) | Ναι | Όχι* | Ephemeral | Προαιρετικό | App functionality (PlayNest AI) |
| App activity → Other actions (αναφορές περιεχομένου) | Ναι | Όχι | Αποθηκεύεται 180 ημέρες | Προαιρετικό | App functionality |
| Device or other IDs (τυχαίο αναγνωριστικό εφαρμογής) | Ναι | Όχι | 2 ημέρες | Προαιρετικό (μόνο με χρήση AI) | Fraud prevention, security |

\* Η αποστολή στην Anthropic (Claude) γίνεται ως **service provider** που επεξεργάζεται για λογαριασμό μας. Σύμφωνα με τους ορισμούς του Google Play, αυτό **δεν** μετράει ως «sharing».

Τίποτα άλλο (όνομα, email, τοποθεσία, επαφές, οικονομικά, υγεία) δεν συλλέγεται. Τα προφίλ, τα αγαπημένα και το ημερολόγιο μένουν μόνο στη συσκευή και δεν δηλώνονται.

## 5. Δοκιμή και δημοσίευση

1. **Testing → Internal testing → Create new release.** Ανέβασε το `app-release.aab`. Στο Release name βάλε π.χ. `2.0.0`. Πρόσθεσε testers (λίστα email) και άνοιξε τον σύνδεσμο συμμετοχής στο κινητό.
2. Δοκίμασε στο κινητό: εγκατάσταση από το Play, υπενθύμιση, βήμα-βήμα, Snap & Play (κάμερα).
3. **Production → Create new release** με το ίδιο AAB (ή νεότερο), χώρες διάθεσης (π.χ. Ελλάδα και Κύπρος) → **Send for review**. Ο πρώτος έλεγχος παίρνει συνήθως από λίγες μέρες ως μία εβδομάδα.

## 6. Πριν την υποβολή

- [ ] **PlayNest AI:** αν δεν έχει μπει το `ANTHROPIC_API_KEY` στο Cloudflare, ο ελεγκτής θα δει «Το PlayNest AI δεν έχει ενεργοποιηθεί ακόμη». Είτε ενεργοποίησέ το πριν την υποβολή, είτε βγάλε την παράγραφο «PlayNest AI και Snap & Play» από την περιγραφή, για να μη θεωρηθεί παραπλανητική.
- [ ] Το `info@viorilo.gr` λαμβάνει email (το ζητά η Google για επικοινωνία).
- [ ] **Plus και κλείδωμα:** 150 δραστηριότητες και τα εργαλεία Plus κλειδώνουν μετά τη δωρεάν δοκιμή των 7 ημερών, αλλά η συνδρομή δείχνει «έρχεται σύντομα». Πριν τη δημόσια έκδοση στο Play, ή συνδέουμε το Google Play Billing (συνδρομή μέσα στην εφαρμογή, δήλωση «Contains in-app purchases»), ή ανοίγουμε προσωρινά το Plus σε όλους. Η Google μπορεί να απορρίψει εφαρμογή που κλειδώνει περιεχόμενο χωρίς τρόπο αγοράς.
