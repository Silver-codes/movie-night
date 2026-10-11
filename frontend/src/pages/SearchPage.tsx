import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useSaveMovie } from '../api/movieHooks'
import { useSearch } from '../api/searchHooks'
import type { SearchResult } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MovieDrawer } from '../components/MovieDrawer'
import { SearchIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { POSTER_GRID_CLASS } from '../components/posterGrid'
import { PosterGridSkeleton } from '../components/PosterGridSkeleton'
import type { HypeStars } from '../lib/hypeStars'
import { QuickRateSheet } from '../components/QuickRateSheet'
import { SearchBar } from '../components/SearchBar'
import { SearchMovieDrawer } from '../components/SearchMovieDrawer'
import { SearchResultCard } from '../components/SearchResultCard'
import { toast } from '../lib/toast'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useMovieParam } from '../lib/useMovieParam'

// The last search, so coming back from another tab shows it again.
let lastQuery = ''
// Posters in roughly the first row load eagerly; the rest lazily.
const EAGER_POSTERS = 6

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(() => params.get('q') ?? lastQuery)
  const q = useDebouncedValue(text.trim(), 300)
  const search = useSearch(q)
  const overlay = useMediaQuery('(min-width: 640px)')

  // Phones: one shared "Add to watchlist" sheet for all results. The result stays set while
  // the sheet animates out.
  const [sheetResult, setSheetResult] = useState<SearchResult | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const save = useSaveMovie()
  const openSheet = useCallback((result: SearchResult) => {
    setSheetResult(result)
    setSheetOpen(true)
  }, [])

  function onSheetSave(stars: HypeStars) {
    if (!sheetResult) {
      return
    }
    const { title } = sheetResult
    save.mutate(
      { tmdb_id: sheetResult.tmdb_id, fuf_hype: stars.fuf, cookie_hype: stars.cookie },
      {
        onSuccess: () => {
          setSheetOpen(false)
          toast.success(`${title} added to the watchlist`)
        },
      },
    )
  }

  // Keep the debounced query in the URL (shareable, survives a reload). Only when it changed, and only `q`:
  // `setParams` changes with every URL change, and opening a drawer (`?tmdb=`) mustn't be undone here.
  useEffect(() => {
    lastQuery = q
    if ((params.get('q') ?? '') === q) {
      return
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (q) {
          next.set('q', q)
        } else {
          next.delete('q')
        }
        return next
      },
      { replace: true },
    )
  }, [q, params, setParams])

  // The open result's drawer, in `?tmdb=` (the back button closes it). Which drawer it is gets decided when it
  // opens: a saved movie gets the watchlist drawer, an unsaved one the add drawer, which then must not turn into
  // the watchlist one when saving patches `movie_id` in. Kept after closing, so the drawer can animate out.
  const { openId, openMovie, closeMovie } = useMovieParam('tmdb')
  const [shown, setShown] = useState<{ result: SearchResult; movieId: number | null } | null>(null)
  const openResult = openId === null ? undefined : search.data?.find((r) => r.tmdb_id === openId)
  if (openResult && shown?.result.tmdb_id !== openResult.tmdb_id) {
    setShown({ result: openResult, movieId: openResult.movie_id ?? null })
  }
  const drawerOpen = openId !== null && shown?.result.tmdb_id === openId

  let content: ReactNode
  if (q === '') {
    content = (
      <EmptyState title="Search for a movie" icon={<SearchIcon className="size-7" />}>
        Type a title above. Add anything that looks good, with a quick hype rating if you like.
      </EmptyState>
    )
  } else if (search.isPending) {
    content = <PosterGridSkeleton count={12} />
  } else if (!search.data) {
    content = <ErrorState what="search results" error={search.error} onRetry={() => void search.refetch()} />
  } else if (search.data.length === 0) {
    content = (
      <EmptyState title="Nothing found" icon={<SearchIcon className="size-7" />}>
        No movies match “{q}”. Check the spelling or try the original title.
      </EmptyState>
    )
  } else {
    content = (
      // Dimmed while the next query loads; the previous results stay on screen until then.
      <div className={`${POSTER_GRID_CLASS} transition-opacity ${search.isPlaceholderData ? 'opacity-60' : ''}`}>
        {search.data.map((result, index) => (
          <SearchResultCard
            key={result.tmdb_id}
            result={result}
            overlay={overlay}
            onAddOnPhone={openSheet}
            onOpen={openMovie}
            priority={index < EAGER_POSTERS}
          />
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
      <MovieDrawer movieId={drawerOpen && shown.movieId !== null ? shown.movieId : null} onClose={closeMovie} />
      <SearchMovieDrawer
        result={shown?.movieId === null ? shown.result : null}
        open={drawerOpen && shown.movieId === null}
        onClose={closeMovie}
      />
      {!overlay && sheetResult && (
        <QuickRateSheet
          result={sheetResult}
          open={sheetOpen}
          saving={save.isPending}
          onSave={onSheetSave}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  )
}
