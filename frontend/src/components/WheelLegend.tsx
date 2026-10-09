import { useEffect, useRef } from 'react'
import { posterUrl } from '../api/images'
import type { PickCandidate, PickMethod } from '../api/types'
import { formatRuntime } from '../lib/format'
import { PEOPLE } from '../people'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  candidates: PickCandidate[]
  method: PickMethod
  /** Index of the candidate whose slice is under the pointer right now. */
  activeIndex: number | null
}

function formatOdds(probability: number): string {
  const percent = Math.round(probability * 100)
  return percent < 1 ? '<1%' : `${percent}%`
}

type PointerReadoutProps = {
  candidate: PickCandidate
  /** The title as its wheel slice shows it (a series' shared start dropped), so the part that differs fits. */
  title: string
  method: PickMethod
  className?: string
}

/**
 * Phones and tablets: the list sits below the wheel, out of sight while it spins, so this strip under the
 * wheel names the movie passing the pointer. Hidden from screen readers: it changes many times a second,
 * and the list says the same.
 */
export function PointerReadout({ candidate: { movie, probability }, title, method, className = '' }: PointerReadoutProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-14 min-w-0 items-center gap-3 rounded-2xl bg-ink-900 py-2 pr-4 pl-2 ring-1 ring-ink-700 ${className}`}
    >
      <PosterImage
        src={posterUrl(movie.poster_path, 'w185')}
        title={movie.title}
        decorative
        compact
        className="w-7 shrink-0 rounded-md"
      />
      <p className="min-w-0 flex-1 truncate font-semibold">{title}</p>
      {method === 'wheel_weighted' && (
        <p className="shrink-0 font-semibold text-muted tabular-nums">{formatOdds(probability)}</p>
      )}
    </div>
  )
}

/**
 * Who's on the wheel, in slice order, with full titles and the odds. While the wheel turns, the movie under
 * the pointer lights up, so the two of you can follow the race even when the slices are small.
 */
export function WheelLegend({ candidates, method, activeIndex }: Props) {
  const list = useRef<HTMLOListElement>(null)
  const weighted = method === 'wheel_weighted'
  const count = candidates.length
  let summary: string
  if (count === 1) {
    summary = 'Just the one movie in the hat.'
  } else if (weighted) {
    summary = `${count} movies. More hype, bigger slice.`
  } else {
    summary = `${count} movies. Each has a 1 in ${count} chance.`
  }

  // A long list scrolls by itself to keep the movie under the pointer in view (without moving the page).
  useEffect(() => {
    const box = list.current
    const row = activeIndex === null ? null : box?.children[activeIndex]
    if (!box || !(row instanceof HTMLElement) || box.scrollHeight <= box.clientHeight) {
      return
    }
    if (row.offsetTop < box.scrollTop || row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = row.offsetTop - (box.clientHeight - row.offsetHeight) / 2
    }
  }, [activeIndex])

  return (
    <section aria-labelledby="wheel-legend-title" className="flex min-h-0 flex-col gap-4 lg:max-h-[max(28rem,calc(100dvh-18rem))] lg:gap-5">
      <div>
        <h2 id="wheel-legend-title" className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
          On the wheel
        </h2>
        <p className="mt-1 text-muted lg:mt-2 lg:text-xl">{summary}</p>
      </div>

      <ol ref={list} className="relative -mx-2 flex min-h-0 flex-col gap-1 overflow-y-auto px-2 py-1 lg:gap-1.5">
        {candidates.map(({ movie, probability }, i) => {
          const active = i === activeIndex
          const meta = [movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(' · ')
          return (
            <li
              key={movie.id}
              className={`flex items-center gap-3 rounded-2xl p-2 ring-1 transition-[background-color,box-shadow] duration-150 lg:gap-5 lg:p-3 ${
                active ? 'bg-ink-800 ring-ink-600' : 'ring-transparent'
              }`}
            >
              <PosterImage
                src={posterUrl(movie.poster_path, 'w185')}
                title={movie.title}
                decorative
                compact
                className="w-11 shrink-0 rounded-lg lg:w-16"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 lg:gap-1.5">
                <p
                  className={`line-clamp-2 leading-snug font-semibold transition-colors duration-150 lg:text-xl ${
                    active ? 'text-fg' : 'text-fg/80'
                  }`}
                >
                  {movie.title}
                </p>
                {weighted ? (
                  // Hype is what sizes the slices, so show whose hype it is.
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {PEOPLE.map((person) => (
                      <StarDisplay
                        key={person.id}
                        person={person.id}
                        value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
                        size="md"
                      />
                    ))}
                  </div>
                ) : (
                  meta && <p className="text-sm text-muted lg:text-lg">{meta}</p>
                )}
              </div>
              {weighted && (
                <p className="shrink-0 text-lg font-semibold text-fg tabular-nums lg:text-2xl">
                  <span className="sr-only">Chance: </span>
                  {formatOdds(probability)}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
