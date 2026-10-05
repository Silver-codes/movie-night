import { useUpdateMovie } from '../api/movieHooks'
import type { Movie } from '../api/types'
import { toast } from '../lib/toast'

type Props = {
  movie: Movie
  /** Called once it's back on the watchlist (the drawer closes: the movie just left the History timeline). */
  onMoved: () => void
}

/** Puts a watched movie back on the watchlist; its verdicts and notes are kept for the next "Mark watched". */
export function MoveToWatchlistButton({ movie, onMoved }: Props) {
  const update = useUpdateMovie()
  return (
    <button
      type="button"
      disabled={update.isPending}
      onClick={() =>
        // The optimistic update swaps the drawer to the watchlist view and unmounts this button,
        // which would skip a per-call `onSuccess`; the promise resolves regardless. Errors already toast.
        update.mutateAsync({ id: movie.id, update: { status: 'watchlist' } }).then(
          () => {
            toast.info(`${movie.title} is back on the watchlist`)
            onMoved()
          },
          () => {},
        )
      }
      className="rounded-xl px-4 py-3 font-semibold text-fg ring-1 ring-ink-600 transition hover:bg-ink-800 disabled:opacity-60"
    >
      Move back to watchlist
    </button>
  )
}
