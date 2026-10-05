import { apiFetch, withQuery } from './client'
import type { Movie, MovieFilters, MovieSave, MovieUpdate, MovieWatched } from './types'

export function fetchMovies(filters: MovieFilters = {}): Promise<Movie[]> {
  return apiFetch<Movie[]>(withQuery('/api/movies', filters))
}

export function fetchMovie(id: number): Promise<Movie> {
  return apiFetch<Movie>(`/api/movies/${id}`)
}

/** Saves a TMDB movie to the watchlist (409 if it's already saved). */
export function saveMovie(body: MovieSave): Promise<Movie> {
  return apiFetch<Movie>('/api/movies', { method: 'POST', json: body })
}

export function updateMovie(id: number, body: MovieUpdate): Promise<Movie> {
  return apiFetch<Movie>(`/api/movies/${id}`, { method: 'PATCH', json: body })
}

export function markWatched(id: number, body: MovieWatched = {}): Promise<Movie> {
  return apiFetch<Movie>(`/api/movies/${id}/watched`, { method: 'POST', json: body })
}

export function deleteMovie(id: number): Promise<void> {
  return apiFetch<void>(`/api/movies/${id}`, { method: 'DELETE' })
}
