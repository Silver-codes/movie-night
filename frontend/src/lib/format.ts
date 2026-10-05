/** 134 → "2h 14m", 45 → "45m". */
export function formatRuntime(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) {
    return null
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) {
    return `${rest}m`
  }
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/** TMDB's 0–10 rating with one decimal, e.g. 7.83 → "7.8". */
export function formatRating(rating: number | null): string | null {
  return rating === null || rating <= 0 ? null : rating.toFixed(1)
}

/** Average stars with at most one decimal: 4 → "4", 4.5 → "4.5", 3.333 → "3.3". */
export function formatStars(stars: number): string {
  return String(Math.round(stars * 10) / 10)
}

/** "YYYY-MM-DD" → a local Date (no UTC shift). */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "2026-10-03" → "Sat, 3 Oct 2026". */
export function formatDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "2026-10-03" → "October 2026". */
export function formatMonth(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

const NIGHT_ROLLOVER_HOUR = 6

/** Tonight's movie-night date as "YYYY-MM-DD", same as the backend: local time, rolls over at 06:00. */
export function movieNightDate(now: Date = new Date()): string {
  const night = new Date(now.getTime() - NIGHT_ROLLOVER_HOUR * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${night.getFullYear()}-${pad(night.getMonth() + 1)}-${pad(night.getDate())}`
}
