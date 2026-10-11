import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PickCandidate } from '../api/types'
import { playTick } from '../lib/tick'
import {
  buildSlices,
  fitLabels,
  readsUpsideDown,
  shortTitles,
  sliceAtPointer,
  slicePath,
  targetRotation,
} from '../lib/wheel'

type Props = {
  candidates: PickCandidate[]
  winnerId: number
  /** A new value (the pick id) starts a new spin, continuing from where the wheel stopped. */
  spinKey: string
  showPercent: boolean
  sound: boolean
  onDone: () => void
  /** When set (the wheel has landed and may spin again), tapping the wheel calls it. */
  onSpinAgain?: () => void
  /** Called with the candidate's index each time a new slice passes under the pointer. */
  onPointerChange?: (index: number) => void
}

const SIZE = 400
const C = SIZE / 2
const R = 186
const HUB = 30
const BULBS = 28

// Three alternating fills, so neighbours always differ (also where the last slice meets the first).
const FILLS = ['fill-ink-800', 'fill-ink-700', 'fill-ink-600'] as const

function sliceFill(index: number, count: number): string {
  if (count > 1 && index === count - 1 && index % 3 === 0) {
    return FILLS[1]
  }
  return FILLS[index % 3]
}

/** Spin ends with a long, gentle slow-down. */
const SPIN_EASE = [0.12, 0.6, 0.08, 1] as const
/** The first spin on this stage gets the full build-up; spinning again is about getting a new answer. */
const FIRST_SPIN = { seconds: 5.8, minTurns: 6 }
const RESPIN = { seconds: 3.4, minTurns: 3 }
/** Skipping: a quick, confident slow-down onto the spot the spin was already heading for. */
const SKIP_SECONDS = 0.6
const SKIP_EASE = [0.16, 1, 0.3, 1] as const

/** The SVG wheel; it always lands on the backend's winner. */
export function SpinWheel({
  candidates,
  winnerId,
  spinKey,
  showPercent,
  sound,
  onDone,
  onSpinAgain,
  onPointerChange,
}: Props) {
  const rotation = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  const [landedKey, setLandedKey] = useState<string | null>(null)
  const landed = landedKey === spinKey

  const slices = useMemo(() => buildSlices(candidates.map((c) => c.probability)), [candidates])
  const winnerIndex = candidates.findIndex((c) => c.movie.id === winnerId)

  const labels = useMemo(() => {
    // A series on the wheel loses its shared start, so its slices don't all read "Harry Potte…".
    const titles = shortTitles(candidates.map((c) => c.movie.title))
    const layout = slices.map((slice, i) => {
      const sweep = slice.end - slice.start
      const arcAt = (radius: number) => (2 * Math.PI * radius * sweep) / 360
      // Arc length at the label's radius caps the font size; tiny slices get no label.
      const arc = arcAt(R * 0.62)
      const widest = Math.min(15, Math.max(8, arc * 0.5))
      // Near the hub slices are narrow; below ~18° neighbouring percentages would overlap.
      const showPct = showPercent && sweep >= 18
      const length = titles[i].length
      // A long title gets a smaller font (down to a size still readable from the couch) before it's cut.
      // (The epsilon: a title that fits exactly mustn't lose its last letter to floating point.)
      const withFont = (room: number, fontSize: number) => ({
        fontSize,
        maxChars: Math.max(3, Math.floor(room / (fontSize * 0.56) + 1e-6)),
      })
      const fit = (room: number) =>
        withFont(room, Math.min(widest, Math.max(Math.min(widest, 10), room / (length * 0.56))))
      const fullRoom = R - 18 - (HUB + 8)
      const inline = fit(showPct ? R - 18 - (HUB + 32) : fullRoom)
      if (showPct && inline.maxChars < length) {
        // The odds by the hub would cut the title: on a slice wide enough for two lines, they go under the
        // title at the rim instead, and the title gets the whole radius. The narrowest point is the title's hub
        // end, so a smaller font (down to the couch floor of 10) can make the lines fit there.
        const preferred = fit(fullRoom)
        for (const option of [preferred, withFont(fullRoom, Math.min(preferred.fontSize, 10))]) {
          const titleEnd = R - 16 - Math.min(length, option.maxChars) * 0.56 * option.fontSize
          const lines = option.fontSize + Math.min(11, option.fontSize) + 2
          if (option.maxChars >= length && arcAt(titleEnd) >= lines * 1.25) {
            return { show: true, ...option, showPct, stacked: true }
          }
        }
        // Too narrow for two lines: the title wins and the odds stay in the legend and the pointer readout.
        if (preferred.maxChars >= length) {
          return { show: arc >= 9, ...preferred, showPct: false, stacked: false }
        }
      }
      return { show: arc >= 9, ...inline, showPct, stacked: false }
    })
    const texts = fitLabels(titles, layout.map((l) => l.maxChars))
    return layout.map((l, i) => ({ ...l, text: texts[i] }))
  }, [slices, candidates, showPercent])

  // Latest callbacks/flags without restarting the spin when they change.
  const latest = useRef({ onDone, sound, onPointerChange })
  useEffect(() => {
    latest.current = { onDone, sound, onPointerChange }
  })
  // The spin that already finished; a later re-run (e.g. the reduced-motion setting changing) mustn't spin it again.
  const completedKey = useRef<string | null>(null)
  /** Spins finished on this wheel; after the first, spins are shorter. Counted on finish, so StrictMode's re-run doesn't count. */
  const finishedSpins = useRef(0)
  /** Cuts the running spin short; null when nothing is spinning (or it's already being skipped). */
  const skip = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (completedKey.current === spinKey) {
      return
    }
    const finish = () => {
      skip.current = null
      completedKey.current = spinKey
      finishedSpins.current += 1
      setLandedKey(spinKey)
      latest.current.onDone()
    }
    const slice = slices[winnerIndex]
    if (!slice) {
      // The backend always includes the winner; if it ever doesn't, show the winner without a spin.
      console.warn(`Pick winner ${winnerId} is not among the wheel's candidates`)
      finish()
      return
    }
    const spin = finishedSpins.current === 0 ? FIRST_SPIN : RESPIN
    // Reduced motion: no extra full turns, just a short glide to the winner.
    const target = targetRotation(rotation.get(), slice, reduceMotion ? 0 : spin.minTurns + Math.floor(Math.random() * 3))
    let lastIndex = sliceAtPointer(slices, rotation.get())
    latest.current.onPointerChange?.(lastIndex)
    const onUpdate = (value: number) => {
      const index = sliceAtPointer(slices, value)
      if (index !== lastIndex) {
        lastIndex = index
        latest.current.onPointerChange?.(index)
        if (latest.current.sound && slices.length > 1) {
          playTick()
        }
      }
    }
    let controls = animate(rotation, target, {
      duration: reduceMotion ? 0.8 : spin.seconds,
      ease: reduceMotion ? 'easeOut' : SPIN_EASE,
      onUpdate,
      onComplete: finish,
    })
    skip.current = () => {
      skip.current = null
      controls.stop()
      // The same landing spot without the remaining full turns, so the result can't change.
      const now = rotation.get()
      const rest = (((target - now) % 360) + 360) % 360
      controls = animate(rotation, now + rest, { duration: SKIP_SECONDS, ease: SKIP_EASE, onUpdate, onComplete: finish })
    }
    return () => {
      skip.current = null
      controls.stop()
    }
  }, [spinKey, slices, winnerIndex, winnerId, rotation, reduceMotion])

  // Space or Enter skips the spin, unless focus is on another control (which keeps its own keys).
  const spinning = !landed
  useEffect(() => {
    if (!spinning) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat || !skip.current) {
        return
      }
      if (e.target instanceof Element && e.target.closest('button, a, input, select, textarea, [role="radio"]')) {
        return
      }
      e.preventDefault()
      skip.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spinning])

  const winner = candidates[winnerIndex]

  return (
    // Phones: as wide as the screen allows. Laptops/TVs: as tall as the screen allows under the nav and the
    // stage's header row, the sound row below and the page's padding (~18rem), so the whole stage fits the
    // window without scrolling; labels scale with it (SVG units).
    <div className="relative mx-auto w-full max-w-md lg:max-w-[max(28rem,calc(100dvh-18rem))]">
      {/* Pointer at 12 o'clock */}
      <svg
        viewBox="0 0 40 44"
        aria-hidden="true"
        className="absolute top-0 left-1/2 z-10 w-9 -translate-x-1/2 -translate-y-1 drop-shadow-[0_4px_6px_rgb(0_0_0/0.6)] lg:w-[8%] lg:-translate-y-2"
      >
        <path d="M20 42 4 8a16 16 0 0 1 32 0Z" className="fill-fg" />
        <circle cx="20" cy="12" r="5" className="fill-ink-950" />
      </svg>

      <button
        type="button"
        // While it spins, a tap skips to the result; once landed, it spins again (when allowed).
        onClick={landed ? onSpinAgain : () => skip.current?.()}
        disabled={landed && !onSpinAgain}
        aria-label={landed ? (onSpinAgain ? 'Spin the wheel again' : undefined) : 'Skip to the result'}
        // Clipped to the circle: the spinning square's corners would otherwise widen the page.
        className="block w-full cursor-pointer overflow-hidden rounded-full shadow-[0_20px_40px_rgb(0_0_0/0.55)] transition-transform enabled:hover:scale-[1.01] enabled:active:scale-[0.99] disabled:cursor-default"
      >
        <motion.div style={{ rotate: rotation }} className="aspect-square w-full">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={
              landed && winner
                ? `Wheel with ${candidates.length} movies. It landed on ${winner.movie.title}.`
                : `Wheel with ${candidates.length} movies, spinning.`
            }
            className="size-full"
          >
            <circle cx={C} cy={C} r={C - 2} className="fill-ink-950 stroke-ink-600" strokeWidth={2} />
            {Array.from({ length: BULBS }, (_, i) => {
              const angle = (i / BULBS) * 2 * Math.PI
              return (
                <circle
                  key={i}
                  cx={C + (C - 8) * Math.cos(angle)}
                  cy={C + (C - 8) * Math.sin(angle)}
                  r={2.6}
                  className={i % 2 === 0 ? 'fill-fg/70' : 'fill-fg/30'}
                />
              )
            })}

            {candidates.map((candidate, i) => {
              const slice = slices[i]
              const isWinner = landed && i === winnerIndex
              const label = labels[i]
              return (
                <g key={candidate.movie.id}>
                  <path
                    d={slicePath(C, C, R, slice)}
                    className={`stroke-ink-950 transition-[fill] duration-500 ${isWinner ? 'fill-accent' : sliceFill(i, candidates.length)}`}
                    strokeWidth={1.5}
                  />
                  {label.show && (
                    <SliceLabel
                      rotation={rotation}
                      angle={(slice.start + slice.end) / 2}
                      text={label.text}
                      fontSize={label.fontSize}
                      percent={label.showPct ? Math.round(candidate.probability * 100) : null}
                      stacked={label.stacked}
                      isWinner={isWinner}
                    />
                  )}
                </g>
              )
            })}

            {/* The hub stays neutral: the winning slice is the one blue thing on the wheel. */}
            <circle cx={C} cy={C} r={HUB} className="fill-ink-950 stroke-ink-600" strokeWidth={3} />
            <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize={26}>
              🍿
            </text>
          </svg>
        </motion.div>
      </button>
      {/* Stays mounted across spins, so the result is announced each time. */}
      <p className="sr-only" aria-live="polite">
        {landed && winner ? `The wheel landed on ${winner.movie.title}.` : ''}
      </p>
    </div>
  )
}

type SliceLabelProps = {
  rotation: MotionValue<number>
  /** Middle of the slice, degrees clockwise from 12 o'clock. */
  angle: number
  text: string
  fontSize: number
  percent: number | null
  /** The odds sit under the title at the rim (a wide slice whose title needs the whole radius), not by the hub. */
  stacked: boolean
  isWinner: boolean
}

/**
 * A slice's title (and odds) along its middle, reading outwards. On the left half of the screen it's turned
 * round to read left to right instead of upside down; it re-checks as the wheel turns, so it's right wherever
 * the wheel stops.
 */
function SliceLabel({ rotation, angle, text, fontSize, percent, stacked, isWinner }: SliceLabelProps) {
  const [flipped, setFlipped] = useState(() => readsUpsideDown(angle, rotation.get()))
  useMotionValueEvent(rotation, 'change', (value) => setFlipped(readsUpsideDown(angle, value)))

  // Flipped, the frame points from the rim to the hub, so the title starts at the rim and the odds end at the hub.
  const rim = flipped ? C - (R - 16) : C + R - 16
  const hub = flipped ? C - (HUB + 8) : C + HUB + 8
  const pctSize = Math.min(11, fontSize)
  // Stacked: the two lines are centered on the slice's middle, title above the odds as read.
  const block = fontSize + 2 + pctSize
  const titleY = stacked && percent !== null ? C - block / 2 + fontSize / 2 : C
  return (
    <g transform={`rotate(${flipped ? angle + 90 : angle - 90} ${C} ${C})`}>
      <text
        x={rim}
        y={titleY}
        textAnchor={flipped ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={fontSize}
        className={`font-sans font-semibold ${isWinner ? 'fill-ink-950' : 'fill-fg'}`}
      >
        {text}
      </text>
      {percent !== null && (
        <text
          x={stacked ? rim : hub}
          y={stacked ? C + block / 2 - pctSize / 2 : C}
          // Anchored where its line starts: at the rim like the title when stacked, at the hub otherwise.
          textAnchor={stacked !== flipped ? 'end' : 'start'}
          dominantBaseline="central"
          fontSize={pctSize}
          className={`font-sans font-medium ${isWinner ? 'fill-ink-950/70' : 'fill-muted'}`}
        >
          {percent}%
        </text>
      )}
    </g>
  )
}
