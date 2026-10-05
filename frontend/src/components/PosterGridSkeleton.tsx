import { PosterCardSkeleton } from './PosterCardSkeleton'

/** Loading state for a poster grid; same columns the real grids will use. */
export function PosterGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <PosterCardSkeleton key={i} />
      ))}
    </div>
  )
}
