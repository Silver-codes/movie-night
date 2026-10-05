import { AnimatePresence } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMovies } from '../api/movieHooks'
import type { MovieFilters, Person } from '../api/types'
import { PRIMARY_BUTTON_CLASS } from '../components/buttonStyles'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MovieDrawer } from '../components/MovieDrawer'
import { SearchIcon, WatchlistIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { PersonTag } from '../components/PersonTag'
import { POSTER_GRID_CLASS } from '../components/posterGrid'
import { PosterGridSkeleton } from '../components/PosterGridSkeleton'
import { WatchlistCard } from '../components/WatchlistCard'
import { WATCHLIST_SORTS, WatchlistFilters, type WatchlistSort } from '../components/WatchlistFilters'
import { useMovieParam } from '../lib/useMovieParam'
import { PEOPLE } from '../people'

const DEFAULT_SORT: WatchlistSort = 'hype_total'
const ALL_WATCHLIST: MovieFilters = { status: 'watchlist' }

function parsePerson(value: string | null): Person | null {
  return PEOPLE.find((p) => p.id === value)?.id ?? null
}

function parseSort(value: string | null): WatchlistSort {
  return WATCHLIST_SORTS.find((s) => s.value === value)?.value ?? DEFAULT_SORT
}

export function WatchlistPage() {
  const [params, setParams] = useSearchParams()
  const { openId, openMovie, closeMovie } = useMovieParam()

  // Filters and the open movie live in the URL, so the phone's back button closes the drawer.
  const genre = params.get('genre')
  const unratedBy = parsePerson(params.get('unrated'))
  const sort = parseSort(params.get('sort'))

  const all = useMovies(ALL_WATCHLIST)
  const filters: MovieFilters = { status: 'watchlist', genre: genre ?? undefined, unrated_by: unratedBy ?? undefined, sort }
  const filtered = useMovies(filters)

  const genres = useMemo(
    () => [...new Set((all.data ?? []).flatMap((m) => m.genres))].sort((a, b) => a.localeCompare(b)),
    [all.data],
  )

  /** Set (or with null, remove) URL params in one history entry replacement. */
  function setFilterParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    setParams(next, { replace: true })
  }

  const placeholder =
    filtered.data?.find((m) => m.id === openId) ?? all.data?.find((m) => m.id === openId)

  const hasFilters = genre !== null || unratedBy !== null

  let content: ReactNode
  if (all.isPending) {
    content = <PosterGridSkeleton />
  } else if (!all.data) {
    // Only when there's nothing to show: a failed background refetch keeps the old data on screen.
    content = <ErrorState what="the watchlist" error={all.error} onRetry={() => void all.refetch()} />
  } else if (all.data.length === 0) {
    content = (
      <EmptyState
        title="Your watchlist is empty"
        icon={<WatchlistIcon className="size-7" />}
        action={
          <Link to="/search" className={PRIMARY_BUTTON_CLASS}>
            <SearchIcon className="size-5" />
            Find a movie
          </Link>
        }
      >
        Search for movies you'd like to see and give them some hype stars.
      </EmptyState>
    )
  } else {
    content = (
      <>
        <WatchlistFilters
          genres={genres}
          genre={genre}
          onGenreChange={(g) => setFilterParams({ genre: g })}
          unratedBy={unratedBy}
          onUnratedByChange={(p) => setFilterParams({ unrated: p })}
          sort={sort}
          onSortChange={(s) => setFilterParams({ sort: s === DEFAULT_SORT ? null : s })}
        />
        {filtered.isPending ? (
          <PosterGridSkeleton />
        ) : !filtered.data ? (
          <ErrorState what="the watchlist" error={filtered.error} onRetry={() => void filtered.refetch()} />
        ) : filtered.data.length === 0 ? (
          <EmptyState
            title="No matches"
            action={
              hasFilters && (
                <button
                  type="button"
                  className={PRIMARY_BUTTON_CLASS}
                  onClick={() => setFilterParams({ genre: null, unrated: null })}
                >
                  Clear filters
                </button>
              )
            }
          >
            Nothing on the watchlist fits these filters.
          </EmptyState>
        ) : (
          <ul className={`${POSTER_GRID_CLASS} transition-opacity ${filtered.isPlaceholderData ? 'opacity-60' : ''}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.data.map((movie) => (
                <WatchlistCard key={movie.id} movie={movie} onOpen={(m) => openMovie(m.id)} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </>
    )
  }

  const count = all.data?.length

  return (
    <>
      <PageHeader
        title="Watchlist"
        subtitle={
          count === undefined || count === 0
            ? "Everything you've saved, with both of your hype stars."
            : `${count} ${count === 1 ? 'movie' : 'movies'} saved. Tap one to rate it or see more.`
        }
        actions={PEOPLE.map((person) => (
          <PersonTag key={person.id} person={person.id} />
        ))}
      />
      {content}

      <MovieDrawer movieId={openId} placeholder={placeholder} onClose={closeMovie} />
    </>
  )
}
