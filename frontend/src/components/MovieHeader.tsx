import type { Movie } from '../api/types'
import { formatRuntime } from '../lib/format'
import { BackdropImage } from './BackdropImage'
import { PosterImage } from './PosterImage'
import { RatingBadge } from './RatingBadge'

/**
 * The top of a movie drawer: the backdrop fading into the panel. `images` is null while the details are
 * still loading (a search result has no backdrop yet), which leaves a plain dark area for a moment.
 */
export function MovieBackdrop({ images }: { images: Pick<Movie, 'backdrop_path' | 'poster_path'> | null }) {
  return (
    <div className="relative aspect-video w-full bg-ink-800">
      {images && <BackdropImage movie={images} />}
      <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/40 to-transparent" />
    </div>
  )
}

type HeaderProps = {
  title: string
  /** A full poster URL (saved movies build it from the path, search results come with one). */
  posterSrc: string | null
  year: number | null
  /** Minutes; unknown until a search result's details arrive. */
  runtime: number | null
  rating: number | null
}

/** Poster, title and "year · runtime ★ rating", overlapping the bottom of the backdrop. */
export function MovieHeader({ title, posterSrc, year, runtime, rating }: HeaderProps) {
  return (
    <header className="flex items-end gap-4">
      <PosterImage src={posterSrc} title={title} className="w-24 shrink-0 shadow-xl shadow-black/60" />
      <div className="min-w-0 pb-1">
        <h2 className="text-2xl leading-tight font-semibold break-words">{title}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          {[year, formatRuntime(runtime)].filter(Boolean).join(' · ')}
          <RatingBadge rating={rating} />
        </p>
      </div>
    </header>
  )
}

export function GenreList({ genres }: { genres: string[] }) {
  if (genres.length === 0) {
    return null
  }
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
      {genres.map((genre) => (
        <li key={genre} className="rounded-full bg-ink-800 px-2.5 py-1 text-xs text-muted ring-1 ring-ink-700">
          {genre}
        </li>
      ))}
    </ul>
  )
}
