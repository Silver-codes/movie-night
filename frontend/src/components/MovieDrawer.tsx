import { useMovie } from '../api/movieHooks'
import { ApiError } from '../api/client'
import type { Movie } from '../api/types'
import { Drawer } from './Drawer'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { MovieDetails } from './MovieDetails'
import { Skeleton } from './Skeleton'

type Props = {
  /** The open movie (from `useMovieParam`), or null when closed. */
  movieId: number | null
  /** The movie from the page's list, shown instantly while the detail loads. */
  placeholder?: Movie
  onClose: () => void
}

/** Detail drawer for one movie, loading it by id. */
export function MovieDrawer({ movieId, placeholder, onClose }: Props) {
  const detail = useMovie(movieId, placeholder)
  return (
    <Drawer open={movieId !== null} onClose={onClose} label={detail.data?.title ?? 'Movie details'}>
      {detail.data ? (
        <MovieDetails movie={detail.data} onDone={onClose} />
      ) : detail.isError ? (
        <div className="p-6 pt-16">
          {detail.error instanceof ApiError && detail.error.status === 404 ? (
            <EmptyState title="Movie not found">It may have been removed. Close this and pick another one.</EmptyState>
          ) : (
            <ErrorState what="this movie" error={detail.error} onRetry={() => void detail.refetch()} />
          )}
        </div>
      ) : (
        <div role="status" aria-label="Loading the movie" className="flex flex-col gap-4 p-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
    </Drawer>
  )
}
