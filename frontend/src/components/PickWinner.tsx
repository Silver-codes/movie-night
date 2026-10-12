import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { posterUrl } from '../api/images'
import type { Movie } from '../api/types'
import { formatRuntime } from '../lib/format'
import { PEOPLE } from '../people'
import { BackdropImage } from './BackdropImage'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  movie: Movie
  /** What to do next (`PickActions`). */
  actions: ReactNode
  /** Seconds before the card springs in (the podium lets #1 land first). */
  delay?: number
  /** Below `lg` the card sits under the wheel and scrolls into view; the podium is its own reveal, so it opts out. */
  scrollIntoView?: boolean
  /** Moves focus to the title when the card appears; off when they swap places on Top Rated (focus stays there). */
  takeFocus?: boolean
  /** Confirmed ("We're watching this!"): the screen comes alive, the backdrop slowly brightens and pushes in. */
  spotlight?: boolean
  /** Top Rated: #1's poster is right there on the podium, so the card leaves its own out. */
  showPoster?: boolean
  /** A line under the hype, e.g. how a tie was settled. */
  note?: ReactNode
}

/** Phones: how long the landed wheel stays in view before the winner card scrolls up. */
const LANDED_PAUSE_MS = 1200
const LANDED_PAUSE_REDUCED_MS = 600

/** "9 hype together", or "so far" while one of them hasn't rated it: the plain-words version of `hype_total`. */
function hypeSummary(movie: Movie): ReactNode {
  const rated = [movie.fuf_hype, movie.cookie_hype].filter((v) => v !== null).length
  if (rated === 0) {
    return 'No hype yet'
  }
  return (
    <>
      <span className="font-bold text-fg">{movie.hype_total}</span> hype {rated === 2 ? 'together' : 'so far'}
    </>
  )
}

/** Tonight's pick (wheels and Top Rated): big backdrop, info, both hype stars and what to do next. */
export function PickWinner({
  movie,
  actions,
  delay = 0,
  scrollIntoView = true,
  takeFocus = true,
  spotlight = false,
  showPoster = true,
  note,
}: Props) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const meta = [movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(' · ')

  // Move focus to the winner (the button that started the pick is gone or disabled by now). Below `lg` the
  // winner sits under the wheel, so bring it into view; on laptops/TVs it's already beside the wheel, and
  // scrolling would push the wheel's top under the nav.
  // The scroll waits a moment, so the landed (blue) slice and the confetti are seen before the wheel goes up.
  useEffect(() => {
    if (takeFocus) {
      heading.current?.focus({ preventScroll: true })
    }
    if (!scrollIntoView || window.matchMedia('(min-width: 64rem)').matches) {
      return
    }
    const timer = window.setTimeout(
      () => ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }),
      reduceMotion ? LANDED_PAUSE_REDUCED_MS : LANDED_PAUSE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [movie.id, reduceMotion, scrollIntoView, takeFocus])

  return (
    <motion.section
      ref={ref}
      aria-label="Tonight's pick"
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, delay: reduceMotion ? 0 : delay }}
      className="scroll-mb-24 overflow-hidden rounded-3xl bg-ink-900 ring-1 ring-ink-700"
    >
      {/* On laptops/TVs the backdrop is capped, so the title and the actions stay on screen. */}
      <div className="relative aspect-video w-full overflow-hidden bg-ink-800 lg:aspect-auto lg:h-[min(24rem,26dvh)] lg:[@media(max-height:56rem)]:h-[22dvh]">
        <div
          className={`absolute inset-0 transition-[filter,scale] duration-[1600ms] ease-out motion-reduce:transition-none ${
            spotlight ? 'scale-[1.04] brightness-[1.2]' : ''
          }`}
        >
          <BackdropImage movie={movie} />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/50 to-transparent" />
      </div>

      <div className="relative -mt-24 flex flex-col gap-5 px-5 pb-5 sm:px-6 sm:pb-6 lg:-mt-32 lg:gap-6 lg:px-8 lg:pb-8">
        <header className="flex items-end gap-4">
          {showPoster && (
            <PosterImage
              src={posterUrl(movie.poster_path, 'w185')}
              title={movie.title}
              decorative
              className="w-24 shrink-0 shadow-xl shadow-black/60 sm:w-28 lg:w-32 xl:w-36"
            />
          )}
          <div className="min-w-0 pb-1">
            <h2
              ref={heading}
              tabIndex={-1}
              // The biggest size only on tall screens: on a 1280×800 laptop it wraps to a third line and pushes
              // the actions below the window.
              className="text-3xl leading-tight font-semibold tracking-tight text-balance break-words outline-none sm:text-4xl xl:[@media(min-height:56rem)]:text-5xl xl:[@media(min-height:56rem)]:leading-[1.1]"
            >
              {movie.title}
            </h2>
            {meta && (
              <p className="mt-1 text-muted lg:mt-2 lg:text-xl">
                {meta}
                {/* Short laptop screens: the genres join this line, so the card fits the window. */}
                {movie.genres.length > 0 && (
                  <span className="hidden lg:[@media(max-height:56rem)]:inline"> · {movie.genres.join(' · ')}</span>
                )}
              </p>
            )}
          </div>
        </header>

        {movie.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 lg:[@media(max-height:56rem)]:hidden" aria-label="Genres">
            {movie.genres.map((genre) => (
              <li key={genre} className="rounded-full bg-ink-800 px-2.5 py-1 text-xs text-muted ring-1 ring-ink-700 lg:px-3.5 lg:py-1.5 lg:text-base">
                {genre}
              </li>
            ))}
          </ul>
        )}

        {/* Once decided (spotlight), the hype steps back: the debate is over, and the news below must fit the
            window with the wheel or podium (on phones, the screen above the tab bar). */}
        <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 lg:gap-x-8 ${spotlight ? 'hidden' : ''}`}>
          {PEOPLE.map((person) => (
            <StarDisplay
              key={person.id}
              person={person.id}
              value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
              size="lg"
            />
          ))}
          <span className="text-sm text-muted lg:text-lg">{hypeSummary(movie)}</span>
        </div>

        {note && <p className={`-mt-2 text-sm text-muted lg:-mt-3 lg:text-lg ${spotlight ? 'hidden' : ''}`}>{note}</p>}

        {actions}
      </div>
    </motion.section>
  )
}
