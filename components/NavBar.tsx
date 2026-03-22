'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const MONO   = 'DM Mono, monospace'
const DISP   = 'Cormorant Garamond, serif'
const SAGE   = '#4a7c59'
const SAGE_B = '#6adc89'
const BORDER = 'rgba(255,255,255,0.07)'

interface Props {
  userName?:  string
  onImport?:  () => void
  onProfile?: () => void
  onSignOut?: () => void
  onLog?:     () => void   // triggers LogWidget open
  logSaved?:  boolean      // shows saved state on pill
  minimal?:   boolean
}

export default function NavBar({ userName, onImport, onProfile, onSignOut, onLog, logSaved, minimal }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const initial = userName?.charAt(0).toUpperCase() || ''

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      data-print-hide
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 60,
        background: 'rgba(4,6,10,0.85)',
        borderBottom: `0.5px solid ${BORDER}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <Link href={userName ? '/dashboard' : '/'} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ fontFamily: DISP, fontSize: 20, fontWeight: 400, color: 'white', letterSpacing: '-0.02em', cursor: 'pointer' }}>
          Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
        </span>
      </Link>

      {!minimal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Landing page — biometric intelligence tag */}
          {!userName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE, boxShadow: `0 0 10px ${SAGE}`, animation: 'pulseDot 2.5s ease-in-out infinite' }} />
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                Biometric intelligence
              </span>
            </div>
          )}

          {/* Dashboard — Log data pill */}
          {userName && onLog && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onLog}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 14px 6px 10px',
                background: 'rgba(4,6,10,0.85)',
                border: `1px solid ${logSaved ? SAGE_B : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 999, cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                boxShadow: logSaved ? `0 0 16px rgba(74,124,89,0.2)` : 'none',
                transition: 'all 0.2s',
              }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: logSaved ? SAGE_B : SAGE,
                boxShadow: `0 0 8px ${logSaved ? SAGE_B : SAGE}`,
                animation: 'pulseDot 2.5s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: logSaved ? SAGE_B : 'rgba(255,255,255,0.5)' }}>
                {logSaved ? 'Saved ✓' : 'Log data'}
              </span>
            </motion.button>
          )}

          {/* Dashboard — Import CSV */}
          {userName && onImport && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onImport}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px 6px 10px',
                background: 'rgba(74,124,89,0.08)',
                border: '1px solid rgba(74,124,89,0.22)',
                borderRadius: 999, cursor: 'pointer',
                fontFamily: MONO, fontSize: 9,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: SAGE_B, transition: 'all 0.2s',
              }}>
              <span style={{ fontSize: 11 }}>↑</span> Import CSV
            </motion.button>
          )}

          {/* Dashboard — user chip with dropdown */}
          {userName && (
            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px 5px 5px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${menuOpen ? 'rgba(74,124,89,0.4)' : BORDER}`,
                  borderRadius: 999, cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,rgba(74,124,89,0.7),rgba(61,122,138,0.5))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>{initial}</div>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  {userName.split(' ')[0]}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8 }}>▾</span>
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      width: 192, background: 'rgba(4,6,10,0.98)',
                      border: `1px solid ${BORDER}`, borderRadius: 12,
                      overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', zIndex: 200,
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {[
                      { label: 'Profile & settings', icon: '⚙', action: onProfile, danger: false },
                      { label: 'Sign out',            icon: '→', action: onSignOut, danger: true },
                    ].map((item, i) => (
                      <button key={item.label} onClick={item.action}
                        style={{
                          width: '100%', padding: '11px 14px',
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: 'transparent', border: 'none',
                          borderBottom: i === 0 ? `1px solid ${BORDER}` : 'none',
                          color: item.danger ? '#f43f5e' : 'rgba(255,255,255,0.55)',
                          fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                          textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ opacity: 0.5, fontSize: 12, flexShrink: 0 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      )}

      <style>{`@keyframes pulseDot { 0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)} }`}</style>
    </motion.nav>
  )
}
