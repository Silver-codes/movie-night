import { useEffect, useState } from 'react'
import { backdropUrl, posterUrl } from '../api/images'
import { useDeleteMovie, useMarkWatched, useUpdateMovie } from '../api/movieHooks'
import type { Movie } from '../api/types'
import { formatRuntime } from '../lib/format'
import { toast } from '../lib/toast'
import { PEOPLE } from '../people'
import { PosterImage } from './PosterImage'
import { RatingBadge } from './RatingBadge'
import { StarRating } from './StarRating'

type Props = {
  movie: Movie
  /** Called once the movie has left the watchlist (watched or removed). */
  onDone: () => void
}

/** Drawer content for a watchlist movie: backdrop, info, editable hype stars and actions. */
export function MovieDetails({ movie, onDone }: Props) {
  const update = useUpdateMovie()
  const watched = useMarkWatched()
  const remove = useDeleteMovie()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const backdrop = backdropUrl(movie.backdrop_path)
  const runtime = formatRuntime(movie.runtime)

  // "Remove" needs a second tap within a few seconds.
  useEffect(() => {
    if (!confirmRemove) {
      return
    }
    const timer = setTimeout(() => setConfirmRemove(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmRemove])

  function onMarkWatched() {
    watched.mutate(
      { id: movie.id },
      {
        onSuccess: () => {
          toast.success(`${movie.title} marked as watched`)
          onDone()
        },
      },
    )
  }

  function onRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true)
      return
    }
    remove.mutate(movie.id, {
      onSuccess: () => {
        toast.info(`${movie.title} removed`)
        onDone()
      },
    })
  }

  const busy = watched.isPending || remove.isPending

  return (
    <article>
      <div className="relative aspect-video w-full bg-ink-800">
        {backdrop && <img src={backdrop} alt="" className="size-full object-cover" />}
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/40 to-transparent" />
      </div>

      <div className="relative -mt-20 flex flex-col gap-6 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
        <header className="flex items-end gap-4">
          <PosterImage
            src={posterUrl(movie.poster_path, 'w185')}
            title={movie.title}
            className="w-24 shrink-0 shadow-xl shadow-black/60"
          />
          <div className="min-w-0 pb-1">
            <h2 className="text-2xl leading-tight font-semibold">{movie.title}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {[movie.year, runtime].filter(Boolean).join(' · ')}
              <RatingBadge rating={movie.tmdb_rating} />
            </p>
          </div>
        </header>

        {movie.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
            {movie.genres.map((genre) => (
              <li key={genre} className="rounded-full bg-ink-800 px-2.5 py-1 text-xs text-muted ring-1 ring-ink-700">
                {genre}
              </li>
            ))}
          </ul>
        )}

        <section className="flex flex-col gap-3 rounded-2xl bg-ink-950/60 p-4 ring-1 ring-ink-700">
          <div className="flex items-baseline justify-between">
            <h3 className="font-sans text-sm font-semibold tracking-wide text-muted uppercase">Hype</h3>
            <span className="text-sm text-muted">
              Total <span className="text-base font-bold text-fg">{movie.hype_total}</span>
            </span>
          </div>
          {PEOPLE.map((person) => (
            <StarRating
              key={person.id}
              person={person.id}
              value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
              showName
              onChange={(value) =>
                update.mutate({
                  id: movie.id,
                  update: person.id === 'fuf' ? { fuf_hype: value } : { cookie_hype: value },
                })
              }
            />
          ))}
          {(movie.fuf_hype !== null || movie.cookie_hype !== null) && (
            <p className="text-xs text-faint">Tap a star again to clear it.</p>
          )}
        </section>

        {movie.overview && <p className="leading-relaxed text-fg/85">{movie.overview}</p>}

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-ink-800 px-4 py-3 ring-1 ring-ink-700">
            <span>
              <span className="block font-medium">Not tonight</span>
              <span className="block text-sm text-muted">Leave it out of tonight's picks. Resets tomorrow.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={movie.skipped_tonight}
              onChange={(e) => update.mutate({ id: movie.id, update: { skipped_tonight: e.target.checked } })}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative h-6 w-11 shrink-0 rounded-full bg-ink-600 transition peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-fg after:transition peer-checked:after:translate-x-5"
            />
          </label>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onMarkWatched}
              disabled={busy}
              className="flex-1 rounded-xl bg-accent px-4 py-3 font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60"
            >
              {watched.isPending ? 'Saving…' : 'Mark watched'}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className={`rounded-xl px-4 py-3 font-semibold ring-1 transition disabled:opacity-60 ${
                confirmRemove
                  ? 'bg-danger text-ink-950 ring-danger'
                  : 'text-danger ring-ink-600 hover:bg-danger/10 hover:ring-danger'
              }`}
            >
              {confirmRemove ? 'Tap again to remove' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
