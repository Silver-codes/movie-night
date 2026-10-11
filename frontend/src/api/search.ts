import { apiFetch, withQuery } from './client'
import type { SearchResult, TmdbMovieInfo } from './types'

/** TMDB search (top 20), with `already_saved` / `movie_id` for movies we have. */
export function searchMovies(q: string, signal?: AbortSignal): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(withQuery('/api/search', { q }), { signal })
}

/** Live TMDB details for the movie drawer: runtime, genres, backdrop, credits, trailer, age rating, series. */
export function getTmdbMovieInfo(tmdbId: number, signal?: AbortSignal): Promise<TmdbMovieInfo> {
  return apiFetch<TmdbMovieInfo>(`/api/tmdb/movies/${tmdbId}`, { signal })
}
