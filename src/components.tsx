import type { ReactNode } from "react"
import { actText, label, TYPE_LABEL } from "./lib/i18n"
import { back, go } from "./lib/router"
import { useStore } from "./lib/store"
import type { Activity } from "./lib/types"

export function openActivity(id: number) {
  go(`activity/${id}`)
}

export function ActivityMini({ a }: { a: Activity }) {
  const { state } = useStore()
  return (
    <button className="card2 activity-mini" onClick={() => openActivity(a.id)}>
      <div className="em">{a.emoji}</div>
      <div>
        <span className="pill">{label(state.lang, TYPE_LABEL[a.types[0]])}</span>
        <h3>{actText.title(a, state.lang)}</h3>
        <div className="small">
          👶 {a.ages.join(", ")} • ⏱️ {a.times[0]}'
        </div>
      </div>
    </button>
  )
}

export function RecCard({ a, sub }: { a: Activity; sub?: string }) {
  const { state } = useStore()
  return (
    <button className="recCard" onClick={() => openActivity(a.id)}>
      <div className="rEmoji">{a.emoji}</div>
      <b>{actText.title(a, state.lang)}</b>
      <div className="small">{sub ?? `${a.times[0]}' · ${a.ages.join(", ")}`}</div>
    </button>
  )
}

export function PlusHead({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="plusTop">
      <button className="plusBack" aria-label="Back" onClick={() => back("plus")}>
        ←
      </button>
      <div>
        <b>
          {icon} {title}
        </b>
        {sub && <div className="small">{sub}</div>}
      </div>
    </div>
  )
}

export function SectionTitle({ children, badge }: { children: ReactNode; badge?: string }) {
  return (
    <div className="sectionTitle">
      <h2>{children}</h2>
      {badge && <span className="plusBadge">{badge}</span>}
    </div>
  )
}
