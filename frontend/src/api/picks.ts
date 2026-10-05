import { apiFetch } from './client'
import type { PickRead, PickRequest, PickResult } from './types'

/** The server chooses the winner among pickable movies (400 if none match). */
export function createPick(body: PickRequest): Promise<PickResult> {
  return apiFetch<PickResult>('/api/picks', { method: 'POST', json: body })
}

/** "We're watching this!" (idempotent). */
export function confirmPick(pickId: number): Promise<PickRead> {
  return apiFetch<PickRead>(`/api/picks/${pickId}/confirm`, { method: 'POST' })
}
