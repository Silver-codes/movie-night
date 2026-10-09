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

/** Shorten a label to `max` characters by cutting out its middle, so both ends stay readable. */
export function truncateMiddle(text: string, max: number): string {
  if (text.length <= max) {
    return text
  }
  const room = Math.max(2, max - 1)
  const head = Math.floor(room / 2)
  return `${text.slice(0, head).trimEnd()}…${text.slice(text.length - (room - head)).trimStart()}`
}

const SEPARATOR = /^[:\-–—]+$|:$/
// What's left after the series name must still name the movie: "Part 2" or "II" alone doesn't.
const TOO_GENERIC = /^((part|chapter|vol\.?|volume|book)\s+\S+|\S{1,3})$/i

/**
 * Wheel labels for a set of titles: movies of one series (same first two words) lose the start they all share,
 * so "Harry Potter and the Goblet of Fire" next to "…Chamber of Secrets" reads "Goblet of Fire". The cut
 * prefers to fall after a separator ("The Lord of the Rings: The Two Towers" → "The Two Towers"), and a
 * series keeps its full titles when any of them would be left empty or meaningless.
 */
export function shortTitles(titles: readonly string[]): string[] {
  const words = titles.map((t) => t.trim().split(/\s+/))
  const key = (w: string[]) => w.slice(0, 2).join(' ').toLowerCase()
  const series = new Map<string, number[]>()
  words.forEach((w, i) => series.set(key(w), [...(series.get(key(w)) ?? []), i]))

  const result = [...titles]
  for (const members of series.values()) {
    if (members.length < 2) {
      continue
    }
    const shortest = Math.min(...members.map((i) => words[i].length))
    let shared = 0
    while (
      shared < shortest &&
      members.every((i) => words[i][shared].toLowerCase() === words[members[0]][shared].toLowerCase())
    ) {
      shared++
    }
    // The shared words are the same for every member, so the cut is too.
    const lastSeparator = words[members[0]].slice(0, shared).findLastIndex((w) => SEPARATOR.test(w))
    const cut = lastSeparator === -1 ? shared : lastSeparator + 1
    const rests = members.map((i) => {
      const rest = words[i].slice(cut)
      while (rest.length > 0 && SEPARATOR.test(rest[0])) {
        rest.shift()
      }
      return rest.join(' ')
    })
    if (rests.every((rest) => rest !== '' && !TOO_GENERIC.test(rest))) {
      members.forEach((i, m) => (result[i] = rests[m]))
    }
  }
  return result
}

/**
 * Fit each label into its slice (`max[i]` characters). Labels that would still read the same once shortened
 * are cut in the middle instead, so their different endings ("…Part 1", "…Part 2") stay visible.
 */
export function fitLabels(labels: readonly string[], max: readonly number[]): string[] {
  const fitted = labels.map((label, i) => truncate(label, max[i]))
  const counts = new Map<string, number>()
  fitted.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1))
  return fitted.map((f, i) => ((counts.get(f) ?? 0) > 1 && labels[i] !== f ? truncateMiddle(labels[i], max[i]) : f))
}

/** Whether a label at `angle` on a wheel turned by `rotation` sits on the left half, where it would read upside down. */
export function readsUpsideDown(angle: number, rotation: number): boolean {
  const onScreen = (((angle + rotation) % 360) + 360) % 360
  return onScreen > 180 && onScreen < 360
}
