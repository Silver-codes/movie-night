import type { ReactNode } from 'react'
import { FilmIcon } from './NavIcons'

type Props = {
  title: string
  children?: ReactNode
  icon?: ReactNode
  /** e.g. a button or link. */
  action?: ReactNode
}

export function EmptyState({ title, children, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        {icon ?? <FilmIcon className="size-7" />}
      </div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children && <div className="mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
