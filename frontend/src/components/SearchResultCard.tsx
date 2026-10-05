import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { useSaveMovie } from '../api/movieHooks'
import type { SearchResult } from '../api/types'
import { toast } from '../lib/toast'
import { CheckIcon, PlusIcon } from './NavIcons'
import { PosterImage } from './PosterImage'
import { QuickRatePopover, type HypeStars } from './QuickRatePopover'
import { RatingBadge } from './RatingBadge'

/** A TMDB search hit: poster, rating, year, and "Add to watchlist" with quick hype stars. */
export function SearchResultCard({ result }: { result: SearchResult }) {
  const [rating, setRating] = useState(false)
  const save = useSaveMovie()
  const close = useCallback(() => setRating(false), [])

  function onSave(stars: HypeStars) {
    save.mutate(
      { tmdb_id: result.tmdb_id, fuf_hype: stars.fuf, cookie_hype: stars.cookie },
      {
        onSuccess: () => {
          setRating(false)
          toast.success(`${result.title} added to the watchlist`)
        },
      },
    )
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="group flex flex-col gap-2.5"
    >
      <div className="relative">
        <PosterImage
          src={result.poster_url}
          title={result.title}
          className="shadow-lg shadow-black/40 transition-shadow group-hover:shadow-xl group-hover:shadow-black/60"
        />
        <RatingBadge rating={result.tmdb_rating} className="absolute top-2 left-2" />
        {result.already_saved ? (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-ink-950">
            <CheckIcon className="size-3.5" strokeWidth={3} />
            Saved
          </span>
        ) : (
          !rating && (
            <button
              type="button"
              onClick={() => setRating(true)}
              className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-lg bg-ink-950/80 px-2 py-2 text-sm font-semibold text-fg ring-1 ring-white/10 backdrop-blur transition hover:bg-accent hover:text-ink-950 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
            >
              <PlusIcon className="size-4" strokeWidth={2.4} />
              Add to watchlist
            </button>
          )
        )}
        <AnimatePresence>
          {rating && !result.already_saved && (
            <QuickRatePopover title={result.title} saving={save.isPending} onSave={onSave} onClose={close} />
          )}
        </AnimatePresence>
      </div>
      <div>
        <h3 className="line-clamp-2 font-sans text-sm leading-snug font-semibold">{result.title}</h3>
        {result.year && <p className="text-xs text-muted">{result.year}</p>}
      </div>
    </motion.article>
  )
}
