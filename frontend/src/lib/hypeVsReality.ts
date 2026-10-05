import type { Movie } from '../api/types'

export type HypeVsReality = {
  /** Average of the hype stars that were given. */
  hype: number
  /** Average of the verdicts that were given. */
  verdict: number
  delta: number
  kind: 'better' | 'worse' | 'same'
}

function average(values: (number | null)[]): number | null {
  const given = values.filter((v): v is number => v !== null)
  return given.length > 0 ? given.reduce((a, b) => a + b, 0) / given.length : null
}

/** How the verdicts compare with the hype, or null if either side has no stars. */
export function hypeVsReality(movie: Movie): HypeVsReality | null {
  const hype = average([movie.fuf_hype, movie.cookie_hype])
  const verdict = average([movie.fuf_verdict, movie.cookie_verdict])
  if (hype === null || verdict === null) {
    return null
  }
  const delta = verdict - hype
  const kind = Math.abs(delta) < 0.5 ? 'same' : delta > 0 ? 'better' : 'worse'
  return { hype, verdict, delta, kind }
}
