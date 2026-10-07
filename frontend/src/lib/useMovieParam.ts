import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

/**
 * The movie open in the detail drawer, kept in `?movie=` so the phone's back button closes it.
 * Opening pushes a history entry (marked with `state.drawer`); closing goes back to it when it can.
 */
export function useMovieParam() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const openId = Number(params.get('movie')) || null

  // Built on `navigate` (stable) instead of `setParams` (new on every URL change), so memoized
  // cards that get `openMovie` don't all re-render when the drawer opens or closes.
  const openMovie = useCallback(
    (id: number) => {
      const next = new URLSearchParams(window.location.search)
      next.set('movie', String(id))
      void navigate({ search: `?${next.toString()}` }, { state: { drawer: true } })
    },
    [navigate],
  )

  const fromDrawerPush = (location.state as { drawer?: boolean } | null)?.drawer === true
  const closeMovie = useCallback(() => {
    if (fromDrawerPush) {
      void navigate(-1)
    } else {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('movie')
          return next
        },
        { replace: true },
      )
    }
  }, [fromDrawerPush, navigate, setParams])

  return { openId, openMovie, closeMovie }
}
