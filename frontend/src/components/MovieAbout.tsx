import { useTmdbInfo } from '../api/searchHooks'
import { PlayIcon } from './NavIcons'

type Props = {
  tmdbId: number
  /** Known right away (saved movies and search results both have it), so it never waits for TMDB. */
  overview: string | null
}

/** Czech ratings are "U" (all ages) or a plain age ("12" → "12+"); US ones ("PG-13") stay as they are. */
function formatCertification(certification: string): string {
  if (certification === 'U') {
    return 'All ages'
  }
  return /^\d+$/.test(certification) ? `${certification}+` : certification
}

/**
 * What the movie is about: the tagline and overview, who made it and who's in it, the age rating, its place in
 * a series and the trailer. Everything but the overview comes live from TMDB and simply isn't shown until it
 * arrives (or if TMDB fails): it's extra, never something to wait for.
 */
export function MovieAbout({ tmdbId, overview }: Props) {
  const info = useTmdbInfo(tmdbId).data
  const { tagline, directors = [], cast = [], certification, collection, trailer_url: trailer } = info ?? {}
  const hasCredits = directors.length > 0 || cast.length > 0
  const hasFacts = Boolean(certification || collection || trailer)

  if (!overview && !tagline && !hasCredits && !hasFacts) {
    return null
  }
  return (
    <section aria-label="About the movie" className="flex flex-col gap-4">
      {(tagline || overview) && (
        <div className="flex flex-col gap-2">
          {tagline && <p className="text-fg/90 italic">{tagline}</p>}
          {overview && <p className="leading-relaxed text-fg/85">{overview}</p>}
        </div>
      )}

      {hasCredits && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {directors.length > 0 && (
            <>
              <dt className="text-muted">{directors.length === 1 ? 'Director' : 'Directors'}</dt>
              <dd>{directors.join(', ')}</dd>
            </>
          )}
          {cast.length > 0 && (
            <>
              <dt className="text-muted">Starring</dt>
              <dd>{cast.join(', ')}</dd>
            </>
          )}
        </dl>
      )}

      {(certification || collection) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {certification && (
            <span
              title="Age rating"
              className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-fg/85 ring-1 ring-ink-600"
            >
              <span className="sr-only">Age rating </span>
              {formatCertification(certification)}
            </span>
          )}
          {collection && (
            <span className="text-sm text-muted">
              {collection.name} · film {collection.position} of {collection.total}
            </span>
          )}
        </div>
      )}

      {/* Its own row, under the facts and lined up with the text, so a long series name never pushes it around. */}
      {trailer && (
        <a
          href={trailer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 ring-ink-600 transition hover:bg-ink-800"
        >
          <PlayIcon className="size-4" />
          Watch trailer
          <span className="sr-only"> (opens YouTube)</span>
        </a>
      )}
    </section>
  )
}
