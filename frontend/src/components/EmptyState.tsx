import type { ReactNode } from 'react'
import { FilmIcon, WarningIcon } from './NavIcons'

type Props = {
  title: string
  children?: ReactNode
  icon?: ReactNode
  /** e.g. a button or link. */
  action?: ReactNode
  /** `error` shows a warning icon in red and is announced to screen readers. */
  tone?: 'empty' | 'error'
}

export function EmptyState({ title, children, icon, action, tone = 'empty' }: Props) {
  const error = tone === 'error'
  return (
    <div
      role={error ? 'alert' : undefined}
      className="flex flex-col items-center rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 px-6 py-12 text-center"
    >
      <div
        className={`mb-4 grid size-14 place-items-center rounded-2xl ${error ? 'bg-danger/15 text-danger' : 'bg-accent-soft text-accent'}`}
      >
        {icon ?? (error ? <WarningIcon className="size-7" /> : <FilmIcon className="size-7" />)}
      </div>
      <h2 className="text-2xl font-semibold text-balance">{title}</h2>
      {children && <div className="mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
