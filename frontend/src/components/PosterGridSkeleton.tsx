import { PosterCardSkeleton } from './PosterCardSkeleton'
import { POSTER_GRID_CLASS } from './posterGrid'

/** Loading state for a poster grid; same columns as the real grids. */
export function PosterGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className={POSTER_GRID_CLASS}>
      {Array.from({ length: count }, (_, i) => (
        <PosterCardSkeleton key={i} />
      ))}
    </div>
  )
}
