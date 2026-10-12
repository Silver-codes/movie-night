import type { FocusEvent } from 'react'
import {
  dismissToast,
  pauseToast,
  resumeToast,
  useToasts,
  useToastsAtBottom,
  type Toast,
  type ToastKind,
} from '../lib/toast'
import { CloseIcon } from './NavIcons'

// The kind shows as a small tinted badge in front of the message (not as a colored side border).
const KIND_STYLES: Record<ToastKind, { badge: string; icon: string }> = {
  success: { badge: 'bg-success/15 text-success', icon: '✓' },
  error: { badge: 'bg-danger/15 text-danger', icon: '!' },
  info: { badge: 'bg-ink-600 text-fg', icon: '★' },
}

/**
 * Renders the toast store: bottom-right on desktop. On phones at the top (clear of the tab bar and sticky action
 * bars), or just above the tab bar while the Pick stage keeps the top for the wheel.
 */
export function Toaster() {
  const toasts = useToasts()
  const atBottom = useToastsAtBottom()
  const phonePlacement = atBottom
    ? 'bottom-[calc(5rem+env(safe-area-inset-bottom))]'
    : 'top-[calc(0.75rem+env(safe-area-inset-top))]'
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      role="region"
      className={`pointer-events-none fixed inset-x-0 ${phonePlacement} z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:top-auto md:right-6 md:bottom-6 md:items-end`}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastCard({ toast }: { toast: Toast }) {
  const { id, kind, message, action } = toast
  // Hovering or focusing the toast holds its countdown; it restarts once both the pointer and focus have left.
  const resumeUnlessFocused = (el: HTMLElement) => {
    if (!el.contains(document.activeElement)) {
      resumeToast(id)
    }
  }
  const resumeUnlessHovered = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget) && !e.currentTarget.matches(':hover')) {
      resumeToast(id)
    }
  }

  return (
    // No role of its own: the stack is the one live region, so each toast is read once.
    <div
      onPointerEnter={() => pauseToast(id)}
      onPointerLeave={(e) => resumeUnlessFocused(e.currentTarget)}
      onFocus={() => pauseToast(id)}
      onBlur={resumeUnlessHovered}
      className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-ink-800/95 px-4 py-3 shadow-2xl shadow-black/50 ring-1 ring-ink-700 backdrop-blur"
    >
      <span
        aria-hidden="true"
        className={`grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${KIND_STYLES[kind].badge}`}
      >
        {KIND_STYLES[kind].icon}
      </span>
      <p className="min-w-0 flex-1 text-sm break-words">{message}</p>
      {action && (
        <button
          type="button"
          onClick={() => {
            dismissToast(id)
            action.onClick()
          }}
          className="-my-1.5 shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-fg ring-1 ring-ink-600 transition hover:bg-ink-700"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => dismissToast(id)}
        className="-m-2 shrink-0 rounded-md p-2 text-muted transition hover:text-fg"
        aria-label="Dismiss"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  )
}
