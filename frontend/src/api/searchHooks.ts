import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'
import { getTmdbMovieInfo, searchMovies } from './search'

/** TMDB search for `q` (already trimmed/debounced); idle while `q` is empty. */
export function useSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: ({ signal }) => searchMovies(q, signal),
    enabled: q !== '',
    // The backend caches TMDB for 5 minutes too; `already_saved` is patched locally on save.
    staleTime: 5 * 60_000,
    // While typing, keep the previous results on screen (dimmed) instead of a skeleton.
    placeholderData: keepPreviousData,
  })
}

/** Live TMDB details for one movie's drawer; idle while `tmdbId` is null. TMDB data barely changes, so it's kept for an hour. */
export function useTmdbInfo(tmdbId: number | null) {
  return useQuery({
    queryKey: queryKeys.tmdbInfo(tmdbId ?? 0),
    queryFn: ({ signal }) => getTmdbMovieInfo(tmdbId!, signal),
    enabled: tmdbId !== null,
    staleTime: 60 * 60_000,
  })
}
