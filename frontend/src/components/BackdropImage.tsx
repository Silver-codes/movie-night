import { useState } from 'react'
import { backdropUrl, posterUrl } from '../api/images'
import type { Movie } from '../api/types'

/**
 * Fills its (relative) parent with the movie's backdrop. Without one, or if it fails to load,
 * the poster is shown blurred and dimmed instead; without that too, a soft glow in the accent color.
 */
export function BackdropImage({ movie }: { movie: Pick<Movie, 'backdrop_path' | 'poster_path'> }) {
  const backdrop = backdropUrl(movie.backdrop_path)
  const poster = posterUrl(movie.poster_path, 'w342')
  // Which URLs failed, so a different movie (new URLs) gets a fresh try.
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())
  const fail = (url: string) => setFailed((prev) => new Set(prev).add(url))

  let content
  if (backdrop && !failed.has(backdrop)) {
    content = (
      <img
        src={backdrop}
        alt=""
        decoding="async"
        fetchPriority="high"
        onError={() => fail(backdrop)} className="size-full object-cover" />
    )
  } else if (poster && !failed.has(poster)) {
    content = (
      <img
        src={poster}
        alt=""
        decoding="async"
        onError={() => fail(poster)}
        className="size-full scale-125 object-cover opacity-60 blur-2xl saturate-150"
      />
    )
  } else {
    content = <div className="size-full bg-radial-[at_50%_35%] from-accent/25 to-transparent to-70%" />
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {content}
    </div>
  )
}
