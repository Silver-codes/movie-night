import { useQuery } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'
import { searchMovies } from './search'

/** TMDB search for `q` (already trimmed/debounced); idle while `q` is empty. */
export function useSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: ({ signal }) => searchMovies(q, signal),
    enabled: q !== '',
    // The backend caches TMDB for 5 minutes too; `already_saved` is patched locally on save.
    staleTime: 5 * 60_000,
  })
}
