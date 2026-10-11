import { useSyncExternalStore } from 'react'

// A tiny toast store that lives outside React, so anything (e.g. the QueryClient's
// global error handler) can call `toast.error(...)`. `<Toaster />` renders it.

export type ToastKind = 'success' | 'error' | 'info'

/** A button on the toast ("Undo"). Clicking it runs `onClick` and dismisses the toast. */
export type ToastAction = {
  label: string
  onClick: () => void
}

export type Toast = {
  id: number
  kind: ToastKind
  message: string
  action?: ToastAction
}

const DURATION_MS: Record<ToastKind, number> = { success: 3000, info: 4000, error: 6000 }
/** Toasts with an action stay longer, so there's time to reach the button from the sofa. */
const ACTION_DURATION_MS = 8000
const MAX_TOASTS = 4

let toasts: readonly Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function dismissToast(id: number): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Holds the countdown while the pointer or focus is on the toast, so an action can't vanish while you reach for it. */
export function pauseToast(id: number): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
}

/** Starts (or restarts, after a pause) the toast's full countdown. */
export function resumeToast(id: number): void {
  const toast = toasts.find((t) => t.id === id)
  if (toast && !timers.has(id)) {
    const duration = toast.action ? ACTION_DURATION_MS : DURATION_MS[toast.kind]
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration),
    )
  }
}

type ShowOptions = { action?: ToastAction }

function show(kind: ToastKind, message: string, { action }: ShowOptions = {}): number {
  const id = nextId++
  const kept = toasts.slice(-(MAX_TOASTS - 1))
  for (const dropped of toasts.slice(0, toasts.length - kept.length)) {
    clearTimeout(timers.get(dropped.id))
    timers.delete(dropped.id)
  }
  toasts = [...kept, { id, kind, message, action }]
  resumeToast(id)
  emit()
  return id
}

export const toast = {
  success: (message: string, options?: ShowOptions) => show('success', message, options),
  error: (message: string, options?: ShowOptions) => show('error', message, options),
  info: (message: string, options?: ShowOptions) => show('info', message, options),
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToasts(): readonly Toast[] {
  return useSyncExternalStore(subscribe, () => toasts)
}
