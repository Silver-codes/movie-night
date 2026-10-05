/** A shimmering placeholder block; size and shape come from `className`. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer rounded-lg bg-linear-to-r from-ink-800 via-ink-700 to-ink-800 bg-size-[200%_100%] ${className}`}
    />
  )
}
