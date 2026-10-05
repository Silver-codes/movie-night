import { Link } from 'react-router'
import { PRIMARY_BUTTON_CLASS } from '../components/buttonStyles'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="This reel is missing"
      action={
        <Link to="/watchlist" className={PRIMARY_BUTTON_CLASS}>
          Back to the watchlist
        </Link>
      }
    >
      There's nothing on this page.
    </EmptyState>
  )
}
