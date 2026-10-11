import { useSaveMovie } from '../api/movieHooks'
import { useTmdbInfo } from '../api/searchHooks'
import type { SearchResult } from '../api/types'
import { toast } from '../lib/toast'
import { Drawer } from './Drawer'
import { addLabel, useHypeStars } from '../lib/hypeStars'
import { HypeItSection } from './HypeIt'
import { MovieAbout } from './MovieAbout'
import { GenreList, MovieBackdrop, MovieHeader } from './MovieHeader'

type Props = {
  /** The search result to show; it stays set while the drawer animates out. */
  result: SearchResult | null
  open: boolean
  onClose: () => void
}

/**
 * A search result's drawer, before it's saved: the same movie view as on the Watchlist, but the info comes
 * first (you're deciding whether to add it) and the only action is adding it, with optional hype stars.
 */
export function SearchMovieDrawer({ result, open, onClose }: Props) {
  return (
    <Drawer open={open && result !== null} onClose={onClose} label={result?.title ?? 'Movie details'}>
      {/* Keyed, so each movie starts unrated. */}
      {result && <SearchMovieDetails key={result.tmdb_id} result={result} onSaved={onClose} />}
    </Drawer>
  )
}

function SearchMovieDetails({ result, onSaved }: { result: SearchResult; onSaved: () => void }) {
  // The search result shows at once; runtime, genres and the backdrop fill in from TMDB.
  const info = useTmdbInfo(result.tmdb_id).data
  const hype = useHypeStars()
  const save = useSaveMovie()

  function onSave() {
    save.mutate(
      { tmdb_id: result.tmdb_id, fuf_hype: hype.stars.fuf, cookie_hype: hype.stars.cookie },
      {
        onSuccess: () => {
          toast.success(`${result.title} added to the watchlist`)
          onSaved()
        },
      },
    )
  }

  return (
    <article>
      <MovieBackdrop images={info ?? null} />

      <div className="relative -mt-20 flex flex-col gap-6 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
        <MovieHeader
          title={result.title}
          posterSrc={result.poster_url}
          year={result.year}
          runtime={info?.runtime ?? null}
          rating={result.tmdb_rating}
        />
        <GenreList genres={info?.genres ?? []} />
        <MovieAbout tmdbId={result.tmdb_id} overview={result.overview} />
        <HypeItSection {...hype} />
        <button
          type="button"
          disabled={save.isPending}
          onClick={onSave}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60"
        >
          {addLabel(save.isPending, hype.anyRated)}
        </button>
      </div>
    </article>
  )
}
