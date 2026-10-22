import { Link } from 'react-router'
import { posterUrl } from '../api/images'
import { useCancelPick, useRestorePick } from '../api/movieHooks'
import type { Movie } from '../api/types'
import { pickMethodLabel } from '../lib/pickMethods'
import { toast } from '../lib/toast'
import { PosterImage } from './PosterImage'

type Props = {
  movie: Movie
  /** Picked tonight: "Tonight's pick", or in a double feature its place in the evening ("1st feature"). */
  tonightTag?: string
}

/**
 * "You picked X, rate it after watching": for a confirmed pick that's still on the watchlist. The row opens the
 * movie to rate it. The button takes the pick back instead, and the movie stays on the watchlist: "Take it back"
 * for tonight's (they changed their minds), "Didn't watch it" for an older one.
 */
export function RateReminder({ movie, tonightTag }: Props) {
  const tonight = tonightTag !== undefined
  const cancelPick = useCancelPick()
  const restorePick = useRestorePick()

  // mutateAsync: the row is gone once the pick is, so its own callbacks wouldn't run. Failures show the global toast.
  function takeBack() {
    cancelPick
      .mutateAsync(movie.id)
      .then(() =>
        toast.info(tonight ? `${movie.title} isn't tonight's pick anymore` : `${movie.title} stays on the watchlist`, {
          action: { label: 'Undo', onClick: undo },
        }),
      )
      .catch(() => {})
  }

  /** The pick comes back as it was, and with it this row. */
  function undo() {
    restorePick
      .mutateAsync(movie.id)
      .then(() =>
        toast.success(tonight ? `${movie.title} is tonight's pick again` : `${movie.title} is waiting for your verdict`),
      )
      .catch(() => {})
  }

  return (
    // The link is stretched over the row (its ::after), so the whole row opens the movie; the button sits above it.
    <div className="group relative flex items-center gap-3 rounded-2xl bg-ink-900 p-3 pr-4 ring-1 ring-ink-700 outline-offset-2 outline-accent transition has-[a:focus-visible]:outline-2 has-[a:hover]:bg-ink-800 has-[a:hover]:ring-ink-600">
      <PosterImage src={posterUrl(movie.poster_path, 'w185')} title={movie.title} decorative compact className="w-10 shrink-0 rounded-md!" />
      <span className="min-w-0 flex-1">
        {/* One line everywhere: on phones the reminder must stay a slim row, so the filters keep the first screen
            (the poster names the movie too). */}
        <Link
          to={`/watchlist?movie=${movie.id}`}
          title={movie.title}
          aria-label={`Rate ${movie.title}${tonight ? `, ${tonightTag}` : ''}`}
          className="block truncate leading-snug font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          {movie.title}
        </Link>
        <span className="block truncate text-sm text-muted">
          {tonight ? (
            <span className="font-medium text-fg/85">{tonightTag}</span>
          ) : (
            movie.confirmed_pick_method && (
              <span className="hidden sm:inline">{pickMethodLabel(movie.confirmed_pick_method)} pick · </span>
            )
          )}
          {/* Phones: tonight's row says just that (the whole row opens the movie to rate it). */}
          <span className={tonight ? 'hidden sm:inline' : undefined}>{tonight && ' · '}Rate it after watching</span>
        </span>
      </span>
      {/* Phones: the row itself says "Rate it after watching" and opens the movie, so only the take-back sits here. */}
      <span className="flex shrink-0 items-center gap-5 sm:flex-row-reverse">
        <span
          aria-hidden="true"
          className="hidden text-sm font-semibold text-muted transition group-has-[a:hover]:text-fg sm:inline"
        >
          Rate →
        </span>
        <button
          type="button"
          onClick={takeBack}
          disabled={cancelPick.isPending}
          aria-label={tonight ? `Take back ${movie.title}` : `Didn't watch ${movie.title}`}
          // A thumb-sized target on phones without making the row taller.
          className="relative z-10 -my-3 rounded-lg py-3 text-sm sm:-my-1.5 sm:py-1.5 text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60"
        >
          {cancelPick.isPending ? (tonight ? 'Taking back…' : 'Removing…') : tonight ? 'Take it back' : "Didn't watch it"}
        </button>
      </span>
    </div>
  )
}
