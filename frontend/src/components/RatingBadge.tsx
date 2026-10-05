import { formatRating } from '../lib/format'

/** TMDB's audience rating as a small pill, e.g. "★ 7.8". Renders nothing without a rating. */
export function RatingBadge({ rating, className = '' }: { rating: number | null; className?: string }) {
  const text = formatRating(rating)
  if (text === null) {
    return null
  }
  return (
    <span
      title="TMDB rating"
      className={`inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-2 py-0.5 text-xs font-semibold text-fg ring-1 ring-white/10 backdrop-blur ${className}`}
    >
      <span aria-hidden="true" className="text-accent">
        ★
      </span>
      <span className="sr-only">TMDB rating </span>
      {text}
    </span>
  )
}
