import { useId, useState } from 'react'
import { useUpdatePerson } from '../api/peopleHooks'
import type { PersonColor, PersonProfileUpdate } from '../api/types'
import { checkName, isSingleEmoji, NAME_MAX_LENGTH, PERSON_COLORS } from '../lib/personProfiles'
import type { PersonInfo } from '../people'
import { PersonAvatar } from './PersonAvatar'

const EMOJI_SUGGESTIONS = ['🐻', '🍪', '🦊', '🐱', '🐶', '🐼', '🐸', '🦄', '🐧', '🐙', '🍿', '🌙', '⭐', '🌸', '🍕', '👻']

const COLORS = Object.keys(PERSON_COLORS) as PersonColor[]

type Props = {
  person: PersonInfo
  other: PersonInfo
}

/**
 * Name, emoji and color of one person. Emoji and color save on tap, the name on blur or Enter
 * (an invalid name goes back to the saved one). Everything else in the app updates right away.
 */
export function PersonProfileEditor({ person, other }: Props) {
  const update = useUpdatePerson()
  const [name, setName] = useState(person.name)
  const [customEmoji, setCustomEmoji] = useState('')
  const nameId = useId()
  const errorId = useId()
  const emojiLabelId = useId()
  const colorLabelId = useId()
  const checked = checkName(name, other.name)
  const customInvalid = customEmoji.trim() !== '' && !isSingleEmoji(customEmoji)

  const save = (change: PersonProfileUpdate) => update.mutate({ id: person.id, update: change })

  const saveName = () => {
    if (checked.error) {
      setName(person.name)
    } else if (checked.name !== person.name) {
      setName(checked.name)
      save({ name: checked.name })
    }
  }

  const onCustomEmoji = (value: string) => {
    setCustomEmoji(value)
    if (isSingleEmoji(value)) {
      save({ emoji: value.trim() })
    }
  }

  return (
    <section
      aria-label={person.name}
      className={`flex flex-col gap-5 rounded-2xl border-t-2 bg-ink-900 p-4 ring-1 ring-ink-700 ${person.borderClass}`}
    >
      <div className="flex items-center gap-3">
        <PersonAvatar person={person.id} size="lg" decorative />
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            saveName()
          }}
        >
          <label htmlFor={nameId} className="text-xs font-semibold tracking-wide text-muted uppercase">
            Name
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={saveName}
            maxLength={NAME_MAX_LENGTH + 5}
            autoComplete="off"
            enterKeyHint="done"
            aria-invalid={checked.error !== null}
            aria-describedby={checked.error ? errorId : undefined}
            className={`mt-1 w-full rounded-lg border bg-ink-950 px-3 py-2 font-display text-lg font-semibold focus:outline-none ${person.textClass} ${
              checked.error ? 'border-danger' : 'border-ink-700 focus:border-accent'
            }`}
          />
          {checked.error && (
            <p id={errorId} className="mt-1 text-xs text-danger">
              {checked.error}
            </p>
          )}
        </form>
      </div>

      <div>
        <p id={emojiLabelId} className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Emoji
        </p>
        <div role="group" aria-labelledby={emojiLabelId} className="grid grid-cols-8 gap-1.5">
          {EMOJI_SUGGESTIONS.map((emoji) => {
            const selected = person.emoji === emoji
            return (
              <button
                key={emoji}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setCustomEmoji('')
                  save({ emoji })
                }}
                className={`grid aspect-square place-items-center rounded-xl text-xl transition active:scale-90 ${
                  selected ? `${person.softBgClass} ring-2 ${person.ringClass}` : 'hover:bg-ink-800'
                }`}
              >
                {emoji}
              </button>
            )
          })}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          Or type your own
          <input
            value={customEmoji}
            onChange={(event) => onCustomEmoji(event.target.value)}
            // A typed-in emoji that isn't a suggestion shows here, so it's still visibly selected.
            placeholder={EMOJI_SUGGESTIONS.includes(person.emoji) ? '' : person.emoji}
            maxLength={16}
            autoComplete="off"
            aria-invalid={customInvalid}
            className={`w-16 rounded-lg border bg-ink-950 px-2 py-1.5 text-center text-lg focus:outline-none ${
              customInvalid ? 'border-danger' : 'border-ink-700 focus:border-accent'
            }`}
          />
          {customInvalid && <span className="text-xs text-danger">Just one emoji</span>}
        </label>
      </div>

      <div>
        <p id={colorLabelId} className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Color
        </p>
        <div role="group" aria-labelledby={colorLabelId} className="flex flex-wrap gap-2.5">
          {COLORS.map((color) => {
            const { label, swatchClass } = PERSON_COLORS[color]
            const selected = person.color === color
            const taken = other.color === color
            return (
              <button
                key={color}
                type="button"
                aria-pressed={selected}
                disabled={taken}
                onClick={() => save({ color })}
                aria-label={taken ? `${label} (${other.name}'s color)` : label}
                title={taken ? `${other.name}'s color` : label}
                className={`size-10 rounded-full ${swatchClass} ring-offset-2 ring-offset-ink-900 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-25 ${
                  selected ? 'ring-2 ring-fg' : ''
                }`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
