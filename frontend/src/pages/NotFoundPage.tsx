import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="This reel is missing"
      action={
        <Link
          to="/watchlist"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-strong"
        >
          Back to the watchlist
        </Link>
      }
    >
      There's nothing on this page.
    </EmptyState>
  )
}
