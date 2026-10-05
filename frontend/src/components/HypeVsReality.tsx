import type { Movie } from '../api/types'
import { formatStars } from '../lib/format'
import { hypeVsReality } from '../lib/hypeVsReality'

const KINDS = {
  better: { arrow: '▲', word: 'Better than hyped', className: 'text-success' },
  worse: { arrow: '▼', word: 'Letdown', className: 'text-danger' },
  same: { arrow: '=', word: 'As hyped', className: 'text-muted' },
} as const

/** "Hype 3.5 → 4.5 ▲": the average hype compared with the average verdict. Nothing if either is missing. */
export function HypeVsReality({ movie }: { movie: Movie }) {
  const result = hypeVsReality(movie)
  if (result === null) {
    return null
  }
  const kind = KINDS[result.kind]
  const label = `${kind.word}: hype ${formatStars(result.hype)}, verdict ${formatStars(result.verdict)} stars`
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-2 py-0.5 text-xs ring-1 ring-ink-700"
    >
      <span className="text-muted">Hype {formatStars(result.hype)}</span>
      <span aria-hidden="true" className="text-faint">
        →
      </span>
      <span className="font-semibold text-fg">{formatStars(result.verdict)}</span>
      <span aria-hidden="true" className={`font-bold ${kind.className}`}>
        {kind.arrow}
      </span>
    </span>
  )
}
