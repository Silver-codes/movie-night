import { RUNTIME_LIMITS, type RuntimeLimit } from '../lib/pickMethods'
import { FilterChip } from './FilterChip'

type Props = {
  genres: string[]
  genre: string | null
  onGenreChange: (genre: string | null) => void
  maxRuntime: RuntimeLimit | null
  onMaxRuntimeChange: (minutes: RuntimeLimit | null) => void
}

const scrollRowClass =
  // Same sideways-scrolling row as the watchlist genre chips (see WatchlistFilters).
  '-mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:m-0 sm:flex-wrap sm:overflow-visible sm:p-0'

/** Optional pick filters: a max runtime and one genre. */
export function PickFilters({ genres, genre, onGenreChange, maxRuntime, onMaxRuntimeChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">Time</legend>
        <div className={scrollRowClass}>
          <FilterChip active={maxRuntime === null} onClick={() => onMaxRuntimeChange(null)}>
            Any length
          </FilterChip>
          {RUNTIME_LIMITS.map((limit) => (
            <FilterChip
              key={limit.value}
              active={maxRuntime === limit.value}
              onClick={() => onMaxRuntimeChange(maxRuntime === limit.value ? null : limit.value)}
            >
              {limit.label}
            </FilterChip>
          ))}
        </div>
      </fieldset>
      {genres.length > 0 && (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">Genre</legend>
          <div className={scrollRowClass}>
            <FilterChip active={genre === null} onClick={() => onGenreChange(null)}>
              Any genre
            </FilterChip>
            {genres.map((g) => (
              <FilterChip key={g} active={genre === g} onClick={() => onGenreChange(genre === g ? null : g)}>
                {g}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
