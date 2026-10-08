import { apiFetch } from './client'
import type { Person, PersonProfile, PersonProfileUpdate } from './types'

export function fetchPeople(signal?: AbortSignal): Promise<PersonProfile[]> {
  return apiFetch<PersonProfile[]>('/api/people', { signal })
}

export function updatePerson(id: Person, body: PersonProfileUpdate): Promise<PersonProfile> {
  return apiFetch<PersonProfile>(`/api/people/${id}`, { method: 'PATCH', json: body })
}
