import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from './history'
import { queryKeys } from './queryKeys'

/** Watched movies (newest first) plus the stats strip. */
export function useHistory() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: fetchHistory,
  })
}
