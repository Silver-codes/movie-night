import { apiFetch } from './client'
import type { PickRead, PickRequest, PickResult } from './types'

/** The server chooses the winner among pickable movies (400 if none match). */
export function createPick(body: PickRequest): Promise<PickResult> {
  return apiFetch<PickResult>('/api/picks', { method: 'POST', json: body })
}

/**
 * "We're watching this!": saves the pick (idempotent; 404 once the server forgot it, e.g. after a restart).
 * `movieId` takes another place on Top Rated instead of #1 (400 for a movie outside the pick, or on a wheel).
 */
export function confirmPick(pickId: string, movieId?: number): Promise<PickRead> {
  return apiFetch<PickRead>(`/api/picks/${pickId}/confirm`, {
    method: 'POST',
    json: movieId === undefined ? undefined : { movie_id: movieId },
  })
}
