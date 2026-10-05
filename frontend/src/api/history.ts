import { apiFetch } from './client'
import type { HistoryRead } from './types'

export function fetchHistory(): Promise<HistoryRead> {
  return apiFetch<HistoryRead>('/api/history')
}
