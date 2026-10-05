import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { posterUrl } from '../api/images'
import type { Movie, PickMethod } from '../api/types'
import { formatRuntime } from '../lib/format'
import { pickMethodLabel } from '../lib/pickMethods'
import { PEOPLE } from '../people'
import { CheckIcon } from './NavIcons'
import { BackdropImage } from './BackdropImage'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  movie: Movie
  method: PickMethod
  confirmed: boolean
  confirming: boolean
  onConfirm: () => void
  /** "Spin again" for the wheels, "Back" for top rated. */
  againLabel: string
  onAgain: () => void
  /** Puts the winner on "not tonight" and picks again. */
  onNotTonight: () => void
  busy: boolean
}

/** The winner: big backdrop, info, both hype stars and what to do next. */
export function PickWinner({
  movie,
  method,
  confirmed,
  confirming,
  onConfirm,
  againLabel,
  onAgain,
  onNotTonight,
  busy,
}: Props) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const meta = [movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(' · ')

  // On phones the wheel fills the screen; bring the winner into view and move focus to it
  // (the button that started the pick is gone or disabled by now).
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
  }, [movie.id, reduceMotion])

  return (
    <motion.section
      ref={ref}
      aria-label="Tonight's pick"
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className="scroll-mb-24 overflow-hidden rounded-3xl bg-ink-900 ring-1 ring-ink-700"
    >
      <div className="relative aspect-video w-full bg-ink-800">
        <BackdropImage movie={movie} />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/50 to-transparent" />
        <p className="absolute top-4 left-4 rounded-full bg-ink-950/80 px-3 py-1 text-xs font-semibold tracking-wide text-accent uppercase backdrop-blur">
          {pickMethodLabel(method)} picked
        </p>
      </div>

      <div className="relative -mt-24 flex flex-col gap-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <header className="flex items-end gap-4">
          <PosterImage
            src={posterUrl(movie.poster_path, 'w185')}
            title={movie.title}
            decorative
            className="w-24 shrink-0 shadow-xl shadow-black/60 sm:w-28"
          />
          <div className="min-w-0 pb-1">
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-3xl leading-tight font-semibold tracking-tight break-words outline-none sm:text-4xl"
            >
              {movie.title}
            </h2>
            {meta && <p className="mt-1 text-muted">{meta}</p>}
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

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {PEOPLE.map((person) => (
            <StarDisplay
              key={person.id}
              person={person.id}
              value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
            />
          ))}
          <span className="text-sm text-muted">
            Hype total <span className="font-bold text-fg">{movie.hype_total}</span>
          </span>
        </div>

        {confirmed ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-accent-soft p-4 ring-1 ring-accent/40">
            <p className="flex items-center gap-2 font-semibold text-accent">
              <CheckIcon className="size-5" />
              Enjoy the movie! 🍿
            </p>
            <p className="text-sm text-fg/85">When it's over, rate it from the watchlist so it lands in your history.</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/watchlist?movie=${movie.id}`}
                className="rounded-xl bg-accent px-4 py-2.5 font-semibold text-ink-950 transition hover:bg-accent-strong"
              >
                Rate it after watching
              </Link>
              <button
                type="button"
                onClick={onAgain}
                className="rounded-xl px-4 py-2.5 font-semibold text-muted ring-1 ring-ink-600 transition hover:text-fg"
              >
                Pick something else
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 rounded-xl bg-accent px-5 py-3.5 text-lg font-semibold text-ink-950 shadow-lg shadow-accent/20 transition hover:bg-accent-strong disabled:opacity-60"
              >
                {confirming ? 'Saving…' : "We're watching this!"}
              </button>
              <button
                type="button"
                onClick={onAgain}
                disabled={busy}
                className="rounded-xl px-5 py-3.5 font-semibold ring-1 ring-ink-600 transition hover:bg-ink-800 disabled:opacity-60"
              >
                {againLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={onNotTonight}
              disabled={busy}
              className="self-center text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60"
            >
              Not tonight. Leave it out and pick again
            </button>
          </div>
        )}
      </div>
    </motion.section>
  )
}
