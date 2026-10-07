import { AnimatePresence, motion } from 'motion/react'
import { memo, useCallback, useRef, useState } from 'react'
import { useSaveMovie } from '../api/movieHooks'
import type { SearchResult } from '../api/types'
import { toast } from '../lib/toast'
import { CheckIcon, PlusIcon } from './NavIcons'
import { PosterImage } from './PosterImage'
import { QuickRatePopover, type HypeStars } from './QuickRatePopover'
import { RatingBadge } from './RatingBadge'

type Props = {
  result: SearchResult
  /** sm and up: rate in a popover over the poster. Phones: `onAddOnPhone` opens the page's one bottom sheet. */
  overlay: boolean
  /** Should be stable, so unchanged cards skip re-rendering. */
  onAddOnPhone: (result: SearchResult) => void
  /** In the first row: load the poster right away. */
  priority?: boolean
}

/**
 * A TMDB search hit: poster, rating, year, and "Add to watchlist" with quick hype stars:
 * over the poster from sm up, in a bottom sheet on phones (the card is too narrow for big stars).
 */
export const SearchResultCard = memo(function SearchResultCard({
  result,
  overlay,
  onAddOnPhone,
  priority = false,
}: Props) {
  const [rating, setRating] = useState(false)
  const save = useSaveMovie()
  const addButton = useRef<HTMLButtonElement>(null)
  const close = useCallback((returnFocus: boolean) => {
    setRating(false)
    if (returnFocus) {
      requestAnimationFrame(() => addButton.current?.focus())
    }
  }, [])

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
          decorative
          priority={priority}
          className="shadow-lg shadow-black/40 transition-shadow group-hover:shadow-xl group-hover:shadow-black/60"
        />
        <RatingBadge rating={result.tmdb_rating} className="absolute top-2 left-2" />
        {result.already_saved ? (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-ink-950">
            <CheckIcon className="size-3.5" strokeWidth={3} />
            Saved
          </span>
        ) : (
          // Stays mounted under the popover, so focus can come back to it.
          <button
            ref={addButton}
            type="button"
            onClick={() => (overlay ? setRating(true) : onAddOnPhone(result))}
            tabIndex={rating ? -1 : undefined}
            aria-hidden={rating || undefined}
            className={`absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-lg bg-ink-950/85 px-2 py-2 text-sm font-semibold text-fg ring-1 ring-white/10 transition hover:bg-accent hover:text-ink-950 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100 ${rating ? 'invisible' : ''}`}
          >
            <PlusIcon className="size-4 shrink-0" strokeWidth={2.4} />
            <span className="truncate">Add to watchlist</span>
          </button>
        )}
        <AnimatePresence>
          {overlay && rating && !result.already_saved && (
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
})
