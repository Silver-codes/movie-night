import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { posterUrl } from '../api/images'
import type { Movie, PickCandidate } from '../api/types'
import { shortTitles } from '../lib/wheel'
import { PEOPLE } from '../people'
import { ChevronDownIcon } from './NavIcons'
import { PickWinner } from './PickWinner'
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

/** "9 hype" on a plinth or list row; the number is the two people's stars added up. */
function HypeCount({ value }: { value: number }) {
  return (
    <>
      {value} <span className="font-medium opacity-80">hype</span>
    </>
  )
}

/**
 * Ranked podium with tonight's pick beside it (below it on phones): the same winner card as the wheels.
 * The rest of the ranking folds away under the podium, so the stage fits a laptop screen.
 * The backend's winner is always #1, even among ties.
 */
export function TopRatedPodium({ candidates, winner, actions }: Props) {
  const reduceMotion = useReducedMotion()

  // The winner should always be among the candidates; if not, still show it first (it's what gets picked).
  const winnerCandidate = candidates.find((c) => c.movie.id === winner.id) ?? { movie: winner, weight: 0, probability: 1 }
  const ranked = [winnerCandidate, ...candidates.filter((c) => c !== winnerCandidate)]
  const tiedCount = candidates.filter((c) => c.probability > 0).length
  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3, LIST_LIMIT)
  // A series loses its shared start here too, so the podium reads "Goblet of Fire", not "Harry Potter and the Gobl…".
  const titles = shortTitles(ranked.map((c) => c.movie.title))

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
      <div className="flex min-w-0 flex-col gap-5">
        {/* Never taller than the window: #1's poster is about half the podium's width, the rest ~22.5rem. */}
        {/* Two places: two of the three columns, centered, so each place keeps its size. */}
        <ol
          className={`mx-auto grid items-end gap-3 sm:gap-5 ${
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
                  <p
                    title={candidate.movie.title}
                    className={`line-clamp-2 leading-snug font-semibold ${first ? 'text-base lg:text-xl' : 'text-sm lg:text-lg'}`}
                  >
                    {titles[i]}
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
                  <span className={`text-xs font-semibold lg:text-base ${first ? 'text-fg/80' : 'text-muted'}`}>
                    <HypeCount value={candidate.movie.hype_total} />
                  </span>
                </div>
              </motion.li>
            )
          })}
        </ol>

        {rest.length > 0 && (
          <details className="group rounded-2xl bg-ink-900/60 ring-1 ring-ink-700">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:text-fg lg:text-lg [&::-webkit-details-marker]:hidden">
              {rest.length} more in the hat
              <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180 lg:size-5" />
            </summary>
            <ol start={4} className="flex flex-col divide-y divide-ink-800 border-t border-ink-800">
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
                  <span title={candidate.movie.title} className="min-w-0 flex-1 truncate font-medium">
                    {titles[i + 3]}
                  </span>
                  <span className="text-sm font-semibold text-muted lg:text-lg">
                    <HypeCount value={candidate.movie.hype_total} />
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>

      <PickWinner
        key={winner.id}
        movie={winner}
        method="top_rated"
        actions={actions}
        delay={PODIUM_LANDED_MS / 1000}
        scrollIntoView={false}
        note={tiedCount > 1 ? `${tiedCount} movies were tied at the top. A coin flip chose this one.` : undefined}
      />
    </div>
  )
}
