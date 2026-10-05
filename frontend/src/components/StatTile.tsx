import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
  /** Makes the tile a button, e.g. to open the movie it's about. */
  onClick?: () => void
  className?: string
}

/** One stat in the History strip: a small label above the value. */
export function StatTile({ label, children, onClick, className = '' }: Props) {
  const body = (
    <>
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
      <span className="mt-1.5 flex min-w-0 flex-1 flex-col justify-end">{children}</span>
    </>
  )
  const base = `flex min-w-0 flex-col rounded-2xl bg-ink-900/80 p-4 text-left ring-1 ring-ink-700 ${className}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} transition hover:bg-ink-800 hover:ring-ink-600`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  )
}
