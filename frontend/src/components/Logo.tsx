import { Link } from 'react-router'

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5 rounded-lg" aria-label="Movie Night home">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-xl bg-accent-soft text-lg text-accent ring-1 ring-accent/30 transition group-hover:ring-accent/60"
      >
        ★
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Movie <span className="text-accent">Night</span>
      </span>
    </Link>
  )
}
