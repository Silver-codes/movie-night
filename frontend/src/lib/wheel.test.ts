import { describe, expect, it } from 'vitest'
import {
  buildSlices,
  fitLabels,
  readsUpsideDown,
  shortTitles,
  sliceAtPointer,
  targetRotation,
  truncate,
} from './wheel'

/** Small seeded PRNG (mulberry32), so failures are reproducible. */
function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function probabilities(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0)
  return weights.map((w) => w / total)
}

const CASES: Record<string, number[]> = {
  '1 candidate': [1],
  '2 candidates': [1, 1],
  '2 uneven': [9, 1],
  '30 equal': Array.from({ length: 30 }, () => 1),
  '50 uneven': Array.from({ length: 50 }, (_, i) => (i % 7) + 1),
  // One tiny slice among big ones (weight 1 vs 10s).
  '30 with a sliver': [1, ...Array.from({ length: 29 }, () => 10)],
}

describe('buildSlices', () => {
  it.each(Object.entries(CASES))('%s: covers the circle without gaps', (_, weights) => {
    const slices = buildSlices(probabilities(weights))
    expect(slices[0].start).toBe(0)
    expect(slices.at(-1)?.end).toBe(360)
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i].start).toBe(slices[i - 1].end)
      expect(slices[i].end).toBeGreaterThan(slices[i].start)
    }
  })
})

describe('targetRotation', () => {
  it.each(Object.entries(CASES))('%s: always lands on the winner, from any start, spin after spin', (_, weights) => {
    const slices = buildSlices(probabilities(weights))
    const random = seeded(weights.length)
    let rotation = random() * 720 - 360
    for (let spin = 0; spin < 500; spin++) {
      const winner = Math.floor(random() * slices.length)
      const turns = spin % 2 === 0 ? 6 + Math.floor(random() * 3) : 0
      const next = targetRotation(rotation, slices[winner], turns, random)
      expect(next).toBeGreaterThanOrEqual(rotation + turns * 360)
      expect(next).toBeLessThan(rotation + turns * 360 + 360)
      expect(sliceAtPointer(slices, next)).toBe(winner)
      rotation = next
    }
  })

  it('stays in the middle 70% of the slice', () => {
    const slices = buildSlices([0.25, 0.25, 0.25, 0.25])
    for (const r of [0, 0.5, 0.999]) {
      const landing = (360 - (targetRotation(0, slices[1], 0, () => r) % 360)) % 360
      expect(landing).toBeGreaterThanOrEqual(90 + 0.15 * 90 - 1e-9)
      expect(landing).toBeLessThanOrEqual(90 + 0.85 * 90 + 1e-9)
    }
  })
})

describe('shortTitles', () => {
  it('drops the start a series shares', () => {
    expect(
      shortTitles([
        "Harry Potter and the Philosopher's Stone",
        'Harry Potter and the Chamber of Secrets',
        'Harry Potter and the Goblet of Fire',
        'Paddington 2',
      ]),
    ).toEqual(["Philosopher's Stone", 'Chamber of Secrets', 'Goblet of Fire', 'Paddington 2'])
  })

  it('cuts after the series separator', () => {
    expect(
      shortTitles(['The Lord of the Rings: The Fellowship of the Ring', 'The Lord of the Rings: The Two Towers']),
    ).toEqual(['The Fellowship of the Ring', 'The Two Towers'])
    expect(shortTitles(['Mission: Impossible – Fallout', 'Mission: Impossible – Dead Reckoning'])).toEqual([
      'Fallout',
      'Dead Reckoning',
    ])
  })

  it('keeps full titles when a short one would say nothing', () => {
    const parts = ['Harry Potter and the Deathly Hallows: Part 1', 'Harry Potter and the Deathly Hallows: Part 2']
    expect(shortTitles(parts)).toEqual(parts)
    const knight = ['The Dark Knight', 'The Dark Knight Rises']
    expect(shortTitles(knight)).toEqual(knight)
  })

  it('leaves unrelated titles alone', () => {
    const titles = ['The Matrix', 'The Thing', 'Up']
    expect(shortTitles(titles)).toEqual(titles)
  })
})

describe('fitLabels', () => {
  it('cuts labels that would collide in the middle, others at the end', () => {
    const [one, two, other] = fitLabels(
      ['Harry Potter and the Deathly Hallows: Part 1', 'Harry Potter and the Deathly Hallows: Part 2', 'Paddington 2 the Movie'],
      [16, 16, 16],
    )
    expect(one).not.toBe(two)
    expect(one.endsWith('Part 1')).toBe(true)
    expect(two.endsWith('Part 2')).toBe(true)
    expect(other).toBe('Paddington 2 th…')
    for (const label of [one, two, other]) {
      expect(label.length).toBeLessThanOrEqual(16)
    }
  })
})

describe('readsUpsideDown', () => {
  it('flips labels on the left half of the screen', () => {
    expect(readsUpsideDown(90, 0)).toBe(false)
    expect(readsUpsideDown(270, 0)).toBe(true)
    expect(readsUpsideDown(270, 180)).toBe(false)
    expect(readsUpsideDown(90, -540)).toBe(true)
  })
})

describe('truncate', () => {
  it('keeps short titles', () => {
    expect(truncate('Up', 10)).toBe('Up')
  })

  it('shortens long titles to the limit with an ellipsis', () => {
    const title = 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb'
    for (const max of [3, 8, 15, 30]) {
      const short = truncate(title, max)
      expect(short.length).toBeLessThanOrEqual(max)
      expect(short.endsWith('…')).toBe(true)
    }
  })
})
