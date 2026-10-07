import { useState } from 'react'
import { FilmIcon } from './NavIcons'

type Props = {
  src: string | null
  title: string
  className?: string
  /** Empty alt text: for posters inside a button/link that already names the movie. */
  decorative?: boolean
  /** Small thumbnails (about w-12 and below): the fallback shows only a small icon. */
  compact?: boolean
  /** Above the fold: load right away with high priority instead of lazily. */
  priority?: boolean
}

/** A 2:3 poster that falls back to a film icon when there's no image (or it fails to load). It fills its container; for a fixed size pass a width class (e.g. `w-24`). */
export function PosterImage({
  src,
  title,
  className = '',
  decorative = false,
  compact = false,
  priority = false,
}: Props) {
  // Remember which URL failed, so a new `src` gets its own try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div className={`relative aspect-2/3 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5 ${className}`}>
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={decorative ? '' : `Poster of ${title}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : compact ? (
        <div className="grid size-full place-items-center text-faint" aria-hidden={decorative || undefined}>
          <FilmIcon className="size-4" />
        </div>
      ) : (
        <div
          className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-faint"
          aria-hidden={decorative || undefined}
        >
          <FilmIcon className="size-8" />
          <span className="line-clamp-3 text-xs">{title}</span>
        </div>
      )}
    </div>
  )
}
