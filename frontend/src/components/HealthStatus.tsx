import { useEffect, useState } from 'react'
import { fetchHealth, type HealthResponse } from '../api/health'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

export function HealthStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    fetchHealth()
      .then((data) => setState({ kind: 'ok', data }))
      .catch((error: unknown) =>
        setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }),
      )
  }, [])

  if (state.kind === 'loading') {
    return <p className="text-slate-400">Checking backend…</p>
  }

  if (state.kind === 'error') {
    return (
      <p className="rounded-lg bg-red-950 px-4 py-3 text-red-300">
        Backend unreachable: {state.message}
      </p>
    )
  }

  return (
    <div className="rounded-lg bg-emerald-950 px-4 py-3 text-emerald-300">
      <p>Backend status: {state.data.status}</p>
      <p>TMDB token: {state.data.tmdb_configured ? 'configured' : 'missing'}</p>
    </div>
  )
}
