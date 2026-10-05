import { useMutation, useQueryClient } from '@tanstack/react-query'
import { confirmPick, createPick } from './picks'
import { queryKeys } from './queryKeys'
import type { PickRequest } from './types'

/** Ask the server for a pick; the result has the winner and every candidate for the wheel/podium. */
export function useCreatePick() {
  return useMutation({
    mutationFn: (body: PickRequest) => createPick(body),
  })
}

/** "We're watching this!": the movie's `confirmed_pick_method` changes, so refresh movies + history. */
export function useConfirmPick() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pickId: number) => confirmPick(pickId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.movies.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.history })
    },
  })
}
