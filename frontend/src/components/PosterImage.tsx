import { useState } from 'react'
import { FilmIcon } from './NavIcons'

type Props = {
  src: string | null
  title: string
  className?: string
}

/** A 2:3 poster that falls back to a film icon when there's no image (or it fails to load). It fills its container; for a fixed size pass a width class (e.g. `w-24`). */
export function PosterImage({ src, title, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`relative aspect-2/3 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5 ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={`Poster of ${title}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-faint">
          <FilmIcon className="size-8" />
          <span className="line-clamp-3 text-xs">{title}</span>
        </div>
      )}
    </div>
  )
}
