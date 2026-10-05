import { motion } from 'motion/react'
import { posterUrl } from '../api/images'
import type { Movie } from '../api/types'
import { PEOPLE } from '../people'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  movie: Movie
  onOpen: (movie: Movie) => void
}

/** Watchlist poster with both people's hype stars and the total; opens the detail drawer. */
export function WatchlistCard({ movie, onOpen }: Props) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
    >
      <motion.button
        type="button"
        onClick={() => onOpen(movie)}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="group flex w-full flex-col gap-2.5 rounded-xl text-left"
      >
        <div className="relative w-full">
          <PosterImage
            src={posterUrl(movie.poster_path)}
            title={movie.title}
            className={`shadow-lg shadow-black/40 transition group-hover:shadow-xl group-hover:shadow-black/60 ${movie.skipped_tonight ? 'opacity-50 grayscale' : ''}`}
          />
          <span
            title="Hype total"
            className="absolute top-2 right-2 inline-flex min-w-8 items-center justify-center gap-0.5 rounded-full bg-ink-950/85 px-2 py-0.5 text-sm font-bold text-fg ring-1 ring-white/10 backdrop-blur"
          >
            <span className="sr-only">Hype total </span>
            {movie.hype_total}
            <span aria-hidden="true" className="text-xs text-accent">
              ★
            </span>
          </span>
          {movie.skipped_tonight && (
            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-ink-950/85 py-1 text-center text-xs font-semibold text-muted backdrop-blur">
              Not tonight
            </span>
          )}
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <h3 className="line-clamp-2 font-sans text-sm leading-snug font-semibold">
            {movie.title}
            {movie.year && <span className="font-normal text-muted"> ({movie.year})</span>}
          </h3>
          {PEOPLE.map((person) => (
            <StarDisplay
              key={person.id}
              person={person.id}
              value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
            />
          ))}
        </div>
      </motion.button>
    </motion.li>
  )
}
