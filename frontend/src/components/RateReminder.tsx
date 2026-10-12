import { Link } from 'react-router'
import { posterUrl } from '../api/images'
import { useCancelPick } from '../api/movieHooks'
import type { Movie } from '../api/types'
import { pickMethodLabel } from '../lib/pickMethods'
import { toast } from '../lib/toast'
import { PosterImage } from './PosterImage'

/**
 * "You picked X, rate it after watching": for a confirmed pick that's still on the watchlist. The row opens the
 * movie to rate it; "Didn't watch it" takes the pick back instead, and the movie stays on the watchlist.
 */
export function RateReminder({ movie }: { movie: Movie }) {
  const cancelPick = useCancelPick()

  // mutateAsync: the row is gone once the pick is, so its own callbacks wouldn't run. Failures show the global toast.
  function didntWatch() {
    cancelPick
      .mutateAsync(movie.id)
      .then(() => toast.info(`${movie.title} stays on the watchlist`))
      .catch(() => {})
  }

  return (
    // The link is stretched over the row (its ::after), so the whole row opens the movie; the button sits above it.
    <div className="group relative flex items-center gap-3 rounded-2xl bg-ink-900 p-3 pr-4 ring-1 ring-ink-700 outline-offset-2 outline-accent transition has-[a:focus-visible]:outline-2 has-[a:hover]:bg-ink-800 has-[a:hover]:ring-ink-600">
      <PosterImage src={posterUrl(movie.poster_path, 'w185')} title={movie.title} decorative compact className="w-10 shrink-0 rounded-md!" />
      <span className="min-w-0 flex-1">
        <Link
          to={`/watchlist?movie=${movie.id}`}
          // Phones: two lines, since the actions beside it take room; one line from sm.
          className="line-clamp-2 leading-snug font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl sm:line-clamp-1"
        >
          {movie.title}
        </Link>
        <span className="block text-sm text-muted">
          {movie.confirmed_pick_method && `${pickMethodLabel(movie.confirmed_pick_method)} pick · `}
          Rate it after watching
        </span>
      </span>
      {/* Phones: stacked, so the title keeps its room. */}
      <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row-reverse sm:items-center sm:gap-5">
        <span aria-hidden="true" className="text-sm font-semibold text-muted transition group-has-[a:hover]:text-fg">
          Rate →
        </span>
        <button
          type="button"
          onClick={didntWatch}
          disabled={cancelPick.isPending}
          aria-label={`Didn't watch ${movie.title}`}
          className="relative z-10 -my-1.5 rounded-lg py-1.5 text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60"
        >
          {cancelPick.isPending ? 'Removing…' : "Didn't watch it"}
        </button>
      </span>
    </div>
  )
}
