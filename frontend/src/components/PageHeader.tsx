import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: ReactNode
  /** Buttons etc. on the right (below the title on phones). */
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-prose text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
