import Anthropic from "@anthropic-ai/sdk"

export const MODEL = "claude-opus-5-5"

const AGES = ["1-2", "2-3", "3-4", "4-6", "6-8"]
const TIMES = ["5", "15", "30", "60"]
const PLACES = ["home", "outside", "car", "restaurant"]
const TYPES = ["creative", "learning", "movement", "calm"]

// Structured outputs don't accept array length limits, so the counts live in descriptions
// and normalizeActivity() enforces them.
const strList = (min: number, max: number) => ({
  type: "array",
  items: { type: "string" },
  description: `${min}-${max} items`,
})
const enumList = (values: string[]) => ({
  type: "array",
  items: { type: "string", enum: values },
  description: "At least one",
})

/** One activity, written in Greek and English, in the same shape as the built-in library. */
const ACTIVITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "emoji", "titleEl", "titleEn", "descEl", "descEn", "materialsEl", "materialsEn",
    "skillsEl", "skillsEn", "stepsEl", "stepsEn", "ages", "times", "places", "types",
  ],
  properties: {
    emoji: { type: "string", description: "One emoji that pictures the activity" },
    titleEl: { type: "string" },
    titleEn: { type: "string" },
    descEl: { type: "string", description: "1-2 sentences" },
    descEn: { type: "string" },
    materialsEl: strList(1, 8),
    materialsEn: strList(1, 8),
    skillsEl: strList(1, 4),
    skillsEn: strList(1, 4),
    stepsEl: strList(3, 8),
    stepsEn: strList(3, 8),
    ages: enumList(AGES),
    times: enumList(TIMES),
    places: enumList(PLACES),
    types: enumList(TYPES),
  },
}

const SNAP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["materialsEl", "materialsEn", "activities"],
  properties: {
    materialsEl: { type: "array", items: { type: "string" }, description: "Up to 12 play-safe objects seen in the photo, Greek" },
    materialsEn: { type: "array", items: { type: "string" }, description: "Same list in English, same order" },
    activities: { type: "array", items: ACTIVITY_SCHEMA, description: "0-2 activities" },
  },
}

const SYSTEM = `You are PlayNest's activity designer: an early-childhood educator who writes short, playful, practical activities that a parent can start in a minute with a child aged 1-8.

Write every activity in both Greek and English. The Greek must read as natural, warm Greek written by a Greek parent (not a translation); the English is its faithful equivalent. Address the parent directly. Steps are short imperative sentences, one action each, 3-8 steps.

Safety comes first and is non-negotiable:
- Match the activity to the child's age. For under 3: nothing smaller than a toilet-paper tube (choking), no balloons, beads, magnets, button batteries, cords around the neck or plastic bags.
- No sharp tools, heat, cooking on a hob, chemicals, cleaning products, medicines, water deeper than a bowl, climbing on furniture or traffic. Scissors only for 4+ with rounded children's scissors.
- When an adult must stay close, say so in the steps.
- In a car the child stays buckled in the car seat and the driver never takes part; in a restaurant the activity is quiet and stays at the table.

Prefer screen-free play with things most homes already have. Keep it fun: a tiny story, a challenge or a game element beats a worksheet.`

type Json = Record<string, unknown>

const strings = (v: unknown, max: number): string[] =>
  (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max)
const allowed = (v: unknown, values: string[], must?: string): string[] => {
  const out = strings(v, values.length).filter((x) => values.includes(x))
  if (must && values.includes(must) && !out.includes(must)) out.push(must)
  return out.length ? [...new Set(out)] : [values[0]]
}

/** Checks a generated activity against the limits the schema could not express. Throws if unusable. */
export function normalizeActivity(v: unknown, want?: { age?: string; time?: string; place?: string }): Json {
  const a = (v ?? {}) as Json
  const text = (k: string) => (typeof a[k] === "string" ? (a[k] as string).trim().slice(0, 400) : "")
  const out = {
    emoji: text("emoji").slice(0, 8) || "🎈",
    titleEl: text("titleEl").slice(0, 80),
    titleEn: text("titleEn").slice(0, 80),
    descEl: text("descEl"),
    descEn: text("descEn"),
    materialsEl: strings(a.materialsEl, 8),
    materialsEn: strings(a.materialsEn, 8),
    skillsEl: strings(a.skillsEl, 4),
    skillsEn: strings(a.skillsEn, 4),
    stepsEl: strings(a.stepsEl, 8),
    stepsEn: strings(a.stepsEn, 8),
    ages: allowed(a.ages, AGES, want?.age).sort((x, y) => AGES.indexOf(x) - AGES.indexOf(y)),
    times: allowed(a.times, TIMES, want?.time).sort((x, y) => TIMES.indexOf(x) - TIMES.indexOf(y)),
    places: allowed(a.places, PLACES, want?.place),
    types: allowed(a.types, TYPES),
  }
  if (!out.titleEl || !out.titleEn || out.stepsEl.length < 2 || out.stepsEn.length < 2) {
    throw new Error("incomplete activity")
  }
  if (!out.materialsEl.length) out.materialsEl = ["Τίποτα ιδιαίτερο"]
  if (!out.materialsEn.length) out.materialsEn = ["Nothing special"]
  return out
}

export interface ActivityRequest {
  lang: "el" | "en"
  age: string
  time: string
  place: string
  type: string
  materials?: string
  avoid?: string[]
}

export interface SnapRequest {
  lang: "el" | "en"
  age: string
  image: string
  mediaType: "image/jpeg" | "image/png" | "image/webp"
}

export class AIRefusal extends Error {}

function textOf(msg: Anthropic.Beta.BetaMessage): string {
  if (msg.stop_reason === "refusal") throw new AIRefusal("refused")
  if (msg.stop_reason === "max_tokens") throw new Error("output truncated")
  return msg.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
}

async function generate(
  client: Anthropic,
  content: Anthropic.Beta.BetaContentBlockParam[],
  schema: Record<string, unknown>,
): Promise<unknown> {
  const msg = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Short creative writing: low effort keeps the parent's wait short.
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    // On a safety decline the API retries on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content }],
  })
  return JSON.parse(textOf(msg))
}

const PLACE_TEXT: Record<string, string> = {
  home: "at home",
  outside: "outdoors (park, yard or street walk)",
  car: "in the car, child in the car seat",
  restaurant: "at a restaurant table",
}

export async function createActivity(client: Anthropic, r: ActivityRequest): Promise<unknown> {
  const lines = [
    `Create one new activity for a child aged ${r.age} years.`,
    `Where: ${PLACE_TEXT[r.place] ?? "at home"}. Time available: about ${r.time} minutes.`,
    r.type !== "all" ? `Kind of activity: ${r.type}.` : "Any kind of activity.",
    r.materials
      ? `The parent says they have: """${r.materials.slice(0, 300)}""". Build the activity around these, and only add very common household items. Ignore anything unsafe for this age.`
      : "Use no materials or only very common household items.",
    r.avoid?.length ? `Make it clearly different from: ${r.avoid.slice(0, 10).join("; ")}.` : "",
    `Set ages to the age groups it truly suits (it must include ${r.age}), times to include ${r.time}, places to include ${r.place}.`,
  ]
  const raw = await generate(client, [{ type: "text", text: lines.filter(Boolean).join("\n") }], ACTIVITY_SCHEMA)
  return normalizeActivity(raw, { age: r.age, time: r.time, place: r.place })
}

export async function snapAndPlay(client: Anthropic, r: SnapRequest): Promise<unknown> {
  const raw = (await generate(
    client,
    [
      { type: "image", source: { type: "base64", media_type: r.mediaType, data: r.image } },
      {
        type: "text",
        text: [
          `A parent photographed what they have available to play with a child aged ${r.age} years.`,
          "List the objects in the photo that are safe to play with at this age (leave out anything unsafe, and people).",
          "Then create 2 different activities that use those objects. If the photo shows nothing usable, return empty lists.",
        ].join("\n"),
      },
    ],
    SNAP_SCHEMA,
  )) as Json
  const activities: Json[] = []
  for (const a of Array.isArray(raw.activities) ? raw.activities.slice(0, 2) : []) {
    try {
      activities.push(normalizeActivity(a, { age: r.age }))
    } catch {
      /* drop an incomplete one, keep the other */
    }
  }
  return { materialsEl: strings(raw.materialsEl, 12), materialsEn: strings(raw.materialsEn, 12), activities }
}
