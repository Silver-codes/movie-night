import { useEffect } from 'react'
import { usePeopleProfiles } from '../api/peopleHooks'
import { applyPersonColors, writeCachedProfiles } from '../lib/personProfiles'

/** Keeps the person color tokens and the local copy (used on the next load) in step with the profiles. */
export function PeopleSync() {
  const { data: profiles } = usePeopleProfiles()
  useEffect(() => {
    applyPersonColors(profiles)
    writeCachedProfiles(profiles)
  }, [profiles])
  return null
}
