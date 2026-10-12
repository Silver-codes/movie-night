// Shared button looks, so actions read the same on every page.

/**
 * Sizes, for buttons and links alike:
 * - `md`: actions in empty/error states and cards.
 * - `stage`: on the Pick stage, growing from `lg` so it reads from the couch.
 * - `bar`: the sticky "in the hat" bar.
 * - `hero`: the one decision on screen ("We're watching this!").
 * - `large`: the button beside the hero, as tall but with smaller text, so the hero stays first.
 */
export type ButtonSize = 'md' | 'stage' | 'bar' | 'hero' | 'large'

const SIZES: Record<ButtonSize, string> = {
  md: 'px-5 py-2.5',
  stage: 'px-5 py-2.5 lg:py-3 lg:text-lg',
  bar: 'px-6 py-3',
  hero: 'px-5 py-3.5 text-lg lg:py-4 lg:text-2xl',
  large: 'px-5 py-3.5 lg:px-7 lg:py-4 lg:text-xl',
}

const BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50'

/** The main accent button: the one action that moves things forward. */
export function primaryButtonClass(size: ButtonSize = 'md'): string {
  return `${BASE} bg-accent text-ink-950 hover:bg-accent-strong ${SIZES[size]}`
}

/** The ringed button beside it: the other way to go. */
export function secondaryButtonClass(size: ButtonSize = 'md'): string {
  return `${BASE} text-fg ring-1 ring-ink-600 hover:bg-ink-800 ${SIZES[size]}`
}

export const PRIMARY_BUTTON_CLASS = primaryButtonClass()
