import { useState } from 'react'
import { PEOPLE, usePeople } from '../people'
import { PeopleSettingsModal } from './PeopleSettingsModal'
import { PersonAvatar } from './PersonAvatar'

/** Both avatars in the header; opens the name / emoji / color settings. */
export function PeopleButton() {
  const [open, setOpen] = useState(false)
  const [a, b] = usePeople()
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${a.name} and ${b.name}: change names`}
        title="Change names"
        className="flex items-center rounded-full p-1 transition hover:bg-ink-800 active:scale-95"
      >
        {PEOPLE.map((person, index) => (
          <span key={person.id} className={index > 0 ? '-ml-2.5' : ''}>
            <PersonAvatar person={person.id} size="md" decorative />
          </span>
        ))}
      </button>
      <PeopleSettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
