import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { deleteMovie, fetchMovie, fetchMovies, markWatched, saveMovie, updateMovie } from './movies'
import { queryKeys } from './queryKeys'
import type { Movie, MovieFilters, MovieSave, MovieUpdate, MovieWatched, SearchResult } from './types'

const UPDATE_MOVIE_KEY = ['movies', 'update'] as const

export function useMovies(filters: MovieFilters = {}) {
  return useQuery({
    queryKey: queryKeys.movies.list(filters),
    queryFn: ({ signal }) => fetchMovies(filters, signal),
    // Keep showing the previous grid while a new filter combination loads.
    placeholderData: keepPreviousData,
  })
}

/** When the freshest cached list containing movie `id` was fetched (0 if none). */
function listUpdatedAt(queryClient: QueryClient, id: number): number {
  let updatedAt = 0
  for (const query of queryClient.getQueryCache().findAll({ queryKey: ['movies', 'list'] })) {
    const list = query.state.data as Movie[] | undefined
    if (list?.some((movie) => movie.id === id)) {
      updatedAt = Math.max(updatedAt, query.state.dataUpdatedAt)
    }
  }
  return updatedAt
}

/**
 * One movie. `placeholder` (the same movie from a list) seeds the cache with the list's age,
 * so opening the drawer shows it instantly and only refetches once the list data is stale.
 */
export function useMovie(id: number | null, placeholder?: Movie) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: queryKeys.movies.detail(id ?? 0),
    queryFn: ({ signal }) => fetchMovie(id ?? 0, signal),
    enabled: id !== null,
    initialData: placeholder?.id === id ? placeholder : undefined,
    initialDataUpdatedAt: () => (id === null ? 0 : listUpdatedAt(queryClient, id)),
  })
}

/** What the server will return after `update`, as far as the client can tell. */
function applyUpdate(movie: Movie, update: MovieUpdate): Movie {
  const next: Movie = { ...movie, ...update, status: update.status ?? movie.status }
  next.hype_total = (next.fuf_hype ?? 0) + (next.cookie_hype ?? 0)
  next.is_pickable = next.status === 'watchlist' && !next.skipped_tonight
  return next
}

function patchMovieInCaches(queryClient: QueryClient, id: number, patch: (movie: Movie) => Movie): void {
  queryClient.setQueriesData<Movie[]>({ queryKey: ['movies', 'list'] }, (list) =>
    list?.map((movie) => (movie.id === id ? patch(movie) : movie)),
  )
  queryClient.setQueryData<Movie>(queryKeys.movies.detail(id), (movie) => movie && patch(movie))
}

function removeMovieFromLists(queryClient: QueryClient, id: number): void {
  queryClient.setQueriesData<Movie[]>({ queryKey: ['movies', 'list'] }, (list) =>
    list?.filter((movie) => movie.id !== id),
  )
}

// Hype and "not tonight" only matter for the watchlist; these fields feed History.
const HISTORY_FIELDS = [
  'status',
  'watched_on',
  'fuf_verdict',
  'cookie_verdict',
  'fuf_note',
  'cookie_note',
] as const satisfies readonly (keyof MovieUpdate)[]

function touchesHistory(update: MovieUpdate): boolean {
  return HISTORY_FIELDS.some((field) => field in update)
}

let historyDirty = false

/** PATCH a movie with an optimistic update of every cached list and detail; rolls back on error. */
export function useUpdateMovie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: UPDATE_MOVIE_KEY,
    mutationFn: ({ id, update }: { id: number; update: MovieUpdate }) => updateMovie(id, update),
    onMutate: async ({ id, update }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.movies.all })
      const snapshot = queryClient.getQueriesData<Movie[] | Movie>({ queryKey: queryKeys.movies.all })
      patchMovieInCaches(queryClient, id, (movie) => applyUpdate(movie, update))
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSuccess: (movie) => {
      patchMovieInCaches(queryClient, movie.id, () => movie)
    },
    onSettled: (_movie, error, { update }) => {
      // Remember whether anything in flight touched history, so the last mutation refreshes it.
      if (error || touchesHistory(update)) {
        historyDirty = true
      }
      // While more star taps are in flight, a refetch would overwrite their optimistic state;
      // the last mutation to finish refreshes lists (filter membership, sort order). Details
      // already hold the server's movie from onSuccess (or the rollback), so they're skipped.
      if (queryClient.isMutating({ mutationKey: UPDATE_MOVIE_KEY }) === 1) {
        const refreshHistory = historyDirty
        historyDirty = false
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: ['movies', 'list'] }),
          refreshHistory && queryClient.invalidateQueries({ queryKey: queryKeys.history }),
        ])
      }
    },
  })
}

/** Save a search result to the watchlist and mark it as saved in every cached search. */
export function useSaveMovie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: MovieSave) => saveMovie(body),
    onSuccess: (movie) => {
      queryClient.setQueriesData<SearchResult[]>({ queryKey: ['search'] }, (results) =>
        results?.map((r) => (r.tmdb_id === movie.tmdb_id ? { ...r, already_saved: true } : r)),
      )
      return queryClient.invalidateQueries({ queryKey: queryKeys.movies.all })
    },
  })
}

export function useDeleteMovie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMovie(id),
    onSuccess: (_data, id) => {
      removeMovieFromLists(queryClient, id)
      // Only lists: refetching the (still open) detail query would just 404.
      void queryClient.invalidateQueries({ queryKey: ['movies', 'list'] })
      // Search results' `already_saved` flags are now stale.
      void queryClient.invalidateQueries({ queryKey: ['search'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.history })
    },
  })
}

export function useMarkWatched() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body?: MovieWatched }) => markWatched(id, body),
    onSuccess: (movie) => {
      removeMovieFromLists(queryClient, movie.id)
      queryClient.setQueryData(queryKeys.movies.detail(movie.id), movie)
      void queryClient.invalidateQueries({ queryKey: ['movies', 'list'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.history })
    },
  })
}
