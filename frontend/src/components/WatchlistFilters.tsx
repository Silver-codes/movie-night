import type { MovieSort, Person } from '../api/types'
import { PEOPLE } from '../people'
import { FilterChip } from './FilterChip'
import { ScrollRow } from './ScrollRow'

export const WATCHLIST_SORTS = [
  { value: 'hype_total', label: 'Hype total' },
  { value: 'added', label: 'Recently added' },
  { value: 'runtime', label: 'Shortest first' },
] as const satisfies readonly { value: MovieSort; label: string }[]

export type WatchlistSort = (typeof WATCHLIST_SORTS)[number]['value']

type Props = {
  genres: string[]
  genre: string | null
  onGenreChange: (genre: string | null) => void
  unratedBy: Person | null
  onUnratedByChange: (person: Person | null) => void
  sort: WatchlistSort
  onSortChange: (sort: WatchlistSort) => void
}

/** Genre chips, "not yet rated by …" toggles and the sort select. */
export function WatchlistFilters({
  genres,
  genre,
  onGenreChange,
  unratedBy,
  onUnratedByChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {genres.length > 0 && (
        <ScrollRow>
          <FilterChip active={genre === null} onClick={() => onGenreChange(null)}>
            All genres
          </FilterChip>
          {genres.map((g) => (
            <FilterChip key={g} active={genre === g} onClick={() => onGenreChange(genre === g ? null : g)}>
              {g}
            </FilterChip>
          ))}
        </ScrollRow>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {PEOPLE.map((person) => (
          <FilterChip
            key={person.id}
            active={unratedBy === person.id}
            onClick={() => onUnratedByChange(unratedBy === person.id ? null : person.id)}
            activeClass={`${person.softBgClass} ${person.textClass} ${person.ringClass}`}
          >
            <span aria-hidden="true">{person.emoji}</span>
            Not rated by {person.name}
          </FilterChip>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as WatchlistSort)}
            className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm text-fg focus:border-accent"
          >
            {WATCHLIST_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
