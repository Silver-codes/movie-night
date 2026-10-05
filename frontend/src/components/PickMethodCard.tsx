import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { PickMethodInfo } from '../lib/pickMethods'

type Props = {
  method: PickMethodInfo
  icon: ReactNode
  checked: boolean
  onSelect: () => void
}

/** A big card that acts as a radio button (arrow keys move between the cards). */
export function PickMethodCard({ method, icon, checked, onSelect }: Props) {
  return (
    <motion.label
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`relative flex cursor-pointer gap-4 rounded-2xl p-4 ring-1 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent sm:flex-col sm:p-5 ${
        checked
          ? 'bg-accent-soft ring-accent shadow-lg shadow-accent/10'
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
        className={`grid size-12 shrink-0 place-items-center rounded-xl transition ${
          checked ? 'bg-accent text-ink-950' : 'bg-ink-800 text-muted'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-xl font-semibold">{method.label}</span>
        <span className="mt-1 block text-sm text-muted">{method.tagline}</span>
      </span>
    </motion.label>
  )
}
