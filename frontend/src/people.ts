import type { Person } from './api/types'

/**
 * Fuf and Cookie: signature color + emoji, used wherever their stars appear.
 * Class names are written out in full so Tailwind picks them up; the colors are
 * `--color-fuf` / `--color-cookie` in index.css.
 */
export type PersonInfo = {
  id: Person
  name: string
  emoji: string
  /** Text and star color. */
  textClass: string
  /** Translucent tint for avatar circles and chips. */
  softBgClass: string
  ringClass: string
  borderClass: string
}

export const PEOPLE: readonly PersonInfo[] = [
  {
    id: 'fuf',
    name: 'Fuf',
    emoji: '🐻',
    textClass: 'text-fuf',
    softBgClass: 'bg-fuf-soft',
    ringClass: 'ring-fuf',
    borderClass: 'border-fuf',
  },
  {
    id: 'cookie',
    name: 'Cookie',
    emoji: '🍪',
    textClass: 'text-cookie',
    softBgClass: 'bg-cookie-soft',
    ringClass: 'ring-cookie',
    borderClass: 'border-cookie',
  },
]

export function personInfo(id: Person): PersonInfo {
  const person = PEOPLE.find((p) => p.id === id)
  if (!person) {
    throw new Error(`Unknown person: ${id}`)
  }
  return person
}
