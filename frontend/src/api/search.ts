import { apiFetch, withQuery } from './client'
import type { SearchResult } from './types'

/** TMDB search (top 20), with `already_saved` for movies we have. */
export function searchMovies(q: string, signal?: AbortSignal): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(withQuery('/api/search', { q }), { signal })
}
