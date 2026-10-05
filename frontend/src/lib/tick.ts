// A tiny synthesized "tick" for the wheel, via Web Audio (no sound files).

const SOUND_KEY = 'movie-night:sound'

let context: AudioContext | null = null

/** Create/resume the audio context; call it from a click so mobile browsers allow sound. */
export function unlockAudio(): void {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') {
      void context.resume()
    }
  } catch {
    context = null
  }
}

export function playTick(): void {
  if (!context || context.state !== 'running') {
    return
  }
  const now = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1500, now)
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.03)
  gain.gain.setValueAtTime(0.12, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
  osc.connect(gain).connect(context.destination)
  osc.start(now)
  osc.stop(now + 0.05)
}

/** Whether the tick sound is on (default on); remembered per browser. */
export function loadSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off')
  } catch {
    // Storage blocked (private mode etc.): the toggle just won't be remembered.
  }
}
