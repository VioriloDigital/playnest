import { addEntry } from "./journal"
import { useStore, type Celebration } from "./store"
import type { AppState, ChildProfile, Rating } from "./types"

/** Stars needed for each new sticker. */
export const STARS_PER_STICKER = 3

/** The sticker album, unlocked in this order. */
export const STICKERS: { emoji: string; el: string; en: string }[] = [
  { emoji: "🐣", el: "Κοτοπουλάκι", en: "Chick" },
  { emoji: "🐶", el: "Σκυλάκι", en: "Puppy" },
  { emoji: "🐱", el: "Γατούλα", en: "Kitty" },
  { emoji: "🐰", el: "Κουνελάκι", en: "Bunny" },
  { emoji: "🦊", el: "Αλεπουδίτσα", en: "Fox" },
  { emoji: "🐻", el: "Αρκουδάκι", en: "Teddy" },
  { emoji: "🐼", el: "Πάντα", en: "Panda" },
  { emoji: "🐨", el: "Κοάλα", en: "Koala" },
  { emoji: "🦁", el: "Λιονταράκι", en: "Lion cub" },
  { emoji: "🐯", el: "Τιγράκι", en: "Tiger" },
  { emoji: "🐸", el: "Βατραχάκι", en: "Frog" },
  { emoji: "🐵", el: "Μαϊμουδίτσα", en: "Monkey" },
  { emoji: "🐧", el: "Πιγκουίνος", en: "Penguin" },
  { emoji: "🦉", el: "Κουκουβάγια", en: "Owl" },
  { emoji: "🦄", el: "Μονόκερος", en: "Unicorn" },
  { emoji: "🐢", el: "Χελωνίτσα", en: "Turtle" },
  { emoji: "🐙", el: "Χταποδάκι", en: "Octopus" },
  { emoji: "🐬", el: "Δελφίνι", en: "Dolphin" },
  { emoji: "🐳", el: "Φαλαινίτσα", en: "Whale" },
  { emoji: "🦋", el: "Πεταλούδα", en: "Butterfly" },
  { emoji: "🐞", el: "Πασχαλίτσα", en: "Ladybird" },
  { emoji: "🐝", el: "Μελισσούλα", en: "Bee" },
  { emoji: "🦒", el: "Καμηλοπάρδαλη", en: "Giraffe" },
  { emoji: "🐘", el: "Ελεφαντάκι", en: "Elephant" },
  { emoji: "🦓", el: "Ζέβρα", en: "Zebra" },
  { emoji: "🦔", el: "Σκαντζόχοιρος", en: "Hedgehog" },
  { emoji: "🦜", el: "Παπαγάλος", en: "Parrot" },
  { emoji: "🦩", el: "Φλαμίνγκο", en: "Flamingo" },
  { emoji: "🐿️", el: "Σκιουράκι", en: "Squirrel" },
  { emoji: "🦕", el: "Δεινοσαυράκι", en: "Dinosaur" },
  { emoji: "🌈", el: "Ουράνιο τόξο", en: "Rainbow" },
  { emoji: "🌻", el: "Ηλιοτρόπιο", en: "Sunflower" },
  { emoji: "🍄", el: "Μανιταράκι", en: "Mushroom" },
  { emoji: "🌙", el: "Φεγγαράκι", en: "Moon" },
  { emoji: "⭐", el: "Αστέρι", en: "Star" },
  { emoji: "🚀", el: "Πύραυλος", en: "Rocket" },
  { emoji: "🎈", el: "Μπαλόνι", en: "Balloon" },
  { emoji: "🏰", el: "Κάστρο", en: "Castle" },
  { emoji: "🐉", el: "Δρακάκι", en: "Dragon" },
  { emoji: "👑", el: "Κορώνα", en: "Crown" },
]

/** Reward ideas offered when the parent adds one. */
export const REWARD_IDEAS: { emoji: string; el: string; en: string; cost: number }[] = [
  { emoji: "🍦", el: "Ένα παγωτό", en: "An ice cream", cost: 10 },
  { emoji: "🌳", el: "Βόλτα στην παιδική χαρά", en: "Trip to the playground", cost: 8 },
  { emoji: "📖", el: "Ένα παραμύθι παραπάνω", en: "One extra bedtime story", cost: 5 },
  { emoji: "🍕", el: "Βραδιά πίτσας", en: "Pizza night", cost: 15 },
  { emoji: "🎨", el: "Νέες μπογιές", en: "New crayons", cost: 12 },
  { emoji: "🎬", el: "Οικογενειακή ταινία", en: "Family movie night", cost: 15 },
  { emoji: "🧸", el: "Ένα μικρό παιχνίδι", en: "A small toy", cost: 25 },
  { emoji: "🎡", el: "Μια ξεχωριστή έξοδος", en: "A special day out", cost: 40 },
]

export const REWARD_EMOJIS = ["🎁", "🍦", "🌳", "📖", "🍕", "🎨", "🎬", "🧸", "🎡", "⚽", "🚲", "🍫", "🎮", "🛝", "🏊", "🧁"]

/** Stars a child has earned: one per journal entry they did. */
export function earnedStars(s: AppState, child: ChildProfile): number {
  return s.log.filter((e) => e.childId === child.id).length
}

export function spentStars(child: ChildProfile): number {
  return child.rewards.filter((r) => r.redeemedAt).reduce((n, r) => n + r.cost, 0)
}

export function availableStars(s: AppState, child: ChildProfile): number {
  return Math.max(0, earnedStars(s, child) - spentStars(child))
}

export function unlockedStickers(stars: number): number {
  return Math.min(STICKERS.length, Math.floor(stars / STARS_PER_STICKER))
}

/**
 * Records a finished activity for the active child and shows the celebration:
 * the new star, a sticker when one unlocks, and a reward when it becomes affordable.
 */
export function useCompleteActivity() {
  const { state, update, celebrate, profile } = useStore()
  return (e: { actId: number; note?: string; rating?: Rating; weekDay?: number }) => {
    const before = earnedStars(state, profile)
    const after = before + 1
    const freeBefore = availableStars(state, profile)
    update((s) => addEntry(s, { ...e, childId: (s.profiles[s.active] ?? s.profiles[0]).id }))
    const stickerIdx = unlockedStickers(after) > unlockedStickers(before) ? unlockedStickers(after) - 1 : -1
    const reward = profile.rewards.find((r) => !r.redeemedAt && freeBefore < r.cost && freeBefore + 1 >= r.cost)
    const c: Celebration = {
      name: profile.name,
      stars: after,
      sticker: stickerIdx >= 0 ? STICKERS[stickerIdx] : undefined,
      reward: reward ? { emoji: reward.emoji, title: reward.title } : undefined,
    }
    celebrate(c)
  }
}
