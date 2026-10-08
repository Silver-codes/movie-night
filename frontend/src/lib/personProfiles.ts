import type { PersonColor, PersonProfile } from '../api/types'

/**
 * The colors people can choose; the values are the `--color-swatch-*` tokens in index.css.
 * Class names are written out in full so Tailwind picks them up.
 */
export const PERSON_COLORS: Record<PersonColor, { label: string; swatchClass: string }> = {
  lavender: { label: 'Lavender', swatchClass: 'bg-swatch-lavender' },
  rose: { label: 'Rose', swatchClass: 'bg-swatch-rose' },
  mint: { label: 'Mint', swatchClass: 'bg-swatch-mint' },
  amber: { label: 'Amber', swatchClass: 'bg-swatch-amber' },
  coral: { label: 'Coral', swatchClass: 'bg-swatch-coral' },
  sky: { label: 'Sky', swatchClass: 'bg-swatch-sky' },
}

/** Mirrors `DEFAULT_PROFILES` in backend/app/models.py. */
export const DEFAULT_PROFILES: readonly PersonProfile[] = [
  { id: 'fuf', name: 'Fuf', emoji: '🐻', color: 'lavender' },
  { id: 'cookie', name: 'Cookie', emoji: '🍪', color: 'rose' },
]

export const NAME_MAX_LENGTH = 20

const CACHE_KEY = 'movie-night:people'

function isProfile(value: unknown, index: number): value is PersonProfile {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const { id, name, emoji, color } = value as Record<string, unknown>
  return (
    id === DEFAULT_PROFILES[index]?.id &&
    typeof name === 'string' &&
    typeof emoji === 'string' &&
    typeof color === 'string' &&
    color in PERSON_COLORS
  )
}

/** The profiles from the last visit (so names and colors don't flash on load), or the defaults. */
export function readCachedProfiles(): PersonProfile[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    if (Array.isArray(parsed) && parsed.length === DEFAULT_PROFILES.length && parsed.every(isProfile)) {
      return parsed
    }
  } catch {
    // Blocked storage or a broken value: fall back to the defaults.
  }
  return [...DEFAULT_PROFILES]
}

export function writeCachedProfiles(profiles: PersonProfile[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(profiles))
  } catch {
    // Storage blocked: the server still has them; there may just be a flash of the defaults.
  }
}

/** Points `--color-fuf` / `--color-cookie` (and with them the `-soft` tints, see index.css) at the chosen colors. */
export function applyPersonColors(profiles: PersonProfile[]): void {
  const style = document.documentElement.style
  for (const profile of profiles) {
    style.setProperty(`--color-${profile.id}`, `var(--color-swatch-${profile.color})`)
  }
}

/** The trimmed name, plus why it can't be saved (null when it can). */
export function checkName(name: string, otherName: string): { name: string; error: string | null } {
  const trimmed = name.trim()
  if (trimmed === '') {
    return { name: trimmed, error: 'A name is needed' }
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return { name: trimmed, error: `At most ${NAME_MAX_LENGTH} characters` }
  }
  if (trimmed.toLocaleLowerCase() === otherName.trim().toLocaleLowerCase()) {
    return { name: trimmed, error: 'The other person already has that name' }
  }
  return { name: trimmed, error: null }
}

/** Exactly one emoji: one grapheme, which may be several code points (👩🏽‍🚀, flags). */
export function isSingleEmoji(value: string): boolean {
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value.trim())]
  return graphemes.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(graphemes[0].segment)
}
