import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '../api/health'
import { queryKeys } from '../api/queryKeys'

/** Stays silent while all is well; warns if the backend is down or the TMDB token is missing. */
export function BackendStatus() {
  const { data, isError } = useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    refetchInterval: (query) => (query.state.status === 'error' ? 10_000 : false),
    retry: false,
  })

  let message: string | null = null
  if (isError) {
    message = "Can't reach the backend. Start it with `uv run fastapi dev app/main.py`."
  } else if (data && !data.tmdb_configured) {
    message = 'TMDB token missing: add TMDB_TOKEN to backend/.env, then restart the backend. Search won’t work until then.'
  }

  if (!message) {
    return null
  }
  return (
    <div role="alert" className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-center text-sm text-danger">
      {message}
    </div>
  )
}
