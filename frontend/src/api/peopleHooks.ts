import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { readCachedProfiles } from '../lib/personProfiles'
import { fetchPeople, updatePerson } from './people'
import { queryKeys } from './queryKeys'
import type { Person, PersonProfile, PersonProfileUpdate } from './types'

/**
 * Both profiles in `PEOPLE` order. Starts from the last visit's copy (or the defaults),
 * marked as old so the server's version is fetched once when the app loads.
 */
export function usePeopleProfiles() {
  return useQuery({
    queryKey: queryKeys.people,
    queryFn: ({ signal }) => fetchPeople(signal),
    initialData: readCachedProfiles,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60_000,
  })
}

type UpdateVars = { id: Person; update: PersonProfileUpdate }

/** Optimistic: the name, emoji or color changes everywhere at once and is rolled back if the save fails. */
export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, update }: UpdateVars) => updatePerson(id, update),
    onMutate: async ({ id, update }: UpdateVars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.people })
      const previous = queryClient.getQueryData<PersonProfile[]>(queryKeys.people)
      queryClient.setQueryData<PersonProfile[]>(queryKeys.people, (profiles) =>
        profiles?.map((profile) => (profile.id === id ? { ...profile, ...update } : profile)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.people, context.previous)
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<PersonProfile[]>(queryKeys.people, (profiles) =>
        profiles?.map((profile) => (profile.id === saved.id ? saved : profile)),
      )
    },
  })
}
