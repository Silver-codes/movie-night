import type { PickMethod } from '../api/types'
import { pickMethodLabel } from '../lib/pickMethods'
import { PickIcon, TrophyIcon, WeightedWheelIcon } from './NavIcons'

// Same icons as the method cards on the Pick page.
const ICONS = { top_rated: TrophyIcon, wheel_random: PickIcon, wheel_weighted: WeightedWheelIcon } as const

/** How a movie was picked: Top Rated / Random Wheel / Weighted Wheel. Renders nothing without a pick. */
export function PickMethodBadge({ method }: { method: PickMethod | null }) {
  if (method === null) {
    return null
  }
  const Icon = ICONS[method]
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-accent ring-1 ring-accent/30">
      <Icon className="size-3.5" />
      {pickMethodLabel(method)}
    </span>
  )
}
