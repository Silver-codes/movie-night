// TMDB's public image CDN. `Movie` has raw paths; `SearchResult` already comes with `poster_url`.
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780'
export type BackdropSize = 'w780' | 'w1280' | 'original'

export function posterUrl(path: string | null, size: PosterSize = 'w342'): string | null {
  return path ? `${TMDB_IMAGE_URL}/${size}${path}` : null
}

export function backdropUrl(path: string | null, size: BackdropSize = 'w780'): string | null {
  return path ? `${TMDB_IMAGE_URL}/${size}${path}` : null
}
