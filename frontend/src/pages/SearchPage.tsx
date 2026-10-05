import { EmptyState } from '../components/EmptyState'
import { SearchIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { PosterGridSkeleton } from '../components/PosterGridSkeleton'

export function SearchPage() {
  return (
    <>
      <PageHeader title="Find a movie" subtitle="Search TMDB and add what you want to watch to your watchlist." />
      <div className="flex flex-col gap-10">
        <EmptyState title="Search is coming soon" icon={<SearchIcon className="size-7" />}>
          The search bar and quick-rate popover arrive in the next step.
        </EmptyState>
        <PosterGridSkeleton count={6} />
      </div>
    </>
  )
}
