import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { posterUrl } from '../api/images'
import type { Movie, PickMethod } from '../api/types'
import { formatRuntime } from '../lib/format'
import { pickMethodLabel } from '../lib/pickMethods'
import { PEOPLE } from '../people'
import { BackdropImage } from './BackdropImage'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  movie: Movie
  method: PickMethod
  /** What to do next (`PickActions`). */
  actions: ReactNode
}

/** The wheel's winner: big backdrop, info, both hype stars and what to do next. */
export function PickWinner({ movie, method, actions }: Props) {
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
      {/* On laptops/TVs the backdrop is capped, so the title and the actions stay on screen. */}
      <div className="relative aspect-video w-full bg-ink-800 lg:aspect-auto lg:h-[min(24rem,30dvh)]">
        <BackdropImage movie={movie} />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/50 to-transparent" />
        <p className="absolute top-4 left-4 rounded-full bg-ink-950/80 px-3 py-1 text-xs font-semibold tracking-wide text-fg/80 uppercase backdrop-blur lg:top-5 lg:left-5 lg:px-4 lg:py-1.5 lg:text-sm">
          {pickMethodLabel(method)} picked
        </p>
      </div>

      <div className="relative -mt-24 flex flex-col gap-5 px-5 pb-5 sm:px-6 sm:pb-6 lg:-mt-32 lg:gap-6 lg:px-8 lg:pb-8">
        <header className="flex items-end gap-4">
          <PosterImage
            src={posterUrl(movie.poster_path, 'w185')}
            title={movie.title}
            decorative
            className="w-24 shrink-0 shadow-xl shadow-black/60 sm:w-28 lg:w-32 xl:w-36"
          />
          <div className="min-w-0 pb-1">
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-3xl leading-tight font-semibold tracking-tight text-balance break-words outline-none sm:text-4xl xl:text-5xl xl:leading-[1.1]"
            >
              {movie.title}
            </h2>
            {meta && <p className="mt-1 text-muted lg:mt-2 lg:text-xl">{meta}</p>}
          </div>
        </header>

        {movie.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
            {movie.genres.map((genre) => (
              <li key={genre} className="rounded-full bg-ink-800 px-2.5 py-1 text-xs text-muted ring-1 ring-ink-700 lg:px-3.5 lg:py-1.5 lg:text-base">
                {genre}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:gap-x-8">
          {PEOPLE.map((person) => (
            <StarDisplay
              key={person.id}
              person={person.id}
              value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
              size="lg"
            />
          ))}
          <span className="text-sm text-muted lg:text-lg">
            Hype total <span className="font-bold text-fg">{movie.hype_total}</span>
          </span>
        </div>

        {actions}
      </div>
    </motion.section>
  )
}
