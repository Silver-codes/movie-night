import { usePeopleProfiles } from './api/peopleHooks'
import type { Person, PersonColor } from './api/types'

/**
 * The two person slots. `fuf` / `cookie` are internal IDs (API fields, CSS tokens); what people see
 * (name, emoji, color) is their editable profile, from `usePeople()` / `usePersonInfo()`.
 * Class names are written out in full so Tailwind picks them up; the colors are
 * `--color-fuf` / `--color-cookie` in index.css, pointed at the chosen palette color at runtime.
 */
export type PersonSlot = {
  id: Person
  /** Text and star color. */
  textClass: string
  /** Translucent tint for avatar circles and chips. */
  softBgClass: string
  ringClass: string
}

export type PersonInfo = PersonSlot & {
  name: string
  emoji: string
  color: PersonColor
}

export const PEOPLE: readonly PersonSlot[] = [
  {
    id: 'fuf',
    textClass: 'text-fuf',
    softBgClass: 'bg-fuf-soft',
    ringClass: 'ring-fuf',
  },
  {
    id: 'cookie',
    textClass: 'text-cookie',
    softBgClass: 'bg-cookie-soft',
    ringClass: 'ring-cookie',
  },
]

/** Both people with their current name, emoji and color, in `PEOPLE` order. */
export function usePeople(): PersonInfo[] {
  const { data: profiles } = usePeopleProfiles()
  return PEOPLE.map((slot) => {
    const profile = profiles.find((p) => p.id === slot.id)
    if (!profile) {
      throw new Error(`No profile for ${slot.id}`)
    }
    return { ...profile, ...slot }
  })
}

export function usePersonInfo(id: Person): PersonInfo {
  const person = usePeople().find((p) => p.id === id)
  if (!person) {
    throw new Error(`Unknown person: ${id}`)
  }
  return person
}
