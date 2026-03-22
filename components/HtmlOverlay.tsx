'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthGate'

const DISP  = 'Cormorant Garamond, serif'
const MONO  = 'DM Mono, monospace'
const SANS  = 'DM Sans, sans-serif'
const SAGE_B = '#6adc89'
const SAGE   = '#4a7c59'
const ease   = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...ease, delay }} style={style}>
      {children}
    </motion.div>
  )
}

export default function HtmlOverlay({ scrollT }: { scrollT: number }) {
  const [authOpen,   setAuthOpen]   = useState(false)
  const [loggedIn,   setLoggedIn]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

      {/* NAV */}
      <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...ease, delay: 0.3 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 48px', pointerEvents: 'auto' }}>
        <span style={{ fontFamily: DISP, fontSize: 20, fontWeight: 400, color: 'white', letterSpacing: '-0.02em' }}>
          Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE, boxShadow: `0 0 10px ${SAGE}`, animation: 'pulseDot 2.5s ease-in-out infinite' }} />
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Biometric intelligence
          </span>
          {/* If already logged in — show dashboard link in nav */}
          {loggedIn && (
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.03 }}
              style={{
                marginLeft: 16,
                padding: '5px 14px', borderRadius: 999,
                background: 'rgba(74,124,89,0.12)',
                border: '1px solid rgba(74,124,89,0.3)',
                color: SAGE_B, fontFamily: MONO, fontSize: 9,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
              Dashboard →
            </motion.a>
          )}
        </div>
      </motion.nav>

      {/* ZONE 1 — HERO (0–0.20) */}
      <motion.div
        animate={{ opacity: scrollT < 0.22 ? 1 : 0, y: scrollT < 0.22 ? 0 : -30 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', bottom: '12%', left: '6%', maxWidth: 680 }}>
        <Reveal delay={0.5}>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: SAGE, marginBottom: 16 }}>
            Biometric intelligence
          </p>
        </Reveal>
        <Reveal delay={0.7}>
          <div style={{ fontFamily: DISP, fontSize: 'clamp(72px,10vw,128px)', fontWeight: 300, lineHeight: 0.88, letterSpacing: '-0.05em', color: 'white', marginBottom: 10 }}>
            Your body.
          </div>
        </Reveal>
        <Reveal delay={0.85}>
          <div style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.04em', fontStyle: 'italic', color: SAGE_B, marginBottom: 28, textShadow: '0 0 40px rgba(106,220,137,0.3)' }}>
            Decoded.
          </div>
        </Reveal>
        <Reveal delay={1.0}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { v: 'Months',    l: 'Journey' },
              { v: 'Formula',   l: 'Personal equation' },
              { v: 'Your goal', l: 'Destination' },
            ].map(m => (
              <div key={m.l} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontFamily: DISP, fontSize: 22, fontWeight: 300, color: SAGE_B, letterSpacing: '-0.03em', lineHeight: 1 }}>{m.v}</p>
                <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{m.l}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={1.3}>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>
            ↓ Scroll to fly through the signal
          </p>
        </Reveal>
      </motion.div>

      {/* ZONE 2 — FLY-THROUGH (0.22–0.48) */}
      <motion.div
        animate={{ opacity: scrollT > 0.22 && scrollT < 0.48 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'absolute', top: '18%', right: '6%', textAlign: 'right', maxWidth: 280 }}>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: 8 }}>Trajectory</p>
        <p style={{ fontFamily: DISP, fontSize: 32, fontWeight: 300, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Flying through<br /><em style={{ color: SAGE_B, fontStyle: 'italic' }}>every weigh-in.</em>
        </p>
        <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 12, lineHeight: 1.7 }}>
          Each orb is a weigh-in.<br />
          <span style={{ color: SAGE_B }}>Green</span> = normal ·{' '}
          <span style={{ color: '#c8793a' }}>Amber</span> = spike
        </p>
      </motion.div>

      {/* ZONE 3 — MATH (0.48–0.68) */}
      <motion.div
        animate={{ opacity: scrollT > 0.48 && scrollT < 0.68 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'absolute', bottom: '15%', left: '6%', maxWidth: 460 }}>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: 12 }}>Your burn rate. Encoded.</p>
        <p style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 300, color: 'white', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 16 }}>
          f(Δw) = β · steps + α
        </p>
        <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', lineHeight: 1.8 }}>
          A personal equation.<br />Unique to your biology.<br />Yours alone.
        </p>
      </motion.div>

      {/* ZONE 4 — DESTINATION + CTA (0.70–1.0) */}
      <motion.div
        animate={{ opacity: scrollT > 0.70 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%', maxWidth: 560 }}>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: 12 }}>The destination</p>
        <p style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 300, color: 'white', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
          A few months<br />
          <em style={{ color: SAGE_B, fontStyle: 'italic', fontSize: '0.75em' }}>from the finish line.</em>
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.38)', marginBottom: 28 }}>
          {loggedIn
            ? 'Your signal is live. Go to your dashboard.'
            : 'The glowing line is your goal. Sign in to decode your signal.'}
        </p>

        {loggedIn ? (
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-block', padding: '14px 40px', borderRadius: 999,
              background: 'rgba(74,124,89,0.14)', border: '1px solid rgba(74,124,89,0.4)',
              color: SAGE_B, fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em',
              textTransform: 'uppercase', textDecoration: 'none',
              backdropFilter: 'blur(20px)', pointerEvents: 'auto',
              boxShadow: '0 0 30px rgba(74,124,89,0.15)',
            }}>
            Go to your dashboard →
          </motion.a>
        ) : (
          <motion.button
            onClick={() => setAuthOpen(true)}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-block', padding: '14px 40px', borderRadius: 999,
              background: 'rgba(74,124,89,0.14)', border: '1px solid rgba(74,124,89,0.4)',
              color: SAGE_B, fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(20px)', cursor: 'pointer', pointerEvents: 'auto',
              boxShadow: '0 0 30px rgba(74,124,89,0.15)',
            }}>
            Sign in / Create account
          </motion.button>
        )}
      </motion.div>

      {/* Zone progress dots */}
      <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {['Data','Fly','Math','Goal'].map((label, i) => {
          const zones = [0, 0.22, 0.48, 0.70]
          const active = scrollT >= zones[i] && (i === 3 || scrollT < zones[i+1])
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 4, height: active ? 24 : 8, borderRadius: 2, background: active ? SAGE_B : 'rgba(255,255,255,0.1)', boxShadow: active ? `0 0 8px ${SAGE_B}` : 'none', transition: 'all 0.4s ease' }} />
              <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? SAGE : 'rgba(255,255,255,0.15)', transition: 'color 0.4s ease' }}>{label}</span>
            </div>
          )
        })}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity:0.5; transform:scale(1); }
          50% { opacity:1; transform:scale(1.25); }
        }
      `}</style>
    </div>
  )
}
