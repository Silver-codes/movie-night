type Props = {
  filled: boolean
  className?: string
}

/** A rounded five-point star; color comes from `currentColor`. */
export function StarIcon({ filled, className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.87l-5.5 2.88 1.05-6.12L3.1 9.3l6.15-.9z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
        opacity={filled ? 1 : 0.45}
      />
    </svg>
  )
}
