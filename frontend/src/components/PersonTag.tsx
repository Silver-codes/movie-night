import type { Person } from '../api/types'
import { personInfo } from '../people'
import { PersonAvatar } from './PersonAvatar'

/** Avatar + name in the person's color. */
export function PersonTag({ person }: { person: Person }) {
  const info = personInfo(person)
  return (
    <span className={`inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 ${info.softBgClass}`}>
      <PersonAvatar person={person} size="sm" />
      <span className={`text-sm font-semibold ${info.textClass}`}>{info.name}</span>
    </span>
  )
}
