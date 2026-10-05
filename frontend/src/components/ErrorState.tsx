import { PRIMARY_BUTTON_CLASS } from './buttonStyles'
import { EmptyState } from './EmptyState'

type ErrorProps = {
  /** What failed, e.g. "the watchlist" → "Couldn't load the watchlist". */
  what: string
  error: Error | null
  onRetry: () => void
}

/** The error state used by every page: what failed, the error message, and Try again. */
export function ErrorState({ what, error, onRetry }: ErrorProps) {
  return (
    <EmptyState
      tone="error"
      title={`Couldn't load ${what}`}
      action={
        <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={onRetry}>
          Try again
        </button>
      }
    >
      {error?.message}
    </EmptyState>
  )
}
