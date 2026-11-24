import { useEffect, useState } from "react"
import { SectionTitle } from "../components"
import { pick2 } from "../lib/i18n"
import {
  availableStars,
  earnedStars,
  REWARD_EMOJIS,
  REWARD_IDEAS,
  STARS_PER_STICKER,
  STICKERS,
  unlockedStickers,
} from "../lib/rewards"
import { back, go } from "../lib/router"
import { newId, useStore } from "../lib/store"
import { AVATARS, type ChildProfile, type Reward } from "../lib/types"


function childName(p: ChildProfile, i: number, l: "el" | "en") {
  return p.name || pick2(l, `Παιδί ${i + 1}`, `Child ${i + 1}`)
}

/** Small "⭐ 12" summary that opens the rewards screen; used on Home and Progress. */
export function StarsCard() {
  const { state, profile } = useStore()
  const l = state.lang
  const stars = earnedStars(state, profile)
  const free = availableStars(state, profile)
  const into = stars % STARS_PER_STICKER
  return (
    <button className="card2 starsCard" onClick={() => go("rewards")}>
      <div className="starsBig">⭐ {free}</div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <b>{pick2(l, "Αστεράκια & ανταμοιβές", "Stars & rewards")}</b>
        <div className="small">
          {unlockedStickers(stars)}/{STICKERS.length} {pick2(l, "αυτοκόλλητα", "stickers")} ·{" "}
          {pick2(l, `${STARS_PER_STICKER - into} ακόμη για το επόμενο`, `${STARS_PER_STICKER - into} more to the next`)}
        </div>
      </div>
      <span className="chev">›</span>
    </button>
  )
}

export function Rewards() {
  const { state, update, profile, toast } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const stars = earnedStars(state, profile)
  const free = availableStars(state, profile)
  const unlocked = unlockedStickers(stars)
  const into = stars % STARS_PER_STICKER
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [emoji, setEmoji] = useState("🎁")
  const [cost, setCost] = useState(10)
  const [shown, setShown] = useState<number | null>(null)

  const setRewards = (fn: (r: Reward[]) => Reward[]) =>
    update((s) => {
      const profiles = [...s.profiles]
      const i = s.active
      profiles[i] = { ...profiles[i], rewards: fn(profiles[i].rewards) }
      return { ...s, profiles }
    })
  const addReward = () => {
    if (!title.trim()) return
    setRewards((r) => [...r, { id: newId("r"), emoji, title: title.trim().slice(0, 60), cost }])
    setAdding(false)
    setTitle("")
  }
  const redeem = (r: Reward) => {
    if (!confirm(p(`Εξαργύρωση «${r.title}» για ${r.cost} ⭐;`, `Claim “${r.title}” for ${r.cost} ⭐?`))) return
    setRewards((list) => list.map((x) => (x.id === r.id ? { ...x, redeemedAt: new Date().toISOString() } : x)))
    toast(p(`🎉 Το κέρδισες: ${r.title}!`, `🎉 You earned it: ${r.title}!`))
  }
  const remove = (r: Reward) => {
    if (!confirm(p(`Διαγραφή «${r.title}»;`, `Delete “${r.title}”?`))) return
    setRewards((list) => list.filter((x) => x.id !== r.id))
  }
  const open = profile.rewards.filter((r) => !r.redeemedAt)
  const claimed = profile.rewards.filter((r) => r.redeemedAt)

  return (
    <>
      <button className="back noprint" onClick={() => back()}>
        ← {p("Πίσω", "Back")}
      </button>

      {state.profiles.length > 1 && (
        <div className="chips" style={{ marginTop: 10 }}>
          {state.profiles.map((c, i) => (
            <button
              key={c.id}
              className={`chip ${i === state.active ? "sel" : ""}`}
              onClick={() => update((s) => ({ ...s, active: i }))}
            >
              {AVATARS[i] ?? "🐥"} {childName(c, i, l)}
            </button>
          ))}
        </div>
      )}

      <div className="rewardHero">
        <div className="rhAvatar">{AVATARS[state.active] ?? "🐥"}</div>
        <div className="rhName">{childName(profile, state.active, l)}</div>
        <div className="rhStars">⭐ {free}</div>
        <div className="small">
          {p(`${stars} αστεράκια συνολικά`, `${stars} stars in total`)}
          {stars !== free && ` · ${p(`${stars - free} εξαργυρώθηκαν`, `${stars - free} spent`)}`}
        </div>
        {unlocked < STICKERS.length && (
          <div className="nextSticker">
            <div className="progressBar">
              <div className="progressFill" style={{ width: `${(into / STARS_PER_STICKER) * 100}%` }} />
            </div>
            <span className="small">
              {p(
                `Ακόμη ${STARS_PER_STICKER - into} ⭐ για νέο αυτοκόλλητο!`,
                `${STARS_PER_STICKER - into} more ⭐ for a new sticker!`,
              )}
            </span>
          </div>
        )}
        <p className="small">
          {p(
            "Κάθε δραστηριότητα που ολοκληρώνετε δίνει ένα αστεράκι.",
            "Every activity you finish earns a star.",
          )}
        </p>
      </div>

      <SectionTitle>
        🦁 {p("Άλμπουμ αυτοκόλλητων", "Sticker album")} ({unlocked}/{STICKERS.length})
      </SectionTitle>
      <div className="album">
        {STICKERS.map((st, i) =>
          i < unlocked ? (
            <button key={st.emoji} className="sticker on" onClick={() => setShown(i)} aria-label={l === "el" ? st.el : st.en}>
              {st.emoji}
            </button>
          ) : (
            <div key={st.emoji} className="sticker" aria-hidden>
              {i === unlocked ? "🎁" : "?"}
            </div>
          ),
        )}
      </div>
      {shown !== null && (
        <div className="overlay" onClick={() => setShown(null)}>
          <div className="stickerShow">
            <div className="bigSticker">{STICKERS[shown].emoji}</div>
            <b>{l === "el" ? STICKERS[shown].el : STICKERS[shown].en}</b>
          </div>
        </div>
      )}

      <SectionTitle>🎁 {p("Ανταμοιβές", "Rewards")}</SectionTitle>
      <p className="small" style={{ margin: "0 2px 8px" }}>
        {p(
          "Συμφωνήστε μαζί μια ανταμοιβή: όταν μαζευτούν τα αστεράκια, την εξαργυρώνετε.",
          "Agree on a reward together: when the stars are collected, claim it.",
        )}
      </p>
      {open.map((r) => {
        const ready = free >= r.cost
        return (
          <div key={r.id} className={`card2 rewardRow ${ready ? "ready" : ""}`}>
            <div className="rwEmoji">{r.emoji}</div>
            <div style={{ flex: 1 }}>
              <b>{r.title}</b>
              <div className="progressBar" style={{ margin: "6px 0" }}>
                <div className="progressFill" style={{ width: `${Math.min(100, (free / r.cost) * 100)}%` }} />
              </div>
              <div className="small">
                ⭐ {Math.min(free, r.cost)} / {r.cost}
              </div>
            </div>
            <div className="rwActions">
              {ready && (
                <button className="primary small-btn" onClick={() => redeem(r)}>
                  {p("Εξαργύρωση", "Claim")}
                </button>
              )}
              <button className="iconbtn" aria-label="delete" onClick={() => remove(r)}>
                🗑️
              </button>
            </div>
          </div>
        )
      })}
      {adding ? (
        <div className="card2 fields">
          <div className="small">{p("Γρήγορες ιδέες", "Quick ideas")}</div>
          <div className="chips">
            {REWARD_IDEAS.map((idea) => (
              <button
                key={idea.emoji}
                className="chip"
                onClick={() => {
                  setEmoji(idea.emoji)
                  setTitle(l === "el" ? idea.el : idea.en)
                  setCost(idea.cost)
                }}
              >
                {idea.emoji} {l === "el" ? idea.el : idea.en}
              </button>
            ))}
          </div>
          <label>
            {p("Ανταμοιβή", "Reward")}
            <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder={p("π.χ. Βόλτα στο πάρκο", "e.g. A trip to the park")} />
          </label>
          <div>
            <div className="small">{p("Εικονίδιο", "Icon")}</div>
            <div className="emojiPick">
              {REWARD_EMOJIS.map((e) => (
                <button key={e} className={emoji === e ? "on" : ""} onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="small">{p("Πόσα αστεράκια;", "How many stars?")}</div>
            <div className="chips">
              {[3, 5, 8, 10, 15, 20, 30, 50].map((n) => (
                <button key={n} className={`chip ${cost === n ? "sel" : ""}`} onClick={() => setCost(n)}>
                  ⭐ {n}
                </button>
              ))}
            </div>
          </div>
          <div className="grid2">
            <button className="secondary" onClick={() => setAdding(false)}>
              {p("Άκυρο", "Cancel")}
            </button>
            <button className="primary" onClick={addReward} disabled={!title.trim()}>
              {p("Προσθήκη", "Add")}
            </button>
          </div>
        </div>
      ) : (
        <button className="secondary" style={{ width: "100%" }} onClick={() => setAdding(true)}>
          ＋ {p("Νέα ανταμοιβή", "New reward")}
        </button>
      )}
      {claimed.length > 0 && (
        <>
          <SectionTitle>🏆 {p("Κερδισμένες", "Earned")}</SectionTitle>
          <div className="card2">
            {claimed.map((r) => (
              <div key={r.id} className="claimedRow">
                <span>{r.emoji}</span> <b>{r.title}</b>
                <span className="small">
                  {new Date(r.redeemedAt!).toLocaleDateString(l === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>🏅 {p("Δίπλωμα", "Certificate")}</SectionTitle>
      <button className="card2 starsCard" onClick={() => go("diploma")}>
        <div className="starsBig">🏅</div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <b>{p("Δίπλωμα Μικρού Εξερευνητή", "Little Explorer Certificate")}</b>
          <div className="small">{p("Με το όνομα του παιδιού, για εκτύπωση", "With your child's name, ready to print")}</div>
        </div>
        <span className="chev">›</span>
      </button>
    </>
  )
}

export function Diploma() {
  const { state, profile } = useStore()
  const l = state.lang
  const p = (gr: string, en: string) => pick2(l, gr, en)
  const stars = earnedStars(state, profile)
  const stickers = STICKERS.slice(0, Math.max(3, unlockedStickers(stars))).slice(-6)
  const date = new Date().toLocaleDateString(l === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
  return (
    <>
      <div className="grid2 noprint" style={{ marginTop: 10 }}>
        <button className="secondary" onClick={() => back("rewards")}>
          ← {p("Πίσω", "Back")}
        </button>
        <button className="primary" onClick={() => window.print()}>
          🖨️ {p("Εκτύπωση", "Print")}
        </button>
      </div>
      <div className="diploma">
        <div className="dStickers">{stickers.map((s) => s.emoji).join(" ")}</div>
        <div className="dTitle">{p("Δίπλωμα", "Certificate")}</div>
        <div className="dSub">{p("Μικρού Εξερευνητή", "Little Explorer")}</div>
        <div className="dGiven">{p("απονέμεται στον/στην", "is awarded to")}</div>
        <div className="dName">{profile.name || p("στο παιδί μας", "our child")}</div>
        <p className="dText">
          {p(
            `για ${stars} ${stars === 1 ? "υπέροχη δραστηριότητα" : "υπέροχες δραστηριότητες"}, φαντασία, κέφι και πολύ παιχνίδι!`,
            `for ${stars} wonderful ${stars === 1 ? "activity" : "activities"}, imagination, joy and lots of play!`,
          )}
        </p>
        <div className="dStars">{"⭐".repeat(Math.min(10, Math.max(1, stars)))}</div>
        <div className="dFooter">
          <span>{date}</span>
          <span>🐦 PlayNest</span>
        </div>
      </div>
    </>
  )
}

/** Confetti and a big "well done" after an activity; closes on tap or after a few seconds. */
export function CelebrationOverlay() {
  const { state, celebration, celebrate } = useStore()
  const l = state.lang
  useEffect(() => {
    if (!celebration) return
    try {
      navigator.vibrate?.([60, 40, 120])
    } catch {
      /* not supported */
    }
    const t = window.setTimeout(() => celebrate(null), celebration.sticker || celebration.reward ? 7000 : 3500)
    return () => window.clearTimeout(t)
  }, [celebration, celebrate])
  if (!celebration) return null
  const c = celebration
  const pieces = ["🎉", "⭐", "🎈", "✨", "🌟", "🎊"]
  return (
    <div className="overlay celebrate" role="dialog" aria-live="polite" onClick={() => celebrate(null)}>
      <div className="confetti" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.12}s` }}>
            {pieces[i % pieces.length]}
          </span>
        ))}
      </div>
      <div className="celebrateCard" onClick={(e) => e.stopPropagation()}>
        <div className="cBig">🎉</div>
        <h2>{c.name ? pick2(l, `Μπράβο ${c.name}!`, `Well done ${c.name}!`) : pick2(l, "Μπράβο!", "Well done!")}</h2>
        <div className="cStar">+1 ⭐</div>
        <div className="small">{pick2(l, `${c.stars} αστεράκια συνολικά`, `${c.stars} stars in total`)}</div>
        {c.sticker && (
          <div className="cSticker">
            <div className="small">{pick2(l, "Νέο αυτοκόλλητο!", "New sticker!")}</div>
            <div className="bigSticker">{c.sticker.emoji}</div>
            <b>{l === "el" ? c.sticker.el : c.sticker.en}</b>
          </div>
        )}
        {c.reward && (
          <div className="cReward">
            🎁 {pick2(l, "Μαζέψατε τα αστεράκια για:", "You collected the stars for:")}{" "}
            <b>
              {c.reward.emoji} {c.reward.title}
            </b>
          </div>
        )}
        <div className="grid2" style={{ marginTop: 14 }}>
          <button className="secondary" onClick={() => celebrate(null)}>
            {pick2(l, "Συνέχεια", "Continue")}
          </button>
          <button
            className="primary"
            onClick={() => {
              celebrate(null)
              go("rewards")
            }}
          >
            ⭐ {pick2(l, "Ανταμοιβές", "Rewards")}
          </button>
        </div>
      </div>
    </div>
  )
}
