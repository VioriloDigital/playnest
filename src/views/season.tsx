import { ActivityMini, SectionTitle } from "../components"
import { activities, isLocked } from "../lib/activities"
import { actText, pick2 } from "../lib/i18n"
import { back, go } from "../lib/router"
import { currentThemes, nextTheme, THEMES, type Theme } from "../lib/seasons"
import { useStore } from "../lib/store"

const ofTheme = (t: Theme) => activities.filter((a) => a.tags.includes(`season:${t.key}`))
const name = (t: Theme, l: "el" | "en") => (l === "el" ? t.el : t.en)

/** Home card: today's theme with a strip of its activities, and what's coming next. */
export function SeasonCard() {
  const { state } = useStore()
  const l = state.lang
  const now = currentThemes()[0]
  const next = nextTheme()
  if (!now) return null
  const list = ofTheme(now)
  return (
    <div className="seasonCard" style={{ background: `linear-gradient(135deg, ${now.color[0]}, ${now.color[1]})` }}>
      <button className="seasonHead" onClick={() => go(`season/${now.key}`)}>
        <span className="seasonEmoji">{now.emoji}</span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div className="small">{pick2(l, "Θέμα της εποχής", "Theme of the season")}</div>
          <b>{name(now, l)}</b>
        </div>
        <span className="chev">›</span>
      </button>
      <div className="seasonStrip">
        {list.map((a) => (
          <button key={a.id} className="seasonItem" onClick={() => go(`activity/${a.id}`)}>
            <span className="siEmoji">{a.emoji}</span>
            {isLocked(a) && <span className="siLock">🔒</span>}
            <small>{actText.title(a, l)}</small>
          </button>
        ))}
      </div>
      {next && next.days <= 45 && (
        <button className="seasonNext" onClick={() => go(`season/${next.theme.key}`)}>
          {next.theme.emoji}{" "}
          {pick2(
            l,
            `${next.theme.el} σε ${next.days === 1 ? "1 μέρα" : `${next.days} μέρες`}: δείτε τι ετοιμάζουμε →`,
            `${next.theme.en} in ${next.days} ${next.days === 1 ? "day" : "days"}: see what's coming →`,
          )}
        </button>
      )}
    </div>
  )
}

/** #/season: all themes through the year; #/season/<key>: one theme's activities. */
export function SeasonView({ themeKey }: { themeKey?: string }) {
  const { state } = useStore()
  const l = state.lang
  const live = new Set(currentThemes().map((x) => x.key))
  const next = nextTheme()
  const theme = THEMES.find((x) => x.key === themeKey)

  if (theme) {
    const list = ofTheme(theme)
    const status = live.has(theme.key)
      ? pick2(l, "Τώρα!", "Now!")
      : next?.theme.key === theme.key
        ? pick2(l, `Σε ${next.days} μέρες`, `In ${next.days} days`)
        : ""
    return (
      <>
        <button className="back noprint" onClick={() => back("season")}>
          ← {pick2(l, "Πίσω", "Back")}
        </button>
        <div className="seasonHero" style={{ background: `linear-gradient(135deg, ${theme.color[0]}, ${theme.color[1]})` }}>
          <div className="seasonHeroEmoji">{theme.emoji}</div>
          <h1>{name(theme, l)}</h1>
          {status && <span className="plusBadge">{status}</span>}
          <p className="small">
            {pick2(
              l,
              `${list.length} δραστηριότητες για αυτή την εποχή. Η πρώτη είναι δωρεάν, και όλες ανοίγουν με το Plus.`,
              `${list.length} activities for this time of year. The first is free; Plus opens them all.`,
            )}
          </p>
        </div>
        {list.map((a) => (
          <ActivityMini key={a.id} a={a} />
        ))}
        <button className="secondary" style={{ width: "100%", marginTop: 8 }} onClick={() => go("season")}>
          📅 {pick2(l, "Όλες οι εποχές", "All seasons")}
        </button>
      </>
    )
  }

  return (
    <>
      <button className="back noprint" onClick={() => back()}>
        ← {pick2(l, "Πίσω", "Back")}
      </button>
      <SectionTitle>📅 {pick2(l, "Θέματα όλης της χρονιάς", "Themes all year round")}</SectionTitle>
      <p className="small" style={{ margin: "0 2px 10px" }}>
        {pick2(
          l,
          "Κάθε εποχή και κάθε γιορτή φέρνει τις δικές της δραστηριότητες. Οι προτάσεις της Αρχικής ακολουθούν την εποχή.",
          "Every season and holiday brings its own activities. Suggestions on Home follow the season.",
        )}
      </p>
      <div className="seasonGrid">
        {THEMES.map((th) => {
          const isNow = live.has(th.key)
          const isNext = next?.theme.key === th.key
          return (
            <button
              key={th.key}
              className={`seasonTile ${isNow ? "now" : ""}`}
              style={{ background: `linear-gradient(135deg, ${th.color[0]}, ${th.color[1]})` }}
              onClick={() => go(`season/${th.key}`)}
            >
              <span className="stEmoji">{th.emoji}</span>
              <b>{name(th, l)}</b>
              <small>
                {isNow ? pick2(l, "● Τώρα", "● Now") : isNext ? pick2(l, `σε ${next!.days} μέρες`, `in ${next!.days} days`) : `${ofTheme(th).length} ${pick2(l, "δραστηριότητες", "activities")}`}
              </small>
            </button>
          )
        })}
      </div>
    </>
  )
}
