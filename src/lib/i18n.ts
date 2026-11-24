import type { ActType, Activity, Lang, Place } from "./types"

const el = {
  home: "Αρχική",
  week: "Εβδομάδα",
  favorites: "Αγαπημένα",
  progress: "Πρόοδος",
  plus: "Plus",
  morning: "Καλημέρα!",
  afternoon: "Καλησπέρα!",
  evening: "Καλό βράδυ!",
  what: "Τι θα κάνουμε σήμερα;",
  heroSub: "Ιδέες προσαρμοσμένες στην ηλικία και στη στιγμή.",
  tagline: "Ιδέες παιχνιδιού για κάθε στιγμή",
  now: "✨ Βρες μου κάτι τώρα",
  today: "🌟 Δραστηριότητα της ημέρας",
  quick: "Γρήγορες περιστάσεις",
  profile: "Προφίλ παιδιού",
  myChild: "Το παιδί μου",
  name: "Όνομα ή ψευδώνυμο",
  namePh: "π.χ. Νίκος",
  age: "Ηλικία παιδιού",
  interests: "Ενδιαφέροντα",
  save: "Αποθήκευση",
  planner: "📅 Εβδομαδιαίο πρόγραμμα",
  plannerSub: "7 ισορροπημένες δραστηριότητες με βάση την ηλικία του παιδιού.",
  generate: "Δημιούργησε εβδομάδα",
  regenerate: "Νέα εβδομάδα",
  materials: "Υλικά",
  skills: "Δεξιότητες",
  steps: "Βήματα",
  another: "Δώσε μου άλλη",
  liked: "Του άρεσε;",
  done: "Ολοκληρωμένες",
  creative: "Δημιουργικές",
  movement: "Κινητικές",
  screen: "Χωρίς οθόνη",
  rain: "🌧️ Βρέχει",
  nomat: "🙌 Χωρίς υλικά",
  ten: "⏱️ 10 λεπτά",
  energy: "🏃 Έχει ενέργεια",
  bed: "🌙 Πριν τον ύπνο",
  car: "🚗 Αυτοκίνητο",
  rest: "🍽️ Εστιατόριο",
  find: "Βρες δραστηριότητα",
  fav: "Αγαπημένο",
  saved: "Αποθηκεύτηκε!",
  weekReady: "Το εβδομαδιαίο πρόγραμμα δημιουργήθηκε!",
  empty: "Δεν έχεις ακόμη αγαπημένες δραστηριότητες.",
  emptyHint: "Πάτησε 🤍 σε μια δραστηριότητα για να την κρατήσεις εδώ.",
  explore: "🔎 Explore · 200 αναλυτικές δραστηριότητες",
  search: "Αναζήτηση…",
  noResults: "Δεν βρέθηκαν δραστηριότητες.",
  minutes: "λεπτά",
  vehicle: "Οχήματα",
  animals: "Ζώα",
  art: "Ζωγραφική",
  music: "Μουσική",
  building: "Κατασκευές",
  nature: "Φύση",
  languages: "Γλώσσες",
  numbers: "Αριθμοί",
  badges: "🏆 Σήματα",
  print: "🖨️ Εκτύπωση",
  share: "📤 Κοινοποίηση",
  copied: "Αντιγράφηκε!",
}

type Dict = typeof el

const en: Dict = {
  home: "Home",
  week: "Week",
  favorites: "Favorites",
  progress: "Progress",
  plus: "Plus",
  morning: "Good morning!",
  afternoon: "Good afternoon!",
  evening: "Good evening!",
  what: "What shall we do today?",
  heroSub: "Age-appropriate ideas for the moment you are in.",
  tagline: "Play ideas for every moment",
  now: "✨ Find something now",
  today: "🌟 Activity of the day",
  quick: "Quick situations",
  profile: "Child profile",
  myChild: "My child",
  name: "Name or nickname",
  namePh: "e.g. Alex",
  age: "Child age",
  interests: "Interests",
  save: "Save",
  planner: "📅 Weekly activity plan",
  plannerSub: "7 balanced activities based on your child’s age.",
  generate: "Generate my week",
  regenerate: "New week",
  materials: "Materials",
  skills: "Skills",
  steps: "Steps",
  another: "Give me another",
  liked: "Did they enjoy it?",
  done: "Completed",
  creative: "Creative",
  movement: "Movement",
  screen: "Screen-free",
  rain: "🌧️ Rainy day",
  nomat: "🙌 No materials",
  ten: "⏱️ 10 minutes",
  energy: "🏃 Lots of energy",
  bed: "🌙 Before bed",
  car: "🚗 In the car",
  rest: "🍽️ Restaurant",
  find: "Find activity",
  fav: "Favorite",
  saved: "Saved!",
  weekReady: "Your weekly plan is ready!",
  empty: "You do not have favorites yet.",
  emptyHint: "Tap 🤍 on an activity to keep it here.",
  explore: "🔎 Explore · 200 detailed activities",
  search: "Search…",
  noResults: "No activities found.",
  minutes: "min",
  vehicle: "Vehicles",
  animals: "Animals",
  art: "Art",
  music: "Music",
  building: "Building",
  nature: "Nature",
  languages: "Languages",
  numbers: "Numbers",
  badges: "🏆 Badges",
  print: "🖨️ Print",
  share: "📤 Share",
  copied: "Copied!",
}

export type TKey = keyof Dict
const dicts: Record<Lang, Dict> = { el, en }

export function t(lang: Lang, key: TKey): string {
  return dicts[lang][key] ?? key
}

/** Inline bilingual string helper: pick Greek or English. */
export function pick2(lang: Lang, gr: string, eng: string): string {
  return lang === "el" ? gr : eng
}

export const DAYS: Record<Lang, string[]> = {
  el: ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
}

export const PLACE_LABEL: Record<Place, [string, string]> = {
  home: ["🏠 Σπίτι", "🏠 Home"],
  outside: ["🌳 Έξω", "🌳 Outside"],
  car: ["🚗 Αυτοκίνητο", "🚗 Car"],
  restaurant: ["🍽️ Εστιατόριο", "🍽️ Restaurant"],
}

export const TYPE_LABEL: Record<ActType, [string, string]> = {
  creative: ["🎨 Δημιουργικό", "🎨 Creative"],
  learning: ["🧠 Μάθηση", "🧠 Learning"],
  movement: ["🏃 Κίνηση", "🏃 Movement"],
  calm: ["😌 Ήρεμο", "😌 Calm"],
}

export function label(lang: Lang, pair: [string, string]): string {
  return pair[lang === "el" ? 0 : 1]
}

export function greeting(lang: Lang, now = new Date()): string {
  const h = now.getHours()
  return t(lang, h < 12 ? "morning" : h < 19 ? "afternoon" : "evening")
}

export const actText = {
  title: (a: Activity, l: Lang) => (l === "el" ? a.titleEl : a.titleEn),
  desc: (a: Activity, l: Lang) => (l === "el" ? a.descEl : a.descEn),
  materials: (a: Activity, l: Lang) => (l === "el" ? a.materialsEl : a.materialsEn),
  skills: (a: Activity, l: Lang) => (l === "el" ? a.skillsEl : a.skillsEn),
  steps: (a: Activity, l: Lang) => (l === "el" ? a.stepsEl : a.stepsEn),
}
