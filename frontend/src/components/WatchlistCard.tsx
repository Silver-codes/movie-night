import { motion } from 'motion/react'
import { memo } from 'react'
import { posterUrl } from '../api/images'
import type { Movie } from '../api/types'
import { PEOPLE } from '../people'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  movie: Movie
  /** Should be stable (e.g. `openMovie`), so unchanged cards skip re-rendering. */
  onOpen: (id: number) => void
  /** In the first row: load the poster right away. */
  priority?: boolean
}

/**
 * Watchlist poster with both people's hype stars and the total; opens the detail drawer.
 * The title is the button (so it's named just by the title); its `after:` layer stretches
 * over the whole card, so tapping anywhere opens it.
 */
export const WatchlistCard = memo(function WatchlistCard({ movie, onOpen, priority = false }: Props) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
    >
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        // Press feedback in CSS: Motion's `whileTap` would make the article itself a tab stop.
        // The focus ring goes around the whole card, not just the title.
        className="group relative flex flex-col gap-2.5 rounded-xl outline-offset-4 outline-accent transition-[scale] active:scale-[0.98] has-[:focus-visible]:outline-2"
      >
        <div className="relative w-full">
          <PosterImage
            src={posterUrl(movie.poster_path)}
            title={movie.title}
            decorative
            priority={priority}
            className={`shadow-lg shadow-black/40 transition group-hover:shadow-xl group-hover:shadow-black/60 ${movie.skipped_tonight ? 'opacity-50 grayscale' : ''}`}
          />
          <span
            title="Hype total"
            className="absolute top-2 right-2 inline-flex min-w-8 items-center justify-center gap-0.5 rounded-full bg-ink-950/85 px-2 py-0.5 text-sm font-bold text-fg ring-1 ring-white/10"
          >
            <span className="sr-only">Hype total </span>
            {movie.hype_total}
            <span aria-hidden="true" className="text-xs text-accent">
              ★
            </span>
          </span>
          {movie.skipped_tonight && (
            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-ink-950/85 py-1 text-center text-xs font-semibold text-muted">
              Not tonight
            </span>
          )}
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <h3 className="line-clamp-2 font-sans text-sm leading-snug font-semibold">
            <button
              type="button"
              onClick={() => onOpen(movie.id)}
              className="text-left outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              {movie.title}
              {movie.year && <span className="font-normal text-muted"> ({movie.year})</span>}
            </button>
          </h3>
          {PEOPLE.map((person) => (
            <StarDisplay
              key={person.id}
              person={person.id}
              value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
            />
          ))}
        </div>
      </motion.article>
    </motion.li>
  )
})
