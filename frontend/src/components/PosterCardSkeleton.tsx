import { Skeleton } from './Skeleton'

/** Placeholder with the shape of a poster card (2:3 poster + title + meta line). */
export function PosterCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="aspect-2/3 w-full rounded-xl" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  )
}
