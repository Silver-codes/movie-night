import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { PickMethodInfo } from '../lib/pickMethods'

type Props = {
  method: PickMethodInfo
  icon: ReactNode
  checked: boolean
  onSelect: () => void
}

/**
 * A card that acts as a radio button (arrow keys move between the cards). Phones: a compact tile (icon over the
 * name) in a row of three, so the filters and the "in the hat" bar fit on the first screen; the page shows the
 * chosen method's description under the row.
 */
export function PickMethodCard({ method, icon, checked, onSelect }: Props) {
  return (
    <motion.label
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      // Press feedback in CSS: Motion's `whileTap` would add a second tab stop next to the radio.
      className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center ring-1 transition active:scale-[0.98] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent sm:items-start sm:gap-4 sm:p-5 sm:text-left ${
        checked
          ? 'bg-ink-800 ring-accent'
          : 'bg-ink-900 ring-ink-700 hover:ring-ink-600'
      }`}
    >
      <input
        type="radio"
        name="pick-method"
        value={method.value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition sm:size-12 ${
          checked ? 'bg-ink-700 text-fg' : 'bg-ink-800 text-muted'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display leading-tight font-semibold text-balance sm:text-xl">{method.label}</span>
        {/* Phones show the chosen method's description under the row instead; it stays here for screen readers. */}
        <span className="sr-only sm:not-sr-only sm:mt-1 sm:block sm:text-sm sm:text-muted">{method.tagline}</span>
      </span>
    </motion.label>
  )
}
