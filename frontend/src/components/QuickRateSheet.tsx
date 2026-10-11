import type { SearchResult } from '../api/types'
import { addLabel, useHypeStars, type HypeStars } from '../lib/hypeStars'
import { HypeItSection } from './HypeIt'
import { Modal } from './Modal'
import { PosterImage } from './PosterImage'
import { RatingBadge } from './RatingBadge'

type Props = {
  result: SearchResult
  open: boolean
  saving: boolean
  onSave: (stars: HypeStars) => void
  onClose: () => void
}

/** Phones: "Add to watchlist" as a bottom sheet with full-size hype stars (the card is too narrow for them). */
export function QuickRateSheet({ result, open, saving, onSave, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add to watchlist">
      {/* Only mounted while open, so every opening starts unrated. */}
      <QuickRateForm result={result} saving={saving} onSave={onSave} onCancel={onClose} />
    </Modal>
  )
}

function QuickRateForm({
  result,
  saving,
  onSave,
  onCancel,
}: {
  result: SearchResult
  saving: boolean
  onSave: (stars: HypeStars) => void
  onCancel: () => void
}) {
  const hype = useHypeStars()

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-4">
        <PosterImage src={result.poster_url} title={result.title} decorative className="w-16 shrink-0 rounded-lg!" />
        <div className="min-w-0">
          <p className="font-display text-lg leading-snug font-semibold break-words">{result.title}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            {result.year}
            <RatingBadge rating={result.tmdb_rating} />
          </p>
        </div>
      </div>

      <HypeItSection {...hype} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-3 font-semibold text-muted ring-1 ring-ink-600 transition hover:bg-ink-800 hover:text-fg"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(hype.stars)}
          className="flex-1 rounded-xl bg-accent px-4 py-3 font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60"
        >
          {addLabel(saving, hype.anyRated)}
        </button>
      </div>
    </div>
  )
}
