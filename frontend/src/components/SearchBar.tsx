import { useMediaQuery } from '../lib/useMediaQuery'
import { CloseIcon, SearchIcon } from './NavIcons'

type Props = {
  value: string
  onChange: (value: string) => void
  /** Spinner on the right while results load. */
  busy?: boolean
}

export function SearchBar({ value, onChange, busy = false }: Props) {
  // Focus right away with a mouse; on touch screens that would pop the keyboard over the page.
  const finePointer = useMediaQuery('(pointer: fine)')
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for a movie…"
        aria-label="Search movies"
        autoFocus={finePointer}
        autoComplete="off"
        enterKeyHint="search"
        className="h-14 w-full rounded-2xl border border-ink-700 bg-ink-900/80 pr-14 pl-13 text-lg text-fg shadow-lg shadow-black/30 transition placeholder:text-faint focus:border-accent focus:outline-none md:h-16 md:text-xl [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
        {busy && (
          <span
            role="status"
            aria-label="Searching"
            className="size-5 animate-spin rounded-full border-2 border-ink-600 border-t-accent"
          />
        )}
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="rounded-lg p-2.5 text-muted transition hover:bg-ink-700 hover:text-fg"
          >
            <CloseIcon className="size-5" />
          </button>
        )}
      </div>
    </div>
  )
}
