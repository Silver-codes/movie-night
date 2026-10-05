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
