import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { usePeople } from '../people'
import { primaryButtonClass, secondaryButtonClass } from './buttonStyles'

type Props = {
  movieId: number
  confirmed: boolean
  confirming: boolean
  onConfirm: () => void
  /** The secondary button next to "We're watching this!" ("Spin again", "Flip again"); omitted when there's none. */
  againLabel?: string
  onAgain?: () => void
  /** After confirming: "Pick something else" takes the confirmation back and starts over. */
  onPickSomethingElse: () => void
  /** While that confirmation is being taken back. */
  cancelling?: boolean
  /** Puts the winner on "not tonight" and picks again. */
  onNotTonight: () => void
  /** Set for the moment between "Not tonight" and the new pick: the link becomes an Undo. */
  onUndoNotTonight?: () => void
  busy: boolean
}

/** What to do with tonight's pick: confirm it, try again, or leave it out. Shared by the wheel's winner and the podium. */
export function PickActions({
  movieId,
  confirmed,
  confirming,
  onConfirm,
  againLabel,
  onAgain,
  onPickSomethingElse,
  cancelling = false,
  onNotTonight,
  onUndoNotTonight,
  busy,
}: Props) {
  if (confirmed) {
    return (
      <Decided movieId={movieId} onPickSomethingElse={onPickSomethingElse} cancelling={cancelling} busy={busy} />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`${primaryButtonClass('hero')} flex-1`}
        >
          {confirming ? 'Saving…' : "We're watching this!"}
        </button>
        {againLabel && onAgain && (
          <button
            type="button"
            onClick={onAgain}
            disabled={busy}
            className={secondaryButtonClass('large')}
          >
            {againLabel}
          </button>
        )}
      </div>
      {onUndoNotTonight ? (
        <UndoNotTonight onUndo={onUndoNotTonight} />
      ) : (
        <button
          type="button"
          onClick={onNotTonight}
          disabled={busy}
          // A full-height tap target, set a little apart from "Spin again" so a thumb doesn't slip onto it.
          className="mt-1 self-center rounded-lg px-3 py-3 text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60 sm:mt-0 sm:py-1 lg:text-lg"
        >
          Not tonight, pick again
        </button>
      )}
    </div>
  )
}

/**
 * After "We're watching this!": the evening's high point. The lights go down on the rest of the stage (PickPage),
 * and this speaks to the two of them. Rating comes later, so it's a quiet secondary; taking it back is quieter still.
 */
function Decided({
  movieId,
  onPickSomethingElse,
  cancelling,
  busy,
}: {
  movieId: number
  onPickSomethingElse: () => void
  cancelling: boolean
  busy: boolean
}) {
  const reduceMotion = useReducedMotion()
  const [first, second] = usePeople()
  const heading = useRef<HTMLParagraphElement>(null)
  // The button that confirmed is gone; keep the keyboard (and the screen reader) on the news.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.div
      role="status"
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      className="flex flex-col gap-4 rounded-2xl bg-ink-800 p-5 ring-1 ring-ink-600 lg:gap-5 lg:p-6"
    >
      <div className="flex flex-col gap-1.5 lg:gap-2">
        <p
          ref={heading}
          tabIndex={-1}
          className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance outline-none xl:[@media(min-height:56rem)]:text-4xl"
        >
          Lights down. Enjoy the movie! 🍿
        </p>
        <p className="text-muted lg:text-xl">
          It's decided,{' '}
          <span className={`font-semibold ${first.textClass}`}>
            {first.emoji}&nbsp;{first.name}
          </span>{' '}
          &amp;{' '}
          <span className={`font-semibold ${second.textClass}`}>
            {second.emoji}&nbsp;{second.name}
          </span>
          .
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link to={`/watchlist?movie=${movieId}`} className={secondaryButtonClass('stage')}>
          Rate it after watching
        </Link>
        <button
          type="button"
          onClick={onPickSomethingElse}
          disabled={busy}
          className="rounded-lg py-2 text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60 lg:text-lg"
        >
          {cancelling ? 'Cancelling…' : 'Pick something else'}
        </button>
      </div>
    </motion.div>
  )
}

/** Takes the place of the "Not tonight" link (and its focus) until the next pick starts. */
function UndoNotTonight({ onUndo }: { onUndo: () => void }) {
  const undo = useRef<HTMLButtonElement>(null)
  // The link that had focus is gone; keep the keyboard where it was.
  useEffect(() => {
    undo.current?.focus({ preventScroll: true })
  }, [])
  return (
    <p className="flex items-center justify-center gap-3 self-center text-sm text-muted lg:text-lg">
      {/* Focus lands on Undo, so it carries this line too (a screen reader hears what's happening). */}
      <span id="out-tonight-note">Out for tonight. Picking again…</span>
      <button
        ref={undo}
        type="button"
        onClick={onUndo}
        aria-describedby="out-tonight-note"
        className="-my-1.5 rounded-lg px-3 py-1.5 font-semibold text-fg ring-1 ring-ink-600 transition hover:bg-ink-800"
      >
        Undo
      </button>
    </p>
  )
}
