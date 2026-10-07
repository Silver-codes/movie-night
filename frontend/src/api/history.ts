import { apiFetch } from './client'
import type { HistoryRead } from './types'

export function fetchHistory(signal?: AbortSignal): Promise<HistoryRead> {
  return apiFetch<HistoryRead>('/api/history', { signal })
}
