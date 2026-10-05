import { useEffect, useState } from 'react'
import { useDeleteMovie } from '../api/movieHooks'
import type { Movie } from '../api/types'
import { toast } from '../lib/toast'

type Props = {
  movie: Movie
  onRemoved: () => void
  disabled?: boolean
  className?: string
}

/** "Remove" that needs a second tap within a few seconds. */
export function RemoveMovieButton({ movie, onRemoved, disabled = false, className = '' }: Props) {
  const remove = useDeleteMovie()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) {
      return
    }
    const timer = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(timer)
  }, [confirming])

  function onClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    remove.mutate(movie.id, {
      onSuccess: () => {
        toast.info(`${movie.title} removed`)
        onRemoved()
      },
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || remove.isPending}
      className={`rounded-xl px-4 py-3 font-semibold ring-1 transition disabled:opacity-60 ${
        confirming
          ? 'bg-danger text-ink-950 ring-danger'
          : 'text-danger ring-ink-600 hover:bg-danger/10 hover:ring-danger'
      } ${className}`}
    >
      {confirming ? 'Tap again to remove' : 'Remove'}
    </button>
  )
}
