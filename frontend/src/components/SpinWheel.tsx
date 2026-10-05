import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PickCandidate } from '../api/types'
import { playTick } from '../lib/tick'
import { buildSlices, sliceAtPointer, slicePath, targetRotation, truncate } from '../lib/wheel'

type Props = {
  candidates: PickCandidate[]
  winnerId: number
  /** A new value (the pick id) starts a new spin, continuing from where the wheel stopped. */
  spinKey: number
  showPercent: boolean
  sound: boolean
  onDone: () => void
  /** When set (the wheel has landed and may spin again), tapping the wheel calls it. */
  onSpinAgain?: () => void
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
export function SpinWheel({ candidates, winnerId, spinKey, showPercent, sound, onDone, onSpinAgain }: Props) {
  const rotation = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  const [landedKey, setLandedKey] = useState<number | null>(null)
  const landed = landedKey === spinKey

  const slices = useMemo(() => buildSlices(candidates.map((c) => c.probability)), [candidates])
  const winnerIndex = candidates.findIndex((c) => c.movie.id === winnerId)

  // Latest callbacks/flags without restarting the spin when they change.
  const latest = useRef({ onDone, sound })
  useEffect(() => {
    latest.current = { onDone, sound }
  })

  useEffect(() => {
    const slice = slices[winnerIndex]
    if (!slice) {
      return
    }
    const target = targetRotation(rotation.get(), slice, reduceMotion ? 1 : 6 + Math.floor(Math.random() * 3))
    let lastIndex = sliceAtPointer(slices, rotation.get())
    const controls = animate(rotation, target, {
      duration: reduceMotion ? 1.2 : 5.8,
      ease: SPIN_EASE,
      onUpdate: (value) => {
        const index = sliceAtPointer(slices, value)
        if (index !== lastIndex) {
          lastIndex = index
          if (latest.current.sound && slices.length > 1) {
            playTick()
          }
        }
      },
      onComplete: () => {
        setLandedKey(spinKey)
        latest.current.onDone()
      },
    })
    return () => controls.stop()
  }, [spinKey, slices, winnerIndex, rotation, reduceMotion])

  const winner = candidates[winnerIndex]

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Pointer at 12 o'clock */}
      <svg
        viewBox="0 0 40 44"
        aria-hidden="true"
        className="absolute top-0 left-1/2 z-10 w-9 -translate-x-1/2 -translate-y-1 drop-shadow-[0_4px_6px_rgb(0_0_0/0.6)]"
      >
        <path d="M20 42 4 8a16 16 0 0 1 32 0Z" className="fill-fg" />
        <circle cx="20" cy="12" r="5" className="fill-accent" />
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
                  className={i % 2 === 0 ? 'fill-accent-strong' : 'fill-fg/50'}
                />
              )
            })}

            {candidates.map((candidate, i) => {
              const slice = slices[i]
              const sweep = slice.end - slice.start
              const mid = (slice.start + slice.end) / 2
              const isWinner = landed && i === winnerIndex
              // Arc length at the label's radius decides the font size; tiny slices get no label.
              const arc = (2 * Math.PI * R * 0.62 * sweep) / 360
              const fontSize = Math.min(15, Math.max(8, arc * 0.5))
              const showLabel = sweep >= 4 && arc >= 9
              const showPct = showPercent && sweep >= 9
              const labelRoom = showPct ? R - 18 - (HUB + 34) : R - 18 - (HUB + 8)
              const maxChars = Math.max(3, Math.floor(labelRoom / (fontSize * 0.56)))
              return (
                <g key={candidate.movie.id}>
                  <path
                    d={slicePath(C, C, R, slice)}
                    className={`stroke-ink-950 transition-[fill] duration-500 ${isWinner ? 'fill-accent' : sliceFill(i, candidates.length)}`}
                    strokeWidth={1.5}
                  />
                  {showLabel && (
                    <g transform={`rotate(${mid - 90} ${C} ${C})`}>
                      <text
                        x={C + R - 16}
                        y={C}
                        textAnchor="end"
                        dominantBaseline="central"
                        fontSize={fontSize}
                        className={`font-sans font-semibold ${isWinner ? 'fill-ink-950' : 'fill-fg'}`}
                      >
                        {truncate(candidate.movie.title, maxChars)}
                      </text>
                      {showPct && (
                        <text
                          x={C + HUB + 8}
                          y={C}
                          dominantBaseline="central"
                          fontSize={Math.min(11, fontSize)}
                          className={`font-sans font-medium ${isWinner ? 'fill-ink-950/70' : 'fill-muted'}`}
                        >
                          {Math.round(candidate.probability * 100)}%
                        </text>
                      )}
                    </g>
                  )}
                </g>
              )
            })}

            <circle cx={C} cy={C} r={HUB} className="fill-ink-950 stroke-accent" strokeWidth={3} />
            <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize={26}>
              🍿
            </text>
          </svg>
        </motion.div>
      </button>
    </div>
  )
}
