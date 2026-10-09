import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { posterUrl } from '../api/images'
import type { Movie, PickCandidate } from '../api/types'
import { formatRuntime } from '../lib/format'
import { PEOPLE } from '../people'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  /** Ranked by hype total (the backend's order). */
  candidates: PickCandidate[]
  winner: Movie
  /** What to do with #1 (`PickActions`): the podium is where Top Rated is decided. */
  actions: ReactNode
}

const LIST_LIMIT = 10

// Podium places, drawn 2nd · 1st · 3rd.
const PLACES = [
  { order: 'order-2', plinth: 'h-20 lg:h-28', delay: 0.75 },
  { order: 'order-1', plinth: 'h-14 lg:h-22', delay: 0.15 },
  { order: 'order-3', plinth: 'h-10 lg:h-18', delay: 0.35 },
] as const

/** When #1 has sprung onto the podium (its delay + the spring settling); the decision appears then. */
export const PODIUM_LANDED_MS = 1000

/**
 * Ranked podium with the decision beside it (below it on phones), then a short list.
 * The backend's winner is always #1, even among ties.
 */
export function TopRatedPodium({ candidates, winner, actions }: Props) {
  const reduceMotion = useReducedMotion()
  const heading = useRef<HTMLHeadingElement>(null)
  const meta = [winner.year, formatRuntime(winner.runtime), ...winner.genres].filter(Boolean).join(' · ')

  // The button that started the pick is gone; the winner's title is where to continue from.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [winner.id])

  // The winner should always be among the candidates; if not, still show it first (it's what gets picked).
  const winnerCandidate = candidates.find((c) => c.movie.id === winner.id) ?? { movie: winner, weight: 0, probability: 1 }
  const ranked = [winnerCandidate, ...candidates.filter((c) => c !== winnerCandidate)]
  const tiedCount = candidates.filter((c) => c.probability > 0).length
  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3, LIST_LIMIT)

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-12">
        {/* Never taller than the window: #1's poster is about half the podium's width, the rest ~22.5rem. */}
        {/* Two places: two of the three columns, centered, so each place keeps its size. */}
        <ol
          className={`mx-auto grid items-end gap-3 sm:gap-6 ${
            podium.length === 2
              ? 'w-2/3 grid-cols-2 lg:max-w-[calc((200dvh-45rem)*2/3)]'
              : 'w-full grid-cols-3 lg:max-w-[calc(200dvh-45rem)]'
          }`}
        >
          {podium.map((candidate, i) => {
            const place = PLACES[i]
            const first = i === 0
            const tied = candidate.probability > 0 && tiedCount > 1
            return (
              <motion.li
                key={candidate.movie.id}
                initial={reduceMotion ? false : { opacity: 0, y: 30, scale: first ? 0.85 : 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: first ? 180 : 260, damping: first ? 14 : 24, delay: place.delay }}
                className={`flex min-w-0 flex-col items-center gap-2 ${place.order} ${podium.length === 1 ? 'col-start-2' : ''}`}
              >
                <div
                  className={`relative w-full ${first ? 'rounded-xl shadow-xl shadow-black/60' : 'sm:px-4'}`}
                >
                  <PosterImage
                    src={posterUrl(candidate.movie.poster_path)}
                    title={candidate.movie.title}
                    decorative
                    // The winner is the one blue thing on the podium (`!`: PosterImage sets its own faint ring).
                    className={first ? 'ring-2 ring-accent!' : ''}
                  />
                  {tied && (
                    <span className="absolute top-2 left-2 rounded-full bg-ink-950/85 px-2 py-0.5 text-xs font-semibold text-muted backdrop-blur lg:px-2.5 lg:text-sm">
                      tied
                    </span>
                  )}
                </div>
                <div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
                  <p className={`line-clamp-2 leading-snug font-semibold ${first ? 'text-base lg:text-xl' : 'text-sm lg:text-lg'}`}>
                    {candidate.movie.title}
                  </p>
                  <div className="hidden flex-col items-center gap-1 sm:flex lg:gap-1.5">
                    {PEOPLE.map((person) => (
                      <StarDisplay
                        key={person.id}
                        person={person.id}
                        value={person.id === 'fuf' ? candidate.movie.fuf_hype : candidate.movie.cookie_hype}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
                <div
                  className={`flex w-full flex-col items-center justify-center rounded-t-xl ${place.plinth} ${
                    first ? 'bg-ink-600 text-fg ring-1 ring-ink-600' : 'bg-ink-800 text-fg ring-1 ring-ink-700'
                  }`}
                >
                  <span className="font-display text-2xl leading-none font-bold lg:text-4xl">{i + 1}</span>
                  <span className={`text-xs font-semibold lg:text-base ${first ? 'text-fg/75' : 'text-muted'}`}>
                    {candidate.movie.hype_total} <span aria-hidden="true">★</span>
                    <span className="sr-only">hype</span>
                  </span>
                </div>
              </motion.li>
            )
          })}
        </ol>

        <motion.section
          aria-label="Tonight's pick"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: reduceMotion ? 0 : PODIUM_LANDED_MS / 1000 }}
          className="flex flex-col gap-5 lg:gap-6 lg:pb-1"
        >
          <div>
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-3xl leading-tight font-semibold tracking-tight text-balance break-words outline-none sm:text-4xl xl:text-5xl xl:leading-[1.1]"
            >
              {winner.title}
            </h2>
            {meta && <p className="mt-2 text-muted lg:text-xl">{meta}</p>}
          </div>
          <p className="text-sm text-muted lg:text-lg">
            Hype total <span className="font-bold text-fg">{winner.hype_total}</span>
            {tiedCount > 1 && <> · {tiedCount} movies were tied at the top. A coin flip chose this one.</>}
          </p>
          {actions}
        </motion.section>
      </div>

      {rest.length > 0 && (
        <ol start={4} className="flex flex-col divide-y divide-ink-800 rounded-2xl bg-ink-900/60 ring-1 ring-ink-700">
          {rest.map((candidate, i) => (
            <li key={candidate.movie.id} className="flex items-center gap-3 px-4 py-2.5 lg:gap-4 lg:py-3 lg:text-lg">
              <span className="w-6 text-right font-display font-semibold text-muted">{i + 4}</span>
              <PosterImage
                src={posterUrl(candidate.movie.poster_path, 'w185')}
                title={candidate.movie.title}
                decorative
                compact
                className="w-9 shrink-0 rounded-md! lg:w-11"
              />
              <span className="min-w-0 flex-1 truncate font-medium">{candidate.movie.title}</span>
              <span className="text-sm font-semibold text-muted lg:text-lg">
                {candidate.movie.hype_total} <span aria-hidden="true">★</span>
                <span className="sr-only">hype</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
