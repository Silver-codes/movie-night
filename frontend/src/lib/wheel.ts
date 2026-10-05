// Wheel geometry. Angles are degrees, clockwise from 12 o'clock (where the pointer is).

export type Slice = {
  start: number
  end: number
}

/** Slices in the given order, sized by probability (they sum to 1, so the wheel is full). */
export function buildSlices(probabilities: readonly number[]): Slice[] {
  const total = probabilities.reduce((sum, p) => sum + p, 0) || 1
  let angle = 0
  return probabilities.map((p, i) => {
    const start = angle
    // The last slice closes the circle exactly, whatever the float rounding.
    angle = i === probabilities.length - 1 ? 360 : angle + (p / total) * 360
    return { start, end: angle }
  })
}

/** Index of the slice under the pointer when the wheel is turned clockwise by `rotation`. */
export function sliceAtPointer(slices: readonly Slice[], rotation: number): number {
  // A wheel point at angle θ sits at θ + rotation, so the pointer (0°) shows θ = -rotation.
  const angle = (((-rotation % 360) + 360) % 360)
  const index = slices.findIndex((s) => angle >= s.start && angle < s.end)
  return index === -1 ? slices.length - 1 : index
}

/**
 * Rotation to animate to from `current` so the pointer stops on a random spot in the middle
 * 70% of `slice`, after at least `turns` full turns.
 */
export function targetRotation(current: number, slice: Slice, turns: number, random: () => number = Math.random): number {
  const width = slice.end - slice.start
  const landing = slice.start + width * (0.15 + 0.7 * random())
  // Wanted final rotation mod 360 so `landing` is under the pointer.
  const wanted = (((-landing % 360) + 360) % 360)
  const now = ((current % 360) + 360) % 360
  const delta = (wanted - now + 360) % 360
  return current + turns * 360 + delta
}

function point(cx: number, cy: number, r: number, angle: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/** SVG path for a pie slice. A full-circle slice (one candidate) is drawn as two half arcs. */
export function slicePath(cx: number, cy: number, r: number, slice: Slice): string {
  const sweep = slice.end - slice.start
  if (sweep >= 359.999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
  }
  const [x1, y1] = point(cx, cy, r, slice.start)
  const [x2, y2] = point(cx, cy, r, slice.end)
  const large = sweep > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

/** Shorten a label to `max` characters with an ellipsis. */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`
}
