import type { ReactNode } from 'react'

type Props = {
  active: boolean
  onClick: () => void
  children: ReactNode
  /** Classes for the active state; defaults to the accent. */
  activeClass?: string
}

/** A toggle pill for filters. */
export function FilterChip({ active, onClick, children, activeClass = 'bg-accent-soft text-accent ring-accent' }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap ring-1 transition ${
        active ? activeClass : 'bg-ink-900 text-muted ring-ink-700 hover:text-fg hover:ring-ink-600'
      }`}
    >
      {children}
    </button>
  )
}
