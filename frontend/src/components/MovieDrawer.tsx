import { useMovie } from '../api/movieHooks'
import type { Movie } from '../api/types'
import { Drawer } from './Drawer'
import { EmptyState } from './EmptyState'
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
          <EmptyState title="Movie not found">{detail.error.message}</EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
    </Drawer>
  )
}
