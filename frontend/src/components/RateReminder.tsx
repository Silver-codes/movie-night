import { Link } from 'react-router'
import { posterUrl } from '../api/images'
import type { Movie } from '../api/types'
import { pickMethodLabel } from '../lib/pickMethods'
import { PosterImage } from './PosterImage'

/** "You picked X, rate it after watching": for a confirmed pick that's still on the watchlist. */
export function RateReminder({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/watchlist?movie=${movie.id}`}
      className="group flex items-center gap-3 rounded-2xl bg-accent-soft p-3 pr-4 ring-1 ring-accent/40 transition hover:ring-accent"
    >
      <PosterImage src={posterUrl(movie.poster_path, 'w185')} title={movie.title} className="w-10 shrink-0 rounded-md!" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{movie.title}</span>
        <span className="block text-sm text-muted">
          {movie.confirmed_pick_method && `${pickMethodLabel(movie.confirmed_pick_method)} pick · `}
          Rate it after watching
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-accent group-hover:text-accent-strong">Rate →</span>
    </Link>
  )
}
