'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

const DISP  = 'Cormorant Garamond, serif'
const MONO  = 'DM Mono, monospace'
const SANS  = 'DM Sans, sans-serif'
const SAGE  = '#4a7c59'
const SAGE_B = '#6adc89'

const PW_RULES = [
  { id: 'len', label: '8+ characters',  test: (p: string) => p.length >= 8 },
  { id: 'up',  label: 'Uppercase',       test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lo',  label: 'Lowercase',       test: (p: string) => /[a-z]/.test(p) },
  { id: 'num', label: 'Number',          test: (p: string) => /[0-9]/.test(p) },
  { id: 'sp',  label: 'Special char',    test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]
const LEVEL_C = ['', '#f43f5e', '#f59e0b', '#38bdf8', SAGE_B, SAGE_B]
const LEVEL   = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Strong']

export default function ResetPassword() {
  const router = useRouter()
  const [pw, setPw]           = useState('')
  const [pw2, setPw2]         = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/')
      else setReady(true)
    })
  }, [router])

  const score    = pw.length === 0 ? 0 : Math.max(1, PW_RULES.filter(r => r.test(pw)).length)
  const allRules = PW_RULES.every(r => r.test(pw))
  const pwMatch  = pw === pw2 && pw2.length > 0

  async function handleReset() {
    if (!allRules) { setErr('Password does not meet requirements'); return }
    if (!pwMatch)  { setErr('Passwords do not match'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) { setErr(error.message); return }
    router.replace('/dashboard')
  }

  if (!ready) return null

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: 'white',
    fontFamily: SANS, fontSize: 14, outline: 'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
    display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <NavBar minimal />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse,rgba(74,124,89,0.06),transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse,rgba(61,122,138,0.04),transparent 70%)', borderRadius: '50%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 400,
          background: 'rgba(4,6,10,0.97)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 0 0 1px rgba(74,124,89,0.06), 0 40px 80px rgba(0,0,0,0.8)',
        }}>

        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: DISP, fontSize: 22, fontWeight: 400, color: 'white', letterSpacing: '-0.02em' }}>
            Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
          </span>
        </div>

        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: 6 }}>Reset password</p>
        <p style={{ fontFamily: DISP, fontSize: 28, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', marginBottom: 24 }}>Set a new password.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>New password</label>
            <div style={{ position: 'relative' }}>
              <input style={inp} type={showPw ? 'text' : 'password'} placeholder="Create a strong password"
                value={pw} onChange={e => setPw(e.target.value)} />
              <button onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
                {showPw ? '○' : '●'}
              </button>
            </div>
            {pw.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: i <= score ? LEVEL_C[score] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: LEVEL_C[score] }}>{LEVEL[score]}</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 6 }}>
                  {PW_RULES.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 9, color: r.test(pw) ? SAGE_B : 'rgba(255,255,255,0.2)' }}>
                      <span style={{ fontSize: 8 }}>{r.test(pw) ? '✓' : '○'}</span> {r.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input style={inp} type={showPw2 ? 'text' : 'password'} placeholder="Repeat your password"
                value={pw2} onChange={e => setPw2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()} />
              <button onClick={() => setShowPw2(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
                {showPw2 ? '○' : '●'}
              </button>
            </div>
            {pw2.length > 0 && (
              <p style={{ fontFamily: MONO, fontSize: 9, marginTop: 5, color: pwMatch ? SAGE_B : '#f43f5e' }}>
                {pwMatch ? '✓ Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e', letterSpacing: '0.08em' }}>{err}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={loading || !allRules || !pwMatch}
            style={{
              width: '100%', padding: '12px',
              background: 'rgba(74,124,89,0.2)', border: `1px solid ${SAGE}`,
              borderRadius: 10, color: SAGE_B,
              fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !allRules || !pwMatch ? 0.5 : 1,
            }}>
            {loading ? 'Updating…' : 'Set new password →'}
          </motion.button>
        </div>
      </motion.div>
      <style>{`input:focus { border-color: rgba(74,124,89,0.5) !important; }`}</style>
    </div>
  )
}
