import { motion, useReducedMotion } from 'motion/react'
import { posterUrl } from '../api/images'
import type { Movie, PickCandidate } from '../api/types'
import { PEOPLE } from '../people'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  /** Ranked by hype total (the backend's order). */
  candidates: PickCandidate[]
  winner: Movie
  onPick: () => void
}

const LIST_LIMIT = 10

// Podium places, drawn 2nd · 1st · 3rd.
const PLACES = [
  { order: 'order-2', plinth: 'h-20', delay: 0.75 },
  { order: 'order-1', plinth: 'h-14', delay: 0.15 },
  { order: 'order-3', plinth: 'h-10', delay: 0.35 },
] as const

/** Ranked podium + short list. The backend's winner is always #1, even among ties. */
export function TopRatedPodium({ candidates, winner, onPick }: Props) {
  const reduceMotion = useReducedMotion()
  // The winner should always be among the candidates; if not, still show it first (it's what gets picked).
  const winnerCandidate = candidates.find((c) => c.movie.id === winner.id) ?? { movie: winner, weight: 0, probability: 1 }
  const ranked = [winnerCandidate, ...candidates.filter((c) => c !== winnerCandidate)]
  const tiedCount = candidates.filter((c) => c.probability > 0).length
  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3, LIST_LIMIT)

  return (
    <div className="flex flex-col gap-8">
      <ol className="grid grid-cols-3 items-end gap-3 sm:gap-6">
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
                className={`relative w-full ${first ? 'rounded-xl shadow-[0_0_60px_-12px_var(--color-accent)]' : 'sm:px-4'}`}
              >
                <PosterImage
                  src={posterUrl(candidate.movie.poster_path)}
                  title={candidate.movie.title}
                  decorative
                  className={first ? 'ring-2 ring-accent' : ''}
                />
                {tied && (
                  <span className="absolute top-2 left-2 rounded-full bg-ink-950/85 px-2 py-0.5 text-xs font-semibold text-muted backdrop-blur">
                    tied
                  </span>
                )}
              </div>
              <div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
                <h3 className={`line-clamp-2 font-sans leading-snug font-semibold ${first ? 'text-base' : 'text-sm'}`}>
                  {candidate.movie.title}
                </h3>
                <div className="hidden flex-col items-center gap-1 sm:flex">
                  {PEOPLE.map((person) => (
                    <StarDisplay
                      key={person.id}
                      person={person.id}
                      value={person.id === 'fuf' ? candidate.movie.fuf_hype : candidate.movie.cookie_hype}
                    />
                  ))}
                </div>
              </div>
              <div
                className={`flex w-full flex-col items-center justify-center rounded-t-xl ${place.plinth} ${
                  first ? 'bg-accent text-ink-950' : 'bg-ink-800 text-fg ring-1 ring-ink-700'
                }`}
              >
                <span className="font-display text-2xl leading-none font-bold">{i + 1}</span>
                <span className={`text-xs font-semibold ${first ? 'text-ink-950/70' : 'text-muted'}`}>
                  {candidate.movie.hype_total} ★
                </span>
              </div>
            </motion.li>
          )
        })}
      </ol>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex flex-col items-center gap-2"
      >
        <button
          type="button"
          onClick={onPick}
          className="rounded-xl bg-accent px-8 py-3.5 text-lg font-semibold text-ink-950 shadow-lg shadow-accent/20 transition hover:bg-accent-strong"
        >
          Pick {winner.title}
        </button>
        {tiedCount > 1 && (
          <p className="text-sm text-muted">{tiedCount} movies were tied at the top. A coin flip chose this one.</p>
        )}
      </motion.div>

      {rest.length > 0 && (
        <ol start={4} className="flex flex-col divide-y divide-ink-800 rounded-2xl bg-ink-900/60 ring-1 ring-ink-700">
          {rest.map((candidate, i) => (
            <li key={candidate.movie.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 text-right font-display font-semibold text-muted">{i + 4}</span>
              <PosterImage
                src={posterUrl(candidate.movie.poster_path, 'w185')}
                title={candidate.movie.title}
                decorative
                compact
                className="w-9 shrink-0 rounded-md!"
              />
              <span className="min-w-0 flex-1 truncate font-medium">{candidate.movie.title}</span>
              <span className="text-sm font-semibold text-muted">{candidate.movie.hype_total} ★</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
