'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, CartesianGrid } from 'recharts'

const DISP   = 'Cormorant Garamond, serif'
const MONO   = 'DM Mono, monospace'
const SANS   = 'DM Sans, sans-serif'
const SAGE   = '#4a7c59'
const SAGE_B = '#6adc89'
const AMBER  = '#c8793a'
const CORAL  = '#c45c4a'
const BORDER = 'rgba(255,255,255,0.05)'

const ease   = { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
const spring = { type: 'spring' as const, stiffness: 90, damping: 18 }

function scoreColor(v: number): string {
  return v >= 70 ? SAGE_B : v >= 40 ? AMBER : CORAL
}


// ── Goal celebration ─────────────────────────────────────────────────────────
function GoalCelebration({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: [SAGE_B, '#a78bfa', '#60a5fa', AMBER, '#f9a8d4'][Math.floor(Math.random() * 5)],
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }))
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(4,6,10,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
      }}
      onClick={onDismiss}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: '100vh', x: `${p.x}vw` }}
          animate={{ opacity: [0, 1, 1, 0], y: `${p.y - 100}vh` }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut', repeat: Infinity }}
          style={{
            position: 'absolute', width: p.size, height: p.size,
            borderRadius: '50%', background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Big glowing radial */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(74,124,89,0.15) 0%, transparent 65%)',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 560, padding: '0 40px' }}
      >
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: SAGE_B, marginBottom: 16 }}>
          Goal achieved
        </motion.p>
        <h1 style={{
          fontFamily: DISP, fontSize: 'clamp(64px,10vw,120px)',
          fontWeight: 300, color: 'white', lineHeight: 0.88,
          letterSpacing: '-0.04em', marginBottom: 12,
        }}>
          {name}.
        </h1>
        <h2 style={{
          fontFamily: DISP, fontSize: 'clamp(40px,6vw,80px)',
          fontWeight: 300, fontStyle: 'italic', color: SAGE_B,
          lineHeight: 0.9, letterSpacing: '-0.04em', marginBottom: 40,
          textShadow: '0 0 60px rgba(106,220,137,0.5)',
          filter: 'drop-shadow(0 0 20px rgba(106,220,137,0.4))',
        }}>
          You made it.
        </h2>
        <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', lineHeight: 1.8, marginBottom: 40 }}>
          Every weigh-in. Every step. Every data point.<br />
          The signal was always there. Now it's complete.
        </p>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          style={{
            padding: '14px 48px', borderRadius: 999,
            background: 'rgba(74,124,89,0.15)',
            border: '1px solid rgba(74,124,89,0.5)',
            color: SAGE_B, fontFamily: MONO, fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer', backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(74,124,89,0.2)',
          }}>
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Animated number counter ──────────────────────────────────────────────────
function AnimNum({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const [disp, setDisp] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.unobserve(el)
      const start = performance.now(), dur = 1600
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur)
        setDisp(value * (1 - Math.pow(1 - p, 4)))
        if (p < 1) requestAnimationFrame(tick); else setDisp(value)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])
  return <span ref={ref}>{disp.toFixed(decimals)}</span>
}

// ── Scroll reveal ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -48px 0px' })
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ ...ease, delay: delay / 1000 }}>
      {children}
    </motion.div>
  )
}

// ── Float tooltip ────────────────────────────────────────────────────────────
function FloatTip({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [show, setShow] = useState(false)

  const tooltip = show && typeof document !== 'undefined'
    ? createPortal(
        <div style={{
          position: 'fixed',
          left: Math.min(pos.x + 14, window.innerWidth - 260),
          top: Math.max(pos.y - 10, 8),
          zIndex: 9999,
          background: 'rgba(8,14,10,0.97)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 10, padding: '10px 14px', pointerEvents: 'none',
          minWidth: 190, maxWidth: 240, whiteSpace: 'normal',
        }}>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: 5 }}>{title}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 300, lineHeight: 1.55 }}>{body}</p>
        </div>,
        document.body
      )
    : null

  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>
      {children}
      {tooltip}
    </div>
  )
}

// ── OPTION B: Score card — tall vertical bar + editorial number ──────────────
function ScoreCard({ label, value, color, title, body, delay = 0 }: {
  label: string; value: number; color: string; title: string; body: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [fillH, setFillH] = useState(0)

  useEffect(() => {
    if (inView) setTimeout(() => setFillH(value), 200 + delay)
  }, [inView, value, delay])

  return (
    <Reveal delay={delay}>
      <FloatTip title={title} body={body}>
        <motion.div
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 220, damping: 20 } }}
          style={{
            position: 'relative', overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '22px 18px 18px',
            cursor: 'default', height: 180,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>

          {/* Vertical fill bar — left edge */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'rgba(255,255,255,0.05)', borderRadius: '16px 0 0 16px',
          }}>
            <motion.div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: color,
                borderRadius: '0 0 0 16px',
                boxShadow: `0 0 12px ${color}`,
              }}
              initial={{ height: '0%' }}
              animate={{ height: `${fillH}%` }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Watermark number behind */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontFamily: DISP, fontSize: 100, fontWeight: 600,
              color, opacity: 0.04, lineHeight: 1, userSelect: 'none',
            }}>{value}</span>
          </div>

          {/* Score number — top */}
          <div ref={ref} style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              fontFamily: DISP, fontSize: 52, fontWeight: 300, lineHeight: 1,
              letterSpacing: '-0.04em', color,
              filter: `drop-shadow(0 0 12px ${color}55)`,
            }}>
              {value}
            </span>
          </div>

          {/* Label + thin progress bar — bottom */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ height: 1.5, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
              <motion.div
                style={{ height: '100%', background: color, borderRadius: 1, boxShadow: `0 0 6px ${color}` }}
                initial={{ width: 0 }}
                animate={{ width: inView ? `${value}%` : 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 + 0.3 }}
              />
            </div>
            <p style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
            }}>{label}</p>
          </div>
        </motion.div>
      </FloatTip>
    </Reveal>
  )
}

// ── Day-of-week bar ──────────────────────────────────────────────────────────
function DowBar({ day, value, min, max, isLightest, isHeaviest }: {
  day: string; value: number | null; min: number; max: number; isLightest: boolean; isHeaviest: boolean
}) {
  const [hov, setHov] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  if (!value) return (
    <div className="flex-1 flex flex-col items-center justify-end gap-1">
      <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
      <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>{day[0]}</span>
    </div>
  )
  const h = Math.max(10, Math.round(((value - min) / ((max - min) || 1)) * 64) + 10)
  const color = isLightest ? SAGE_B : isHeaviest ? AMBER : 'rgba(255,255,255,0.2)'
  return (
    <div ref={ref} className="flex-1 flex flex-col items-center justify-end gap-1.5 relative"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="glass-hi rounded-xl absolute bottom-full mb-2 left-1/2 z-20 px-3 py-2 whitespace-nowrap"
            style={{ transform: 'translateX(-50%)' }}>
            <p style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>{day}</p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: 'white', fontWeight: 500 }}>{value.toFixed(2)} kg</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div style={{
        width: '100%', borderRadius: '3px 3px 0 0', background: color,
        filter: isLightest ? `drop-shadow(0 0 8px ${SAGE_B})` : isHeaviest ? `drop-shadow(0 0 8px ${AMBER})` : 'none',
      }}
        initial={{ height: 0 }} animate={{ height: inView ? h : 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 12, delay: 0.1 }} />
      <span style={{ fontFamily: MONO, fontSize: 8, color: isLightest ? SAGE_B : isHeaviest ? AMBER : 'rgba(255,255,255,0.25)' }}>{day[0]}</span>
    </div>
  )
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-hi rounded-xl p-3" style={{ fontFamily: MONO, fontSize: 10, minWidth: 140 }}>
      <p style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => {
        if (p.dataKey === 'upper' || p.dataKey === 'lower') return null
        if (p.dataKey === 'steps') return <div key="steps" className="flex justify-between gap-4 mb-1"><span style={{ color: 'rgba(255,255,255,0.35)' }}>Steps</span><span style={{ color: '#3d7a8a', fontWeight: 500 }}>{p.value?.toLocaleString()}</span></div>
        if (p.value == null) return null
        return <div key={p.dataKey} className="flex justify-between gap-4 mb-1"><span style={{ color: 'rgba(255,255,255,0.35)' }}>{p.dataKey === 'signal' ? 'Signal' : p.dataKey === 'weight' ? 'Raw' : 'Ghost'}</span><span style={{ color: p.stroke || p.color, fontWeight: 500 }}>{p.value.toFixed(2)} kg</span></div>
      })}
    </div>
  )
}

// ── Scrolling ticker ─────────────────────────────────────────────────────────
function Ticker({ items }: { items: { label: string; value: string; color?: string }[] }) {
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'inline-flex', animation: 'ticker 32s linear infinite' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 28px', fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', borderRight: `1px solid ${BORDER}` }}>
            <span style={{ color: item.color || SAGE_B, fontWeight: 500 }}>{item.value}</span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {}, level = 'mid' }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; level?: 'low' | 'mid' | 'hi'
}) {
  const cls = level === 'low' ? 'glass' : level === 'hi' ? 'glass-hi' : 'glass-mid'
  return (
    <motion.div className={`${cls} rounded-2xl ${className}`} style={style}
      whileHover={{ y: -2, scale: 1.004, transition: { type: 'spring', stiffness: 200, damping: 22 } }}>
      {children}
    </motion.div>
  )
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 8 }}>{children}</p>
)

// ── Upgraded heading — larger, more dramatic ─────────────────────────────────
const Heading = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <h2 style={{ fontFamily: DISP, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 300, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.0, ...style }}>{children}</h2>
)

// ── Section with glowing divider line ────────────────────────────────────────
const Section = ({ children }: { children: React.ReactNode }) => (
  <Reveal style={{ padding: '80px 0', position: 'relative' }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg, transparent, ${SAGE}55, transparent)`,
    }} />
    {children}
  </Reveal>
)

// ── Action box ───────────────────────────────────────────────────────────────
function ActionBox({ data }: { data: ReturnType<typeof import('@/lib/calculations').computeAll> }) {
  const [open, setOpen] = useState(false)
  const { W, S, N, velocity, regression, stepThreshold } = data

  const recentSteps = S.slice(-3)
  const lowDays = recentSteps.filter((s: number) => s < stepThreshold).length

  let action: string, reasoning: string
  if (lowDays >= 2) {
    const impact = Math.abs(regression.slope * 8000 + regression.intercept).toFixed(2)
    action = `Walk 8,000+ steps today.`
    reasoning = `${lowDays} of your last 3 logged days were under ${Math.round(stepThreshold / 1000)}k steps. Movement debt is building. Based on your regression, an 8k day would shift next-day weight by ~${impact} kg.`
  } else if (velocity.current < -0.15) {
    action = `Maintain the pace.`
    reasoning = `Velocity is ${velocity.current.toFixed(2)} kg/week — you're in a strong phase. Don't change anything. Keep step count above ${Math.round(stepThreshold / 1000)}k.`
  } else {
    const impact = Math.abs(regression.slope * 3000).toFixed(3)
    action = `Add 3,000 steps to your baseline.`
    reasoning = `Velocity has flattened to ${velocity.current.toFixed(2)} kg/week. Your regression shows every extra 1k steps shifts next-day weight by ${(regression.slope * 1000).toFixed(4)} kg. Adding 3,000 steps would contribute ~${impact} kg of movement.`
  }

  return (
    <motion.div onClick={() => setOpen(o => !o)} whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }}
      style={{
        background: '#0d1410', borderRadius: 16,
        padding: open ? '28px 32px' : '22px 28px',
        cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
        transition: 'padding 0.3s ease',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Your next move</p>
          <p style={{ fontFamily: DISP, fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 300, color: 'white', letterSpacing: '-0.02em' }}>
            <em style={{ fontStyle: 'italic', color: SAGE_B }}>{action}</em>
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16 }}>
          <span style={{ color: SAGE_B, fontSize: 18, lineHeight: 1, marginTop: -1 }}>+</span>
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>{reasoning}</p>
              <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 14, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {`Based on ${regression.n} entry pairs · R² ${regression.r2.toFixed(2)}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardClient({
  data, onSettings,
}: {
  data: ReturnType<typeof import('@/lib/calculations').computeAll>
  onSettings?: () => void
}) {
  const [simSteps, setSimSteps] = useState(8000)
  const [simDays, setSimDays]   = useState(7)
  const [showCelebration, setShowCelebration] = useState(false)

  const { W, S, DT, N, RA, noiseFloor, stepThreshold, regression, scores, mood, phase,
    riskScore, spikePct, velocity, goal, atl, streak, adapt, optimalDays,
    ydayExplainer, dow, recovery, milestones, stepBands, meta } = data

  useEffect(() => {
    if (goal.pct >= 100) {
      const key = `signal_goal_celebrated_${meta.name || 'user'}`
      if (!sessionStorage.getItem(key)) {
        setShowCelebration(true)
      }
    }
  }, [goal.pct, meta.name])

  function dismissCelebration() {
    const key = `signal_goal_celebrated_${meta.name || 'user'}`
    sessionStorage.setItem(key, '1')
    setShowCelebration(false)
  }

  // Streak at risk — last log was more than 1 day ago
  const lastLogDate = DT[N - 1]
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) })()
  const streakAtRisk = lastLogDate !== today && lastLogDate !== yesterday && streak > 1

  const riskColor  = riskScore >= 55 ? CORAL : riskScore >= 35 ? AMBER : SAGE
  const moodColor  = mood === 'thriving' ? SAGE : mood === 'progressing' ? '#3d7a8a' : mood === 'plateau' ? AMBER : CORAL

  const adaptationIndex = Math.round(Math.min(100, Math.max(0,
    (1 - Math.abs(velocity.current) / Math.max(0.01, Math.abs(velocity.early))) * 100
  )))
  const logSpacing = (() => {
    const gaps: number[] = []
    for (let i = 1; i < N; i++) {
      const a = new Date(DT[i - 1]), b = new Date(DT[i])
      gaps.push((b.getTime() - a.getTime()) / (1000 * 86400))
    }
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const variance = gaps.reduce((s, g) => s + Math.pow(g - avg, 2), 0) / gaps.length
    return Math.round(Math.max(0, Math.min(100, 100 - variance * 4)))
  })()
  const stepEfficiency  = +((W[0] - W[N - 1]) / (S.reduce((a, b) => a + b, 0) / 10000)).toFixed(2)
  const plateauRisk     = Math.round(Math.min(100, Math.max(0, (adaptationIndex * 0.4) + (100 - scores.signal) * 0.6)))

  const chartData = W.map((w, i) => ({
    date:   DT[i].split(' ').slice(0, 2).join(' '),
    weight: w, signal: +RA[i].toFixed(2),
    upper:  +(RA[i] + noiseFloor).toFixed(2),
    lower:  +(RA[i] - noiseFloor).toFixed(2),
    ghost:  +(W[0] + (velocity.early / 7) * i).toFixed(2),
    steps:  S[i],
  }))

  const simResult = W[N - 1] + (regression.slope * simSteps + regression.intercept) * simDays
  const simDelta  = simResult - W[N - 1]
  const DAYS      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowValid  = dow.avg.filter((v): v is number => v !== null)
  const dowMin    = Math.min(...dowValid), dowMax = Math.max(...dowValid)

  const tickerItems = [
    { label: 'Current',  value: W[N - 1].toFixed(2) + ' kg' },
    { label: 'Released', value: '−' + (W[0] - W[N - 1]).toFixed(1) + ' kg', color: SAGE_B },
    { label: 'Velocity', value: (velocity.current < 0 ? '' : '+') + velocity.current.toFixed(2) + ' kg/wk', color: velocity.current < 0 ? SAGE_B : CORAL },
    { label: 'Battery',  value: scores.battery + '%', color: SAGE_B },
    { label: 'Goal',     value: goal.pct + '%', color: SAGE_B },
    { label: 'Streak',   value: streak + ' days', color: SAGE },
    { label: 'Risk',     value: riskScore + '/100', color: riskColor },
    { label: 'ATL',      value: atl.weight.toFixed(2) + ' kg' },
  ]

  const scoreCards = [
    { label: 'Momentum',    value: scores.momentum,    color: scoreColor(scores.momentum),    title: 'Momentum',       body: 'Recency-weighted rate of change. Recent losses score higher than older ones. Rewards sustained direction.' },
    { label: 'Consistency', value: scores.consistency, color: scoreColor(scores.consistency), title: 'Consistency',    body: 'Log frequency relative to days elapsed. Measures how reliably you weigh in over the full journey.' },
    { label: 'Signal',      value: scores.signal,      color: scoreColor(scores.signal),      title: 'Signal strength',body: 'How far current movement exceeds your personal noise floor. Filters out daily water fluctuation.' },
    { label: 'Activity',    value: scores.activity,    color: scoreColor(scores.activity),    title: 'Activity score', body: 'Recent step count scored against your own personal range — not a global target.' },
    { label: 'Habit',       value: scores.habit,       color: scoreColor(scores.habit),       title: 'Habit score',    body: 'Logging regularity. Near 100 means daily check-in. Drives data quality for all other scores.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#04060a' }}>

      {/* ── PREMIUM BACKGROUND — large animated glows + grain ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Primary sage glow — top left, large */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-30%', left: '-20%', width: '80%', height: '80%', background: 'radial-gradient(ellipse,rgba(74,124,89,0.09),transparent 65%)', borderRadius: '50%' }} />
        {/* Secondary teal — bottom right */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '70%', height: '70%', background: 'radial-gradient(ellipse,rgba(61,122,138,0.07),transparent 65%)', borderRadius: '50%' }} />
        {/* Mid amber accent — subtle */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 12 }}
          style={{ position: 'absolute', top: '40%', left: '50%', width: '50%', height: '50%', background: 'radial-gradient(ellipse,rgba(200,121,58,0.04),transparent 65%)', borderRadius: '50%' }} />
        {/* Grain texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }} />
      </div>

      {/* ── STREAK AT RISK BANNER ── */}
      <AnimatePresence>
        {streakAtRisk && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', top: 60, left: 0, right: 0, zIndex: 140,
              background: `linear-gradient(90deg, rgba(200,121,58,0.12), rgba(200,121,58,0.06))`,
              borderBottom: `1px solid rgba(200,121,58,0.25)`,
              overflow: 'hidden',
            }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 48px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, boxShadow: `0 0 8px ${AMBER}`, animation: 'pulseDot 2s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: AMBER }}>
                Your {streak}-day streak is at risk. Log today to keep it.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO SECTION ── */}
      <section style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 1, paddingTop: streakAtRisk ? 96 : 60 }}>

        <div style={{ padding: '80px 48px 0', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...ease, delay: 0.4 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, marginBottom: 24 }} className="glass">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: moodColor, boxShadow: `0 0 8px ${moodColor}`, animation: 'pulseDot 2.5s ease-in-out infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{phase.label} · {mood}</span>
          </motion.div>

          <div style={{ overflow: 'hidden', marginBottom: 6 }}>
            <motion.h1 initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...ease, delay: 0.5 }}
              style={{ fontFamily: DISP, fontSize: 'clamp(60px,9vw,120px)', fontWeight: 300, color: 'white', lineHeight: 0.88, letterSpacing: '-0.04em' }}>
              {meta.name}.
            </motion.h1>
          </div>
          <div style={{ overflow: 'hidden', marginBottom: 36 }}>
            <motion.h1 initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...ease, delay: 0.65 }}
              className="text-glow-sage"
              style={{ fontFamily: DISP, fontSize: 'clamp(60px,9vw,120px)', fontWeight: 300, lineHeight: 0.88, letterSpacing: '-0.04em', fontStyle: 'italic', color: SAGE_B }}>
              {scores.momentum >= 70 ? 'Strong signal.' : scores.momentum >= 50 ? 'Steady progress.' : 'Holding the line.'}
            </motion.h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...ease, delay: 0.85 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { l: 'Current',  v: W[N - 1].toFixed(2),                                          u: 'kg' },
              { l: 'Released', v: '−' + (W[0] - W[N - 1]).toFixed(1),                          u: 'kg', c: SAGE_B },
              { l: 'Velocity', v: (velocity.current < 0 ? '' : '+') + velocity.current.toFixed(2), u: 'kg/wk', c: velocity.current < 0 ? SAGE_B : CORAL },
              { l: 'Battery',  v: scores.battery + '',                                          u: '%', c: scoreColor(scores.battery) },
              { l: 'Goal',     v: goal.pct + '',                                                u: '%', c: SAGE_B },
            ].map(m => (
              <motion.div key={m.l} className="glass rounded-2xl" style={{ padding: '14px 16px', textAlign: 'center' }}
                whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 200, damping: 22 } }}>
                <p style={{ fontFamily: DISP, fontSize: 26, fontWeight: 300, color: (m as any).c || 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {m.v}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginLeft: 3, fontFamily: SANS }}>{m.u}</span>
                </p>
                <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{m.l}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ ...ease, delay: 1.0 }}
            className="glass rounded-2xl" style={{ padding: '14px 18px', maxWidth: 580 }}>
            <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 6 }}>Last entry · {DT[N - 1]}</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{ydayExplainer.text}</p>
            <span style={{ display: 'inline-block', marginTop: 8, fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, background: ydayExplainer.color + '22', color: ydayExplainer.color }}>
              {ydayExplainer.tag}
            </span>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...ease, delay: 1.5 }}
          style={{ padding: '20px 48px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>↓ Scroll for full analysis</p>
        </motion.div>
      </section>

      <Ticker items={tickerItems} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '0 48px' }}>

        {/* ── SCORE CARDS — Option B ── */}
        <Section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <Label>Biometric scores</Label>
              <Heading>Your vitals.</Heading>
            </div>
            <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>hover for explanation</p>
          </div>

          {/* 5 tall editorial score cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
            {scoreCards.map((sc, i) => (
              <ScoreCard key={sc.label} {...sc} delay={i * 80} />
            ))}
          </div>

          {/* Body Battery + Insights */}
          <Reveal delay={450} className="mt-3">
            <Card level="hi" style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%,rgba(74,124,89,0.09),transparent 55%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Label>Body battery</Label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="text-glow-sage" style={{ fontFamily: DISP, fontSize: 72, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.05em', color: scoreColor(scores.battery) }}>
                    <AnimNum value={scores.battery} decimals={0} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>%</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', margin: '10px 0 8px' }}>
                  <motion.div style={{ height: '100%', background: SAGE_B, borderRadius: 2, boxShadow: `0 0 10px rgba(106,220,137,0.5)` }}
                    initial={{ width: 0 }} whileInView={{ width: `${scores.battery}%` }} viewport={{ once: true }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>
                  {scores.battery >= 75 ? 'Fully charged. Conditions optimal.' : scores.battery >= 55 ? 'Good shape. Keep the momentum.' : scores.battery >= 35 ? 'Moderate. Worth monitoring.' : 'Low. Attention needed.'}
                </p>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Label>New insights</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Adaptation',     v: adaptationIndex, c: scoreColor(100 - adaptationIndex), title: 'Adaptation index',    body: 'How much your body has adjusted to current deficit. Higher = more metabolic adaptation.' },
                    { l: 'Log spacing',    v: logSpacing,      c: scoreColor(logSpacing),             title: 'Log spacing quality', body: 'Measures how evenly distributed your weigh-ins are. Irregular gaps reduce signal quality.' },
                    { l: 'Step efficiency',v: stepEfficiency,  c: SAGE_B,                             title: 'Step efficiency',     body: 'kg lost per 10k steps averaged over your journey.', unit: 'kg/10k' },
                    { l: 'Plateau risk',   v: plateauRisk,     c: scoreColor(100 - plateauRisk),      title: 'Plateau risk',        body: 'Likelihood of entering a stall. Below 40 is safe.' },
                  ].map(ins => (
                    <FloatTip key={ins.l} title={ins.title} body={ins.body}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', cursor: 'default' }}>
                        <p style={{ fontFamily: DISP, fontSize: (ins as any).unit ? 20 : 26, fontWeight: 300, color: ins.c, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 3 }}>
                          {ins.v}{(ins as any).unit && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: SANS, marginLeft: 3 }}>{(ins as any).unit}</span>}
                        </p>
                        <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>{ins.l}</p>
                      </div>
                    </FloatTip>
                  ))}
                </div>
              </div>
            </Card>
          </Reveal>
        </Section>

        {/* ── WEIGHT CHART ── */}
        <Section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div><Label>Trajectory</Label><Heading>Weight signal.</Heading></div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[[SAGE_B, '7d signal'], ['rgba(255,255,255,0.15)', 'Noise band'], [AMBER, 'Ghost pace'], ['rgba(61,122,138,0.6)', 'Steps']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: l === 'Steps' ? 10 : 18, height: l === 'Steps' ? 10 : 2, background: c, borderRadius: l === 'Steps' ? 2 : 1 }} />
                  <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <Card level="low" className="glow-sage" style={{ padding: '20px 8px 12px 0' }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="nG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SAGE} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={SAGE} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontFamily: MONO, fontSize: 8, fill: 'rgba(255,255,255,0.22)' }} tickLine={false} axisLine={false} interval={Math.floor(N / 6)} />
                <YAxis yAxisId="weight" orientation="left" domain={[
                  Math.floor(Math.min(...W, meta.goal_weight) - 2.5),
                  Math.ceil(Math.max(W[0], ...W) + 2)
                ]} tick={{ fontFamily: MONO, fontSize: 8, fill: 'rgba(255,255,255,0.22)' }} tickLine={false} axisLine={false} width={36} tickFormatter={v => v + ' kg'} />
                <YAxis yAxisId="steps" orientation="right" domain={[0, 20000]} tick={{ fontFamily: MONO, fontSize: 8, fill: 'rgba(61,122,138,0.6)' }} tickLine={false} axisLine={false} width={36} tickFormatter={v => v >= 1000 ? Math.round(v / 1000) + 'k' : v + ''} />
                <Tooltip content={<ChartTip />} />
                <Bar yAxisId="steps" dataKey="steps" fill="rgba(61,122,138,0.4)" stroke="rgba(61,122,138,0.65)" strokeWidth={1} radius={[2, 2, 0, 0]} />
                <Area yAxisId="weight" type="monotone" dataKey="upper" stroke="none" fill="url(#nG)" legendType="none" />
                <Area yAxisId="weight" type="monotone" dataKey="lower" stroke="none" fill="rgba(4,6,10,0.9)" legendType="none" />
                <Line yAxisId="weight" type="monotone" dataKey="ghost" stroke={AMBER} strokeWidth={1.5} strokeDasharray="5 4" dot={false} opacity={0.45} legendType="none" />
                <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="2 4" dot={false} legendType="none" />
                <Line yAxisId="weight" type="monotone" dataKey="signal" stroke={SAGE_B} strokeWidth={2.5} dot={false}
                  activeDot={{ r: 5, fill: SAGE_B, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }}
                  style={{ filter: 'drop-shadow(0 0 7px rgba(106,220,137,0.8))' }} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        {/* ── MILESTONES + PATTERNS ── */}
        <Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card style={{ padding: '26px 22px' }}>
              <Label>Milestone journey</Label>
              <Heading style={{ marginBottom: 24 }}>Every kg, earned.</Heading>
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', gap: 0 }}>
                {milestones.map((m, i) => (
                  <div key={m.kg} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <motion.div initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
                      transition={{ ...spring, delay: i * 0.04 }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 42 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: MONO, fontSize: 9, fontWeight: 500,
                        border: `1.5px solid ${m.isCurrent ? SAGE : m.crossed ? 'rgba(74,124,89,0.28)' : 'rgba(255,255,255,0.08)'}`,
                        background: m.isCurrent ? 'rgba(74,124,89,0.18)' : m.crossed ? 'rgba(74,124,89,0.07)' : 'rgba(255,255,255,0.03)',
                        color: m.isCurrent ? SAGE_B : m.crossed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
                        boxShadow: m.isCurrent ? `0 0 14px rgba(74,124,89,0.4)` : undefined,
                        animation: m.isCurrent ? 'pulseDot 2.5s ease-in-out infinite' : undefined,
                      }}>
                        {m.kg}
                      </div>
                      {m.date && <span style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }}>{m.date.split(' ').slice(0, 2).join(' ')}</span>}
                    </motion.div>
                    {i < milestones.length - 1 && <div style={{ width: 12, height: 1, background: m.crossed ? 'rgba(74,124,89,0.25)' : 'rgba(255,255,255,0.05)', flexShrink: 0, margin: m.date ? '0 1px 14px' : '0 1px' }} />}
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ padding: '26px 22px' }}>
              <Label>Day of week · avg weight</Label>
              <Heading style={{ marginBottom: 20 }}>Patterns.</Heading>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 88 }}>
                {DAYS.map((d, i) => (
                  <DowBar key={d} day={d} value={dow.avg[i]} min={dowMin} max={dowMax}
                    isLightest={dow.avg[i] === dowMin} isHeaviest={dow.avg[i] === dowMax} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[{ l: 'Lightest', v: dow.lightest, c: SAGE_B }, { l: 'Heaviest', v: dow.heaviest, c: AMBER }, { l: 'Recovery', v: recovery.avg + 'd avg', c: 'white' }].map(s => (
                  <p key={s.l} style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>
                    {s.l}: <span style={{ color: s.c }}>{s.v}</span>
                  </p>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* ── REGRESSION ── */}
        <Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'center' }}>
            <div>
              <Label>The science</Label>
              <Heading style={{ marginBottom: 14 }}>Your biology,<br /><em style={{ color: SAGE_B, fontStyle: 'italic' }}>as math.</em></Heading>
              <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
                {regression.n} entry pairs. Every 1k steps shifts next-day weight by{' '}
                <strong style={{ color: 'white', fontWeight: 500 }}>{(regression.slope * 1000).toFixed(4)} kg</strong>. R² = {regression.r2.toFixed(2)}.
              </p>
            </div>
            <Card level="low" className="glow-sage" style={{ padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${SAGE},transparent)`, opacity: 0.5 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%,rgba(74,124,89,0.08),transparent 60%)', pointerEvents: 'none' }} />
              <Label>{`Personal model · ${regression.n} data pairs`}</Label>
              <p style={{ fontFamily: MONO, fontSize: 'clamp(13px,1.8vw,18px)', color: 'white', lineHeight: 2.2, position: 'relative', zIndex: 1 }}>
                <span style={{ color: '#a8c4a8' }}>Δweight</span> = <span style={{ color: SAGE_B, fontWeight: 500, filter: `drop-shadow(0 0 6px ${SAGE_B})` }}>{(regression.slope * 1000).toFixed(4)}</span> × <span style={{ color: '#a8c4a8' }}>steps</span>/1k<br />
                <span style={{ marginLeft: 90, color: SAGE_B, fontWeight: 500, filter: `drop-shadow(0 0 6px ${SAGE_B})` }}>{regression.intercept >= 0 ? '+' : ''}{regression.intercept.toFixed(4)}</span>
              </p>
              <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                {[{ l: 'R²', v: regression.r2.toFixed(2) }, { l: 'Pairs', v: regression.n + '' }, { l: 'Step explains', v: Math.round(regression.r2 * 100) + '%' }].map(s => (
                  <div key={s.l}>
                    <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{s.l}</p>
                    <p style={{ fontFamily: MONO, fontSize: 14, color: SAGE_B }}>{s.v}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* ── STEP OUTCOMES + ADAPTATION ── */}
        <Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card style={{ padding: '26px 22px' }}>
              <Label>Movement intelligence</Label>
              <Heading style={{ marginBottom: 20 }}>Step outcomes.</Heading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const valid = stepBands.filter(b => b.avg !== null) as { label: string; avg: number; n: number }[]
                  const maxAbs = Math.max(...valid.map(b => Math.abs(b.avg)))
                  return valid.map((b, i) => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', width: 52, flexShrink: 0 }}>{b.label}</span>
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div style={{ height: '100%', borderRadius: 2, background: b.avg < 0 ? SAGE_B : CORAL, boxShadow: b.avg < 0 ? `0 0 8px rgba(106,220,137,0.6)` : `0 0 8px rgba(196,92,74,0.6)` }}
                          initial={{ width: 0 }} whileInView={{ width: `${Math.abs(b.avg / maxAbs) * 100}%` }} viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: b.avg < 0 ? SAGE_B : CORAL, width: 48, textAlign: 'right' }}>
                        {b.avg > 0 ? '+' : ''}{b.avg.toFixed(3)}
                      </span>
                    </div>
                  ))
                })()}
              </div>
              <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 14 }}>
                {spikePct}% of spikes followed sub-{Math.round(stepThreshold / 1000)}k step days
              </p>
            </Card>
            <Card style={{ padding: '26px 22px' }}>
              <Label>Adaptive resistance</Label>
              <Heading style={{ marginBottom: 12 }}>{adapt.isBehavioural ? 'Behavioural.' : 'Metabolic.'}</Heading>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, marginBottom: 14,
                border: `1px solid ${adapt.isBehavioural ? 'rgba(200,121,58,0.3)' : 'rgba(61,122,138,0.3)'}`,
                background: adapt.isBehavioural ? 'rgba(200,121,58,0.07)' : 'rgba(61,122,138,0.07)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: adapt.isBehavioural ? AMBER : '#3d7a8a', boxShadow: `0 0 6px ${adapt.isBehavioural ? AMBER : '#3d7a8a'}` }} />
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: adapt.isBehavioural ? AMBER : '#3d7a8a' }}>
                  {adapt.isBehavioural ? 'Behavioural deceleration' : 'Metabolic adaptation'}
                </span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>
                {adapt.isBehavioural
                  ? `Step count dropped ${Math.abs(adapt.changePct).toFixed(0)}% vs early average (${Math.round(adapt.earlySteps).toLocaleString()} → ${Math.round(adapt.recentSteps).toLocaleString()} steps/day).`
                  : `Step count stable but velocity slowed. Classic metabolic adaptation — body adjusting to lower set-point.`}
              </p>
              {optimalDays.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(74,124,89,0.07)', border: `1px solid rgba(74,124,89,0.15)` }}>
                  <Label>Best weigh-in day</Label>
                  <p style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, color: SAGE_B, letterSpacing: '-0.03em' }}>{optimalDays[0].day}</p>
                  <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>avg {optimalDays[0].avg.toFixed(2)} kg · {optimalDays[0].n} samples</p>
                </div>
              )}
            </Card>
          </div>
        </Section>

        {/* ── RISK + SIMULATOR ── */}
        <Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card level="low" style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${riskColor},transparent)` }} />
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 40%,${riskColor}10,transparent 60%)`, pointerEvents: 'none' }} />
              <Label>Spike risk</Label>
              <Heading style={{ marginBottom: 18, position: 'relative', zIndex: 1 }}>Movement debt.</Heading>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                <div>
                  <span style={{ fontFamily: DISP, fontSize: 80, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.05em', color: riskColor, filter: `drop-shadow(0 0 18px ${riskColor})` }}>
                    <AnimNum value={riskScore} decimals={0} />
                  </span>
                  <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>/100</p>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 150, justifyContent: 'flex-end' }}>
                  {S.slice(-7).map((s, i) => (
                    <motion.div key={i} initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
                      transition={{ ...spring, delay: i * 0.06 }}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 8,
                        border: `1px solid ${s < stepThreshold ? riskColor : SAGE}40`,
                        background: s < stepThreshold ? `${riskColor}14` : 'rgba(74,124,89,0.1)',
                        color: s < stepThreshold ? riskColor : SAGE_B,
                      }}>
                      {s >= 1000 ? Math.round(s / 1000) + 'k' : s}
                    </motion.div>
                  ))}
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <motion.div style={{ height: '100%', borderRadius: 2, background: riskColor, boxShadow: `0 0 10px ${riskColor}` }}
                  initial={{ width: 0 }} whileInView={{ width: `${riskScore}%` }} viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: 10, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
                {riskScore >= 55 ? 'Movement debt building. Pre-spike conditions present.' : riskScore >= 35 ? 'Some debt accumulating. Watch step count.' : 'Debt clear. No spike conditions.'}
              </p>
            </Card>
            <Card style={{ padding: '26px 22px' }}>
              <Label>What-if simulator</Label>
              <Heading style={{ marginBottom: 18 }}>Your regression.</Heading>
              <Label>If I average this many steps</Label>
              <p style={{ fontFamily: DISP, fontSize: 44, fontWeight: 300, color: '#3d7a8a', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 3 }}>{simSteps.toLocaleString()}</p>
              <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.22)', marginBottom: 12 }}>steps / day</p>
              <input type="range" min={500} max={25000} step={500} value={simSteps} onChange={e => setSimSteps(+e.target.value)}
                style={{ width: '100%', marginBottom: 12, accentColor: '#3d7a8a' }} />
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[7, 14, 30].map(d => (
                  <motion.button key={d} onClick={() => setSimDays(d)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 8, fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                      background: simDays === d ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                      color: simDays === d ? 'white' : 'rgba(255,255,255,0.28)',
                      border: `1px solid ${simDays === d ? 'rgba(255,255,255,0.18)' : BORDER}`, cursor: 'pointer',
                    }}>
                    {d}d
                  </motion.button>
                ))}
              </div>
              <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                <Label>{`Projected in ${simDays} days`}</Label>
                <p style={{ fontFamily: DISP, fontSize: 42, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, color: simDelta < 0 ? SAGE_B : simDelta > noiseFloor ? CORAL : 'white' }}>
                  {simResult.toFixed(2)} <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.22)', fontFamily: SANS }}>kg</span>
                </p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: simDelta < 0 ? SAGE : CORAL, marginTop: 5 }}>
                  {simDelta >= 0 ? '+' : ''}{simDelta.toFixed(2)} kg over {simDays} days
                </p>
              </div>
            </Card>
          </div>
        </Section>

        {/* ── GOAL ── */}
        <Reveal style={{ padding: '80px 0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${SAGE}55, transparent)` }} />
          <Card level="hi" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%,rgba(74,124,89,0.09),transparent 50%)', pointerEvents: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20, position: 'relative', zIndex: 1, alignItems: 'center' }}>
              <div>
                <Label>Goal intelligence</Label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <span className="text-glow-sage" style={{ fontFamily: DISP, fontSize: 80, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.05em', color: SAGE_B }}>
                    <AnimNum value={goal.pct} decimals={0} />
                  </span>
                  <span style={{ fontFamily: DISP, fontSize: 40, fontWeight: 300, color: 'rgba(255,255,255,0.18)' }}>%</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                  <motion.div style={{ height: '100%', background: SAGE_B, borderRadius: 2, boxShadow: `0 0 10px rgba(106,220,137,0.5)` }}
                    initial={{ width: 0 }} whileInView={{ width: `${goal.pct}%` }} viewport={{ once: true }}
                    transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>{goal.remaining.toFixed(1)} kg remaining to {meta.goal_weight} kg</p>
              </div>
              <div>
                <Label>Projected arrival</Label>
                <p style={{ fontFamily: DISP, fontSize: 26, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {goal.date ? goal.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recalibrating'}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                  {goal.daysNeeded ? `~${Math.round(goal.daysNeeded / 7)} weeks at current pace` : 'Trend too flat'}
                </p>
              </div>
              <div>
                <Label>All-time low</Label>
                <p style={{ fontFamily: DISP, fontSize: 34, fontWeight: 300, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <AnimNum value={atl.weight} decimals={2} /> <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.22)' }}>kg</span>
                </p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>on {atl.date}</p>
                <p style={{ fontFamily: DISP, fontSize: 28, fontWeight: 300, color: SAGE_B, marginTop: 12, letterSpacing: '-0.03em' }}>
                  {streak}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', fontFamily: SANS, marginLeft: 4 }}>day streak</span>
                </p>
              </div>
            </div>
          </Card>
        </Reveal>

        <div style={{ padding: '48px 0 80px' }}>
          <ActionBox data={data} />
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '22px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <Link href="/" style={{ fontFamily: DISP, fontSize: 18, color: 'white', textDecoration: 'none', fontWeight: 400, letterSpacing: '-0.02em' }}>
          Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
        </Link>
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>{N} entries · signal</span>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <GoalCelebration name={meta.name} onDismiss={dismissCelebration} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)} }
        @keyframes ticker   { from{transform:translateX(0)}to{transform:translateX(-50%)} }
      `}</style>
    </div>
  )
}
