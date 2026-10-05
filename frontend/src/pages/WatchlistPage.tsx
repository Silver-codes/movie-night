import { AnimatePresence } from 'motion/react'
import { useCallback, useMemo, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useMovie, useMovies } from '../api/movieHooks'
import type { Movie, MovieFilters, Person } from '../api/types'
import { Drawer } from '../components/Drawer'
import { EmptyState } from '../components/EmptyState'
import { MovieDetails } from '../components/MovieDetails'
import { SearchIcon, WatchlistIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { PersonTag } from '../components/PersonTag'
import { POSTER_GRID_CLASS } from '../components/posterGrid'
import { PosterGridSkeleton } from '../components/PosterGridSkeleton'
import { Skeleton } from '../components/Skeleton'
import { WatchlistCard } from '../components/WatchlistCard'
import { WATCHLIST_SORTS, WatchlistFilters, type WatchlistSort } from '../components/WatchlistFilters'
import { PEOPLE } from '../people'

const DEFAULT_SORT: WatchlistSort = 'hype_total'
const ALL_WATCHLIST: MovieFilters = { status: 'watchlist' }

function parsePerson(value: string | null): Person | null {
  return PEOPLE.find((p) => p.id === value)?.id ?? null
}

function parseSort(value: string | null): WatchlistSort {
  return WATCHLIST_SORTS.find((s) => s.value === value)?.value ?? DEFAULT_SORT
}

const buttonClass =
  'inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink-950 transition hover:bg-accent-strong'

export function WatchlistPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Filters and the open movie live in the URL, so the phone's back button closes the drawer.
  const genre = params.get('genre')
  const unratedBy = parsePerson(params.get('unrated'))
  const sort = parseSort(params.get('sort'))
  const openId = Number(params.get('movie')) || null

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

  function openMovie(movie: Movie) {
    const next = new URLSearchParams(params)
    next.set('movie', String(movie.id))
    setParams(next, { state: { drawer: true } })
  }

  const fromDrawerPush = (location.state as { drawer?: boolean } | null)?.drawer === true
  const closeMovie = useCallback(() => {
    if (fromDrawerPush) {
      void navigate(-1)
    } else {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('movie')
          return next
        },
        { replace: true },
      )
    }
  }, [fromDrawerPush, navigate, setParams])

  const placeholder =
    filtered.data?.find((m) => m.id === openId) ?? all.data?.find((m) => m.id === openId) ?? undefined
  const detail = useMovie(openId, placeholder)

  const hasFilters = genre !== null || unratedBy !== null

  let content: ReactNode
  if (all.isPending) {
    content = <PosterGridSkeleton />
  } else if (all.isError || filtered.isError) {
    const error = all.error ?? filtered.error
    content = (
      <EmptyState
        title="Couldn't load the watchlist"
        action={
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              void all.refetch()
              void filtered.refetch()
            }}
          >
            Try again
          </button>
        }
      >
        {error?.message}
      </EmptyState>
    )
  } else if (all.data.length === 0) {
    content = (
      <EmptyState
        title="Your watchlist is empty"
        icon={<WatchlistIcon className="size-7" />}
        action={
          <Link to="/search" className={buttonClass}>
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
        ) : filtered.data.length === 0 ? (
          <EmptyState
            title="No matches"
            action={
              hasFilters && (
                <button
                  type="button"
                  className={buttonClass}
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
                <WatchlistCard key={movie.id} movie={movie} onOpen={openMovie} />
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

      <Drawer open={openId !== null} onClose={closeMovie} label={detail.data?.title ?? 'Movie details'}>
        {detail.data ? (
          <MovieDetails movie={detail.data} onDone={closeMovie} />
        ) : detail.isError ? (
          <div className="p-6 pt-16">
            <EmptyState title="Movie not found">{detail.error.message}</EmptyState>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </Drawer>
    </>
  )
}
