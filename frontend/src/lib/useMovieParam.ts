import { useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

/**
 * The movie open in the detail drawer, kept in `?movie=` (or another `param`, e.g. Search's `?tmdb=`) so the
 * phone's back button closes it.
 * Opening pushes a history entry (marked with `state.drawer`); closing goes back to it when it can.
 */
export function useMovieParam(param = 'movie') {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const openId = Number(params.get(param)) || null

  // Built on `navigate` (stable) instead of `setParams` (new on every URL change), so memoized
  // cards that get `openMovie` don't all re-render when the drawer opens or closes.
  const openMovie = useCallback(
    (id: number) => {
      const next = new URLSearchParams(window.location.search)
      next.set(param, String(id))
      void navigate({ search: `?${next.toString()}` }, { state: { drawer: true } })
    },
    [navigate, param],
  )

  // The history entry a "back" was already sent from, so a second close can't go back past the page.
  const closingEntry = useRef<string | null>(null)
  // Reads the live URL and history entry, not this render's: the drawer's backdrop keeps taking clicks while it
  // fades out, with the onClose from when it was open, so a double-click calls this twice.
  const closeMovie = useCallback(() => {
    if (!new URLSearchParams(window.location.search).has(param)) {
      return // already closed
    }
    // React Router keeps the entry's `state` under `usr`, next to its `key`.
    const entry = window.history.state as { key?: string; usr?: { drawer?: boolean } } | null
    if (entry?.usr?.drawer === true) {
      if (closingEntry.current === entry.key) {
        return // the back from this entry is on its way
      }
      closingEntry.current = entry.key ?? null
      void navigate(-1)
    } else {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete(param)
          return next
        },
        { replace: true },
      )
    }
  }, [navigate, param, setParams])

  return { openId, openMovie, closeMovie }
}
