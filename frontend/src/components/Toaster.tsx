import { dismissToast, useToasts, type ToastKind } from '../lib/toast'
import { CloseIcon } from './NavIcons'

const KIND_STYLES: Record<ToastKind, { accent: string; iconColor: string; icon: string }> = {
  success: { accent: 'border-l-success', iconColor: 'text-success', icon: '✓' },
  error: { accent: 'border-l-danger', iconColor: 'text-danger', icon: '!' },
  info: { accent: 'border-l-accent', iconColor: 'text-accent', icon: '★' },
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
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-l-4 border-ink-700 bg-ink-800/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur ${KIND_STYLES[t.kind].accent}`}
        >
          <span aria-hidden="true" className={`mt-px font-bold ${KIND_STYLES[t.kind].iconColor}`}>
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
