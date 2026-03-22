// ── lib/data.ts ──────────────────────────────────────────────────────────────
// Used ONLY by Scene.tsx for the public landing page 3D visualisation.
// Contains anonymous demo data — no real user numbers.
// The dashboard reads exclusively from Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import rawData from '@/data/entries.json'

export const META = {
  name:      'Signal',
  goal:      rawData.meta.goal_weight,
  startDate: rawData.meta.start_date,
  sound:     rawData.meta.sound === 1,
}

export const ENTRIES     = rawData.entries
export const W           = ENTRIES.map(e => e.weight)
export const S           = ENTRIES.map(e => e.steps)
export const NOISE_FLOOR = (() => {
  const diffs = W.slice(1).map((v, i) => Math.abs(v - W[i])).sort((a, b) => a - b)
  return diffs[Math.floor(diffs.length / 2)]
})()
export const TOTAL_LOST  = +(W[0] - W[W.length - 1]).toFixed(2)
export const GOAL_PCT    = Math.round(TOTAL_LOST / (W[0] - META.goal) * 100)
export const CURRENT     = W[W.length - 1]
export const N           = ENTRIES.length
export const LAST_DATE   = ENTRIES[N - 1].date

export function rollingAvg(arr: number[], w: number) {
  return arr.map((_, i) => {
    const sl = arr.slice(Math.max(0, i - w + 1), i + 1)
    return sl.reduce((a, b) => a + b, 0) / sl.length
  })
}
export const RA = rollingAvg(W, 7)

export function computeRegression(weights: number[], steps: number[]) {
  const xs = steps.slice(0, -1)
  const ys = weights.slice(1).map((v, i) => v - weights[i])
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const slope = num / den
  const intercept = my - slope * mx
  const yH = xs.map(x => slope * x + intercept)
  const ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0)
  const ssRes = ys.reduce((s, y, i) => s + (y - yH[i]) ** 2, 0)
  return { slope, intercept, r2: Math.max(0, 1 - ssRes / ssTot), n: xs.length }
}

export const REG = computeRegression(W, S)
