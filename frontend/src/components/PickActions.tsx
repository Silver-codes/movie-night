import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
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
  const root = useRef<HTMLDivElement>(null)
  // Undo was pressed: it's gone, and the buttons stay disabled while the movie is brought back, so focus goes to the
  // card's title (where it lands for every new pick) instead of falling to the page.
  const refocusAfterUndo = useRef(false)
  const undoing = onUndoNotTonight !== undefined
  useEffect(() => {
    if (!undoing && refocusAfterUndo.current) {
      refocusAfterUndo.current = false
      root.current?.closest('section')?.querySelector<HTMLElement>('h2[tabindex]')?.focus({ preventScroll: true })
    }
  }, [undoing])

  if (confirmed) {
    return (
      <Decided movieId={movieId} onPickSomethingElse={onPickSomethingElse} cancelling={cancelling} busy={busy} />
    )
  }

  // While "Not tonight" is on its way out, Undo is the only thing to do: the buttons step aside until the next pick.
  if (onUndoNotTonight) {
    return (
      <div ref={root}>
        <UndoNotTonight
          onUndo={() => {
            refocusAfterUndo.current = true
            onUndoNotTonight()
          }}
        />
      </div>
    )
  }

  return (
    <div ref={root} className="flex flex-col gap-3">
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
      <button
        type="button"
        onClick={onNotTonight}
        disabled={busy}
        // A full-height tap target, set a little apart from "Spin again" so a thumb doesn't slip onto it.
        className="mt-1 self-center rounded-lg px-3 py-3 text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60 sm:mt-0 sm:py-1 lg:text-lg"
      >
        Not tonight, pick again
      </button>
    </div>
  )
}

/**
 * How long the news holds its buttons back after confirming: past the second click of a double-click on "We're
 * watching this!" and the card's settling, so that click can't land on "Pick something else" or "Rate it…".
 */
const DECIDED_SETTLE_MS = 700

/**
 * After "We're watching this!": the evening's high point. The lights go down on the rest of the stage (PickPage),
 * and this speaks to the two of them. Rating comes later, so it's a quiet secondary; taking it back is quieter still.
 * Also tonight's card when /pick is opened again after confirming (`announce` off: nothing just happened).
 */
export function Decided({
  movieId,
  onPickSomethingElse,
  cancelling,
  busy,
  announce = true,
}: {
  movieId: number
  onPickSomethingElse: () => void
  cancelling: boolean
  busy: boolean
  /** Just confirmed: the news takes focus and (below lg) scrolls into view. */
  announce?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const [first, second] = usePeople()
  const root = useRef<HTMLDivElement>(null)
  const news = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const namesId = useId()
  const [settled, setSettled] = useState(!announce)
  useEffect(() => {
    if (settled) {
      return
    }
    const timer = window.setTimeout(() => setSettled(true), DECIDED_SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [settled])
  // The button that confirmed is gone; keep the keyboard (and the screen reader) on the news. Focus alone says it
  // (no live region as well, or it would be read twice): the group is named by the headline, described by the names.
  // Below lg the card sits under the wheel, so the news (and "Pick something else") is brought clear of the
  // tab bar once the card has settled into its decided shape. `nearest` leaves a card that's already in view alone.
  useEffect(() => {
    if (!announce) {
      return
    }
    news.current?.focus({ preventScroll: true })
    if (window.matchMedia('(min-width: 64rem)').matches) {
      return
    }
    const frame = window.requestAnimationFrame(() =>
      root.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }),
    )
    return () => window.cancelAnimationFrame(frame)
  }, [announce, reduceMotion])

  // No box of its own: the news is written straight onto the winner card, under a hairline, as the card's last word.
  return (
    <motion.div
      ref={root}
      initial={reduceMotion || !announce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      className="flex scroll-mb-[calc(5.5rem+env(safe-area-inset-bottom))] flex-col gap-4 border-t border-ink-700 pt-5 md:scroll-mb-6 lg:gap-5 lg:pt-6"
    >
      <div
        ref={news}
        role="group"
        tabIndex={-1}
        aria-labelledby={headingId}
        aria-describedby={namesId}
        className="flex flex-col gap-1.5 outline-none lg:gap-2"
      >
        <p
          id={headingId}
          className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance xl:[@media(min-height:56rem)]:text-4xl"
        >
          Lights down. Enjoy the movie! 🍿
        </p>
        <p id={namesId} className="text-muted lg:text-xl">
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
      {/* Inert while settling (a stray click can't reach them, and the keyboard is on the news), then they fade in. */}
      <motion.div
        inert={!settled}
        initial={reduceMotion || !announce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: (DECIDED_SETTLE_MS - 400) / 1000 }}
        className="flex flex-wrap items-center gap-x-5 gap-y-2"
      >
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
      </motion.div>
    </motion.div>
  )
}

/** Takes the place of the buttons (and the focus of "Not tonight") until the next pick starts. */
function UndoNotTonight({ onUndo }: { onUndo: () => void }) {
  const undo = useRef<HTMLButtonElement>(null)
  // The link that had focus is gone; keep the keyboard where it was.
  useEffect(() => {
    undo.current?.focus({ preventScroll: true })
  }, [])
  return (
    // As tall as the button row it replaces, so the card doesn't jump for three seconds.
    <p className="flex min-h-29 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted lg:min-h-28 lg:text-xl">
      {/* Focus lands on Undo, so it carries this line too (a screen reader hears what's happening). */}
      <span id="out-tonight-note">Out for tonight. Picking again…</span>
      <button
        ref={undo}
        type="button"
        onClick={onUndo}
        aria-describedby="out-tonight-note"
        className={secondaryButtonClass('stage')}
      >
        Undo
      </button>
    </p>
  )
}
