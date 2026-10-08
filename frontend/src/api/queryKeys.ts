import type { MovieFilters } from './types'

/**
 * TanStack Query keys in one place. Invalidate `queryKeys.movies.all` after a movie changes
 * (it covers every list and detail query), plus `queryKeys.history` / search as needed.
 */
export const queryKeys = {
  health: ['health'] as const,
  movies: {
    all: ['movies'] as const,
    list: (filters: MovieFilters = {}) => ['movies', 'list', filters] as const,
    detail: (id: number) => ['movies', 'detail', id] as const,
  },
  search: (q: string) => ['search', q] as const,
  history: ['history'] as const,
  people: ['people'] as const,
}
