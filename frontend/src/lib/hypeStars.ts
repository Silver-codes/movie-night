import { useState } from 'react'
import type { Person, Stars } from '../api/types'

export type HypeStars = Record<Person, Stars>

/** Optional hype stars for both people while adding a movie, starting unrated. */
export function useHypeStars() {
  const [stars, setStars] = useState<HypeStars>({ fuf: null, cookie: null })
  const anyRated = stars.fuf !== null || stars.cookie !== null
  const setStar = (person: Person, value: Stars) => setStars((s) => ({ ...s, [person]: value }))
  return { stars, setStar, anyRated }
}

/** The one add button's label: "Add unrated" until someone taps a star, then "Save". */
export function addLabel(saving: boolean, anyRated: boolean): string {
  if (saving) {
    return 'Saving…'
  }
  return anyRated ? 'Save' : 'Add unrated'
}
