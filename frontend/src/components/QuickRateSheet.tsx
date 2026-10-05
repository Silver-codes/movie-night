import { useState } from 'react'
import type { SearchResult } from '../api/types'
import { PEOPLE } from '../people'
import { Modal } from './Modal'
import { PosterImage } from './PosterImage'
import type { HypeStars } from './QuickRatePopover'
import { RatingBadge } from './RatingBadge'
import { StarRating } from './StarRating'

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
  const [stars, setStars] = useState<HypeStars>({ fuf: null, cookie: null })
  const anyRated = stars.fuf !== null || stars.cookie !== null

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

      <section className="flex flex-col gap-3 rounded-2xl bg-ink-950/60 p-4 ring-1 ring-ink-700">
        <h3 className="font-sans text-sm font-semibold tracking-wide text-muted uppercase">Hype it?</h3>
        {PEOPLE.map((person) => (
          <StarRating
            key={person.id}
            person={person.id}
            showName
            value={stars[person.id]}
            onChange={(value) => setStars((s) => ({ ...s, [person.id]: value }))}
          />
        ))}
        <p className="text-xs text-faint">
          {anyRated ? 'Tap a star again to clear it.' : 'Optional: you can rate it later from the watchlist.'}
        </p>
      </section>

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
          onClick={() => onSave(stars)}
          className="flex-1 rounded-xl bg-accent px-4 py-3 font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60"
        >
          {saving ? 'Saving…' : anyRated ? 'Save' : 'Add unrated'}
        </button>
      </div>
    </div>
  )
}
