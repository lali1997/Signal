// Sound engine — Web Audio API, no external deps
// Reads sound flag from window.__SIGNAL_SOUND (set by server at page load)

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!(window as any).__SIGNAL_SOUND) return null
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

// Soft sine tone — used for data point pings during fly-through
// freq: Hz, duration: seconds, volume: 0-1
export function playTone(freq: number, duration = 0.18, volume = 0.06) {
  const c = getCtx(); if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain); gain.connect(c.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, c.currentTime)
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + duration)
}

// Transition chord — played when CTA is clicked (landing → dashboard)
// A soft two-note cello-like chord: root + fifth
export function playTransition() {
  const c = getCtx(); if (!c) return
  const notes = [196, 293.66, 392] // G3, D4, G4 — open fifth chord
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, c.currentTime)
    osc.connect(filter); filter.connect(gain); gain.connect(c.destination)
    osc.type = 'triangle' // warmer than sine, closer to cello
    osc.frequency.setValueAtTime(freq, c.currentTime)
    const delay = i * 0.06
    gain.gain.setValueAtTime(0, c.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, c.currentTime + delay + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 1.8)
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + 1.8)
  })
}

// Map weight value to frequency — 59kg=220Hz (A3), 71kg=440Hz (A4)
// Musical range: one octave, lower weight = lower note
export function weightToFreq(weight: number): number {
  const minW = 59, maxW = 71
  const minF = 220, maxF = 440
  const t = Math.max(0, Math.min(1, (weight - minW) / (maxW - minW)))
  // Invert — lower weight = lower freq (progress = lower pitch)
  return minF + (1 - t) * (maxF - minF)
}
