import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react'
import { restoreFocus, trapTab } from '../lib/dialogFocus'
import { useMediaQuery } from '../lib/useMediaQuery'
import { CloseIcon } from './NavIcons'

type Props = {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/**
 * Modal panel: a bottom sheet on phones, a right-side drawer from md up.
 * Escape closes it; while open the page doesn't scroll and focus moves to the panel itself (no ring;
 * Tab then reaches the close button), stays inside (Tab wraps around) and is restored on close.
 */
export function Drawer({ open, onClose, label, children }: Props) {
  const desktop = useMediaQuery('(min-width: 768px)')
  const hidden = desktop ? { x: '100%' } : { y: '100%' }
  const panel = useRef<HTMLDivElement>(null)
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  })

  useEffect(() => {
    if (!open) {
      return
    }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => onEscape(event)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreFocus(previousFocus)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onKeyDown={trapTab}
            initial={hidden}
            animate={{ x: 0, y: 0 }}
            exit={hidden}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border-t border-ink-700 bg-ink-900 shadow-2xl shadow-black md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[30rem] md:rounded-none md:border-t-0 md:border-l focus:outline-none"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 rounded-full bg-ink-950/70 p-2 text-fg ring-1 ring-white/10 backdrop-blur transition hover:bg-ink-700"
            >
              <CloseIcon className="size-5" />
            </button>
            <div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
