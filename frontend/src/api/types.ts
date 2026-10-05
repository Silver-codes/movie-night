// Mirrors of the backend schemas (backend/app/models.py, app/tmdb.py, app/api/*.py).
// Dates are ISO strings: `date` → "YYYY-MM-DD", `datetime` → full ISO timestamp.

export type Person = 'fuf' | 'cookie'

export type MovieStatus = 'watchlist' | 'watched'

export type PickMethod = 'top_rated' | 'wheel_random' | 'wheel_weighted'

export type MovieSort = 'added' | 'title' | 'runtime' | 'hype_total' | 'tmdb_rating'

/** 1–5 stars, or null when not rated. */
export type Stars = number | null

/** `MovieRead` */
export type Movie = {
  id: number
  tmdb_id: number
  title: string
  year: number | null
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  /** Minutes */
  runtime: number | null
  genres: string[]
  tmdb_rating: number | null
  status: MovieStatus
  fuf_hype: Stars
  cookie_hype: Stars
  watched_on: string | null
  fuf_verdict: Stars
  cookie_verdict: Stars
  fuf_note: string | null
  cookie_note: string | null
  added_at: string
  /** Latest confirmed pick; with status "watchlist" it means "rate it after watching". */
  confirmed_pick_method: PickMethod | null
  /** Sum of both hype stars, nulls as 0. */
  hype_total: number
  skipped_tonight: boolean
  is_pickable: boolean
}

/** `MovieSave`: POST /api/movies body; the rest comes from TMDB. */
export type MovieSave = {
  tmdb_id: number
  fuf_hype?: Stars
  cookie_hype?: Stars
}

/** `MovieUpdate`: PATCH body. Omitted fields stay as they are; null clears a star or note. */
export type MovieUpdate = {
  skipped_tonight?: boolean
  status?: MovieStatus
  fuf_hype?: Stars
  cookie_hype?: Stars
  watched_on?: string | null
  fuf_verdict?: Stars
  cookie_verdict?: Stars
  fuf_note?: string | null
  cookie_note?: string | null
}

/** `MovieWatched`: omit `watched_on` to use tonight's movie-night date. */
export type MovieWatched = {
  watched_on?: string
  fuf_verdict?: Stars
  cookie_verdict?: Stars
  fuf_note?: string | null
  cookie_note?: string | null
}

/** Query params of GET /api/movies. */
export type MovieFilters = {
  status?: MovieStatus
  genre?: string
  /** Missing hype on the watchlist, missing verdict once watched. */
  unrated_by?: Person
  sort?: MovieSort
}

/** GET /api/search result. */
export type SearchResult = {
  tmdb_id: number
  title: string
  year: number | null
  overview: string | null
  poster_url: string | null
  tmdb_rating: number | null
  already_saved: boolean
}

export type PickRequest = {
  method: PickMethod
  /** Minutes; movies with unknown runtime are excluded. */
  max_runtime?: number
  genre?: string
}

export type PickCandidate = {
  movie: Movie
  weight: number
  probability: number
}

export type PickResult = {
  pick_id: number
  method: PickMethod
  winner: Movie
  /** Display order (wheel slices / top-rated ranking); probabilities sum to 1. */
  candidates: PickCandidate[]
}

export type PickRead = {
  id: number
  movie_id: number
  method: PickMethod
  confirmed: boolean
  picked_at: string
}

export type HistoryEntry = Movie & {
  average_verdict: number | null
}

export type PersonStats = {
  average_verdict: number | null
  rated_count: number
}

export type Disagreement = {
  movie: HistoryEntry
  difference: number
}

export type HistoryStats = {
  total_watched: number
  total_hours: number
  top_genre: string | null
  highest_rated: HistoryEntry | null
  people: Record<Person, PersonStats>
  biggest_disagreement: Disagreement | null
}

export type HistoryRead = {
  movies: HistoryEntry[]
  stats: HistoryStats
}

export type HealthResponse = {
  status: string
  tmdb_configured: boolean
}
