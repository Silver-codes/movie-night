import { useSyncExternalStore } from 'react'

// A tiny toast store that lives outside React, so anything (e.g. the QueryClient's
// global error handler) can call `toast.error(...)`. `<Toaster />` renders it.

export type ToastKind = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  kind: ToastKind
  message: string
}

const DURATION_MS: Record<ToastKind, number> = { success: 3000, info: 4000, error: 6000 }
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

function show(kind: ToastKind, message: string): number {
  const id = nextId++
  const kept = toasts.slice(-(MAX_TOASTS - 1))
  for (const dropped of toasts.slice(0, toasts.length - kept.length)) {
    clearTimeout(timers.get(dropped.id))
    timers.delete(dropped.id)
  }
  toasts = [...kept, { id, kind, message }]
  timers.set(
    id,
    setTimeout(() => dismissToast(id), DURATION_MS[kind]),
  )
  emit()
  return id
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToasts(): readonly Toast[] {
  return useSyncExternalStore(subscribe, () => toasts)
}
