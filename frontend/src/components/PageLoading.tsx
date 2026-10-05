/** Full-screen placeholder while the app's first page loads (before the layout can render). */
export function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="grid min-h-dvh place-items-center">
      <span className="size-8 animate-spin rounded-full border-2 border-ink-600 border-t-accent" />
    </div>
  )
}
