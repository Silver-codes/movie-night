import { EmptyState } from '../components/EmptyState'
import { PickIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'

export function PickPage() {
  return (
    <>
      <PageHeader title="What are we watching?" subtitle="Go with the top rated, or let the wheel decide." />
      <EmptyState title="The wheel is being built" icon={<PickIcon className="size-7" />}>
        Top Rated, Random Wheel and Weighted Wheel are coming soon.
      </EmptyState>
    </>
  )
}
