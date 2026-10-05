import type { PickMethod } from '../api/types'

export type PickMethodInfo = {
  value: PickMethod
  label: string
  tagline: string
  /** Whether the method spins a wheel (vs. the top-rated podium). */
  isWheel: boolean
}

export const PICK_METHODS: readonly PickMethodInfo[] = [
  {
    value: 'top_rated',
    label: 'Top Rated',
    tagline: 'The highest hype total wins. Ties are settled by a coin flip.',
    isWheel: false,
  },
  {
    value: 'wheel_random',
    label: 'Random Wheel',
    tagline: 'Every movie gets an equal slice. Pure luck.',
    isWheel: true,
  },
  {
    value: 'wheel_weighted',
    label: 'Weighted Wheel',
    tagline: 'More hype, bigger slice. Unrated movies still get a sliver.',
    isWheel: true,
  },
]

export function pickMethodInfo(method: PickMethod): PickMethodInfo {
  const info = PICK_METHODS.find((m) => m.value === method)
  if (!info) {
    throw new Error(`Unknown pick method: ${method}`)
  }
  return info
}

export function pickMethodLabel(method: PickMethod): string {
  return pickMethodInfo(method).label
}

/** Pick filter: "under …" runtime limits in minutes. */
export const RUNTIME_LIMITS = [
  { value: 90, label: 'Under 1h 30m' },
  { value: 120, label: 'Under 2h' },
  { value: 150, label: 'Under 2h 30m' },
] as const

export type RuntimeLimit = (typeof RUNTIME_LIMITS)[number]['value']
