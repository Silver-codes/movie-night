import { dismissToast, useToasts, type ToastKind } from '../lib/toast'
import { CloseIcon } from './NavIcons'

// The kind shows as a small tinted badge in front of the message (not as a colored side border).
const KIND_STYLES: Record<ToastKind, { badge: string; icon: string }> = {
  success: { badge: 'bg-success/15 text-success', icon: '✓' },
  error: { badge: 'bg-danger/15 text-danger', icon: '!' },
  info: { badge: 'bg-ink-600 text-fg', icon: '★' },
}

/** Renders the toast store: at the top on phones (clear of the tab bar and sticky action bars), bottom-right on desktop. */
export function Toaster() {
  const toasts = useToasts()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:top-auto md:right-6 md:bottom-6 md:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-ink-800/95 px-4 py-3 shadow-2xl shadow-black/50 ring-1 ring-ink-700 backdrop-blur"
        >
          <span
            aria-hidden="true"
            className={`grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${KIND_STYLES[t.kind].badge}`}
          >
            {KIND_STYLES[t.kind].icon}
          </span>
          <p className="flex-1 text-sm">{t.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="-m-2 rounded-md p-2 text-muted transition hover:text-fg"
            aria-label="Dismiss"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
