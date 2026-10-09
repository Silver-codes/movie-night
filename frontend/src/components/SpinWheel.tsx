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
      // Arc length at the label's radius caps the font size; tiny slices get no label.
      const arc = (2 * Math.PI * R * 0.62 * sweep) / 360
      const widest = Math.min(15, Math.max(8, arc * 0.5))
      // Near the hub slices are narrow; below ~18° neighbouring percentages would overlap.
      const showPct = showPercent && sweep >= 18
      const labelRoom = showPct ? R - 18 - (HUB + 32) : R - 18 - (HUB + 8)
      // A long title gets a smaller font (down to a size still readable from the couch) before it's cut.
      const fitting = labelRoom / (titles[i].length * 0.56)
      const fontSize = Math.min(widest, Math.max(Math.min(widest, 10), fitting))
      return { show: arc >= 9, fontSize, showPct, maxChars: Math.max(3, Math.floor(labelRoom / (fontSize * 0.56))) }
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

  useEffect(() => {
    if (completedKey.current === spinKey) {
      return
    }
    const finish = () => {
      completedKey.current = spinKey
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
    // Reduced motion: no extra full turns, just a short glide to the winner.
    const target = targetRotation(rotation.get(), slice, reduceMotion ? 0 : 6 + Math.floor(Math.random() * 3))
    let lastIndex = sliceAtPointer(slices, rotation.get())
    latest.current.onPointerChange?.(lastIndex)
    const controls = animate(rotation, target, {
      duration: reduceMotion ? 0.8 : 5.8,
      ease: reduceMotion ? 'easeOut' : SPIN_EASE,
      onUpdate: (value) => {
        const index = sliceAtPointer(slices, value)
        if (index !== lastIndex) {
          lastIndex = index
          latest.current.onPointerChange?.(index)
          if (latest.current.sound && slices.length > 1) {
            playTick()
          }
        }
      },
      onComplete: finish,
    })
    return () => controls.stop()
  }, [spinKey, slices, winnerIndex, winnerId, rotation, reduceMotion])

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
        onClick={onSpinAgain}
        disabled={!landed || !onSpinAgain}
        aria-label={landed && onSpinAgain ? 'Spin the wheel again' : undefined}
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
                      isWinner={isWinner}
                    />
                  )}
                </g>
              )
            })}

            {/* The hub joins the winner's blue only once the wheel has landed. */}
            <circle
              cx={C}
              cy={C}
              r={HUB}
              className={`fill-ink-950 transition-[stroke] duration-500 ${landed ? 'stroke-accent' : 'stroke-ink-600'}`}
              strokeWidth={3}
            />
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
  isWinner: boolean
}

/**
 * A slice's title (and odds) along its middle, reading outwards. On the left half of the screen it's turned
 * round to read left to right instead of upside down; it re-checks as the wheel turns, so it's right wherever
 * the wheel stops.
 */
function SliceLabel({ rotation, angle, text, fontSize, percent, isWinner }: SliceLabelProps) {
  const [flipped, setFlipped] = useState(() => readsUpsideDown(angle, rotation.get()))
  useMotionValueEvent(rotation, 'change', (value) => setFlipped(readsUpsideDown(angle, value)))

  // Flipped, the frame points from the rim to the hub, so the title starts at the rim and the odds end at the hub.
  const rim = flipped ? C - (R - 16) : C + R - 16
  const hub = flipped ? C - (HUB + 8) : C + HUB + 8
  return (
    <g transform={`rotate(${flipped ? angle + 90 : angle - 90} ${C} ${C})`}>
      <text
        x={rim}
        y={C}
        textAnchor={flipped ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={fontSize}
        className={`font-sans font-semibold ${isWinner ? 'fill-ink-950' : 'fill-fg'}`}
      >
        {text}
      </text>
      {percent !== null && (
        <text
          x={hub}
          y={C}
          textAnchor={flipped ? 'end' : 'start'}
          dominantBaseline="central"
          fontSize={Math.min(11, fontSize)}
          className={`font-sans font-medium ${isWinner ? 'fill-ink-950/70' : 'fill-muted'}`}
        >
          {percent}%
        </text>
      )}
    </g>
  )
}
