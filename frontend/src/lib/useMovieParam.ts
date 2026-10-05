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

  const openMovie = useCallback(
    (id: number) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('movie', String(id))
          return next
        },
        { state: { drawer: true } },
      )
    },
    [setParams],
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
