import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useSearch } from '../api/searchHooks'
import { EmptyState } from '../components/EmptyState'
import { SearchIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { POSTER_GRID_CLASS } from '../components/posterGrid'
import { PosterGridSkeleton } from '../components/PosterGridSkeleton'
import { SearchBar } from '../components/SearchBar'
import { SearchResultCard } from '../components/SearchResultCard'
import { useDebouncedValue } from '../lib/useDebouncedValue'

// The last search, so coming back from another tab shows it again.
let lastQuery = ''

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(() => params.get('q') ?? lastQuery)
  const q = useDebouncedValue(text.trim(), 300)
  const search = useSearch(q)

  // Keep the debounced query in the URL (shareable, survives a reload).
  useEffect(() => {
    lastQuery = q
    setParams(q ? { q } : {}, { replace: true })
  }, [q, setParams])

  let content: ReactNode
  if (q === '') {
    content = (
      <EmptyState title="What are we watching?" icon={<SearchIcon className="size-7" />}>
        Type a title above. Add anything that looks good, with a quick hype rating if you like.
      </EmptyState>
    )
  } else if (search.isPending) {
    content = <PosterGridSkeleton count={12} />
  } else if (search.isError) {
    content = (
      <EmptyState
        title="Search didn't work"
        action={
          <button
            type="button"
            onClick={() => void search.refetch()}
            className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink-950 transition hover:bg-accent-strong"
          >
            Try again
          </button>
        }
      >
        {search.error.message}
      </EmptyState>
    )
  } else if (search.data.length === 0) {
    content = (
      <EmptyState title="Nothing found" icon={<SearchIcon className="size-7" />}>
        No movies match “{q}”. Check the spelling or try the original title.
      </EmptyState>
    )
  } else {
    content = (
      <div className={POSTER_GRID_CLASS}>
        {search.data.map((result) => (
          <SearchResultCard key={result.tmdb_id} result={result} />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Find a movie" subtitle="Search TMDB and add what you want to watch to your watchlist." />
      <div className="flex flex-col gap-8">
        <SearchBar value={text} onChange={setText} busy={search.isFetching} />
        {content}
      </div>
    </>
  )
}
