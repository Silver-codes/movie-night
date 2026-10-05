import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react'
import { useMediaQuery } from '../lib/useMediaQuery'
import { CloseIcon } from './NavIcons'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Dialog above everything else (also above an open `Drawer`): a bottom sheet on phones,
 * a centered card from md up. Escape closes only this dialog, not a drawer underneath.
 */
export function Modal({ open, onClose, title, children }: Props) {
  const desktop = useMediaQuery('(min-width: 768px)')
  const hidden = desktop ? { opacity: 0, scale: 0.96, y: 0 } : { opacity: 1, scale: 1, y: '100%' }
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // The capture phase on window runs before the drawer's document listener; stop it there.
      event.stopPropagation()
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
    panel.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => onEscape(event)
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-3xl border-t border-ink-700 bg-ink-900 shadow-2xl shadow-black focus:outline-none md:max-w-2xl md:rounded-3xl md:border"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-700 bg-ink-900/95 px-5 py-4 backdrop-blur sm:px-6">
              <h2 id={titleId} className="min-w-0 truncate text-xl font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full p-2 text-muted ring-1 ring-ink-700 transition hover:bg-ink-700 hover:text-fg"
              >
                <CloseIcon className="size-5" />
              </button>
            </header>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
