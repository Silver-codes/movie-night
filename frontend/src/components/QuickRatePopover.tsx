import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Person, Stars } from '../api/types'
import { PEOPLE } from '../people'
import { StarRating } from './StarRating'

export type HypeStars = Record<Person, Stars>

type Props = {
  title: string
  saving: boolean
  onSave: (stars: HypeStars) => void
  /** `returnFocus` is true for Escape: the card should take focus back. */
  onClose: (returnFocus: boolean) => void
}

/**
 * "Add to watchlist" panel that covers the card's poster: optional hype stars for both,
 * then one button ("Add unrated" until someone rates). Escape, a click outside or tabbing out closes it.
 */
export function QuickRatePopover({ title, saving, onSave, onClose }: Props) {
  const [stars, setStars] = useState<HypeStars>({ fuf: null, cookie: null })
  const panel = useRef<HTMLDivElement>(null)
  const anyRated = stars.fuf !== null || stars.cookie !== null

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus()

    function onPointerDown(event: PointerEvent) {
      if (!panel.current?.contains(event.target as Node)) {
        onClose(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose(true)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <motion.div
      ref={panel}
      role="dialog"
      aria-label={`Add ${title} to the watchlist`}
      onBlur={(event) => {
        // Focus moved to something outside (e.g. Tab past the last button).
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          onClose(false)
        }
      }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute inset-0 z-10 flex flex-col justify-end gap-3 rounded-xl bg-ink-950/85 p-2.5 ring-1 ring-white/10 backdrop-blur-md"
    >
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Hype it?</p>
        {anyRated && <p className="mt-0.5 text-[11px] leading-tight text-faint">Tap a star again to clear</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        {PEOPLE.map((person) => (
          <StarRating
            key={person.id}
            person={person.id}
            size="xs"
            value={stars[person.id]}
            onChange={(value) => setStars((s) => ({ ...s, [person.id]: value }))}
          />
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(stars)}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60"
      >
        {saving ? 'Saving…' : anyRated ? 'Save' : 'Add unrated'}
      </button>
    </motion.div>
  )
}
