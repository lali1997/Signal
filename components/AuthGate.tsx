'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MONO  = 'DM Mono, monospace'
const DISP  = 'Cormorant Garamond, serif'
const SANS  = 'DM Sans, sans-serif'
const SAGE  = '#4a7c59'
const SAGE_B = '#6adc89'

const PW_RULES = [
  { id: 'len',  label: '8+ characters',  test: (p: string) => p.length >= 8 },
  { id: 'up',   label: 'Uppercase',       test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lo',   label: 'Lowercase',       test: (p: string) => /[a-z]/.test(p) },
  { id: 'num',  label: 'Number',          test: (p: string) => /[0-9]/.test(p) },
  { id: 'sp',   label: 'Special char',    test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function pwScore(p: string) {
  if (!p.length) return 0
  return Math.max(1, PW_RULES.filter(r => r.test(p)).length)
}

const LEVEL   = ['', 'Weak', 'Fair', 'Good', 'Strong']
const LEVEL_C = ['', '#f43f5e', '#f59e0b', '#38bdf8', SAGE_B]

interface Props {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab]     = useState<'signin' | 'signup'>('signin')
  const [view, setView]   = useState<'pw' | 'magic' | 'magic_sent' | 'forgot' | 'forgot_sent'>('pw')
  const [suView, setSuView] = useState<'pw' | 'magic' | 'magic_sent'>('pw')
  const [signupConfirmSent, setSignupConfirmSent] = useState(false)
  const [signupConfirmEmail, setSignupConfirmEmail] = useState('')

  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [name, setName]     = useState('')
  const [magicEmail, setMagicEmail]     = useState('')
  const [forgotEmail, setForgotEmail]   = useState('')
  const [suMagicEmail, setSuMagicEmail] = useState('')
  const [suMagicName, setSuMagicName]   = useState('')

  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  function resetState() {
    setTab('signin'); setView('pw'); setSuView('pw')
    setEmail(''); setPw(''); setPw2(''); setName('')
    setMagicEmail(''); setForgotEmail(''); setSuMagicEmail(''); setSuMagicName('')
    setErr(''); setLoading(false)
  }

  function close() { resetState(); onClose() }

  const score    = pwScore(pw)
  const allRules = PW_RULES.every(r => r.test(pw))
  const pwMatch  = pw === pw2 && pw2.length > 0

  async function doSignin() {
    if (!email || !pw) { setErr('Fill in both fields'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setLoading(false)
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('email_not_confirmed')) {
        setErr('Please confirm your email first. Check your inbox for a confirmation link.')
      } else if (error.message.toLowerCase().includes('invalid login')) {
        setErr('Incorrect email or password.')
      } else {
        setErr(error.message)
      }
      return
    }
    close()
    router.push('/dashboard')
  }

  async function doSignup() {
    if (!name || !email || !pw) { setErr('Fill in all fields'); return }
    setLoading(true); setErr('')
    const { data, error } = await supabase.auth.signUp({
      email, password: pw,
      options: { data: { full_name: name } }
    })
    if (error) { setLoading(false); setErr(error.message); return }
    // Immediately upsert display_name into profiles
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: name.trim(),
      }, { onConflict: 'id' })
    }
    setLoading(false)
    // If email confirmation is on, show message rather than redirecting
    if (!data.session) {
      setSignupConfirmEmail(email)
      setSignupConfirmSent(true)
      return
    }
    close()
    router.push('/dashboard')
  }

  async function doMagicLogin() {
    if (!magicEmail) { setErr('Enter your email'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: window.location.origin + '/dashboard' }
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setView('magic_sent')
  }

  async function doMagicSignup() {
    if (!suMagicName || !suMagicEmail) { setErr('Fill in both fields'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email: suMagicEmail,
      options: { data: { full_name: suMagicName }, emailRedirectTo: window.location.origin + '/dashboard' }
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setSuView('magic_sent')
  }

  async function doForgot() {
    if (!forgotEmail) { setErr('Enter your email'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/reset-password'
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setView('forgot_sent')
  }

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
  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '12px',
    background: 'rgba(74,124,89,0.2)',
    border: `1px solid ${SAGE}`,
    borderRadius: 10, color: SAGE_B,
    fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em',
    textTransform: 'uppercase', cursor: 'pointer',
  }
  const ghostBtn: React.CSSProperties = {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.25)',
    fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
    marginTop: 10, padding: 0,
  }
  const magicBtn: React.CSSProperties = {
    width: '100%', padding: '11px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: 'rgba(255,255,255,0.4)',
    fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em',
    textTransform: 'uppercase', cursor: 'pointer',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — blurs the Signal scene behind */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              background: 'rgba(4,6,10,0.55)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400,
                background: 'rgba(4,6,10,0.97)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 20, padding: '36px 32px',
                backdropFilter: 'blur(40px)',
                boxShadow: '0 0 0 1px rgba(74,124,89,0.06), 0 40px 80px rgba(0,0,0,0.8)',
                pointerEvents: 'auto',
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: DISP, fontSize: 22, fontWeight: 400, color: 'white', letterSpacing: '-0.02em' }}>
                  Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
                </span>
                <button onClick={close}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 3, padding: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                {(['signin', 'signup'] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setErr('') }}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 7, border: 'none',
                      background: tab === t ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: tab === t ? 'white' : 'rgba(255,255,255,0.3)',
                      fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em',
                      textTransform: 'uppercase', cursor: 'pointer',
                    }}>
                    {t === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* ── SIGN IN ── */}
                {tab === 'signin' && (
                  <motion.div key="si" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                    {view === 'pw' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={lbl}>Email</label>
                          <input style={inp} type="email" placeholder="you@example.com"
                            value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                          <label style={lbl}>Password</label>
                          <div style={{ position: 'relative' }}>
                            <input style={inp} type={showPw ? 'text' : 'password'} placeholder="Your password"
                              value={pw} onChange={e => setPw(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && doSignin()} />
                            <button onClick={() => setShowPw(v => !v)}
                              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
                              {showPw ? '○' : '●'}
                            </button>
                          </div>
                        </div>
                        <button onClick={() => { setView('forgot'); setErr('') }}
                          style={{ ...ghostBtn, textAlign: 'right', marginTop: -6 }}>
                          Forgot password?
                        </button>
                        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e', letterSpacing: '0.08em' }}>{err}</p>}
                        <button style={primaryBtn} onClick={doSignin} disabled={loading}>
                          {loading ? 'Signing in…' : 'Sign in →'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.06)' }} />
                          <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>OR</span>
                          <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.06)' }} />
                        </div>
                        <button style={magicBtn} onClick={() => { setView('magic'); setErr('') }}>
                          ✉ Sign in with magic link
                        </button>
                      </div>
                    )}

                    {view === 'magic' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={lbl}>Your email</label>
                          <input style={inp} type="email" placeholder="you@example.com"
                            value={magicEmail} onChange={e => setMagicEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doMagicLogin()} />
                        </div>
                        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e' }}>{err}</p>}
                        <button style={primaryBtn} onClick={doMagicLogin} disabled={loading}>
                          {loading ? 'Sending…' : 'Send magic link →'}
                        </button>
                        <button style={ghostBtn} onClick={() => { setView('pw'); setErr('') }}>← Back</button>
                      </div>
                    )}

                    {view === 'magic_sent' && (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ fontSize: 38, marginBottom: 14 }}>📬</div>
                        <p style={{ fontFamily: DISP, fontSize: 24, color: 'white', marginBottom: 8 }}>Check your inbox</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
                          Sent to <strong style={{ color: 'white' }}>{magicEmail}</strong>.<br />Click the link to enter Signal.
                        </p>
                        <button style={{ ...ghostBtn, marginTop: 20 }} onClick={() => { setView('pw'); setErr('') }}>← Back to sign in</button>
                      </div>
                    )}

                    {view === 'forgot' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={lbl}>Your email</label>
                          <input style={inp} type="email" placeholder="you@example.com"
                            value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doForgot()} />
                        </div>
                        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e' }}>{err}</p>}
                        <button style={primaryBtn} onClick={doForgot} disabled={loading}>
                          {loading ? 'Sending…' : 'Send reset link →'}
                        </button>
                        <button style={ghostBtn} onClick={() => { setView('pw'); setErr('') }}>← Back</button>
                      </div>
                    )}

                    {view === 'forgot_sent' && (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ fontSize: 38, marginBottom: 14 }}>🔑</div>
                        <p style={{ fontFamily: DISP, fontSize: 24, color: 'white', marginBottom: 8 }}>Reset link sent</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
                          Check your email. Link expires in 1 hour.
                        </p>
                        <button style={{ ...ghostBtn, marginTop: 20 }} onClick={() => { setView('pw'); setErr('') }}>← Back to sign in</button>
                      </div>
                    )}

                  </motion.div>
                )}

                {/* ── SIGN UP ── */}
                {tab === 'signup' && (
                  <motion.div key="su" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                    {signupConfirmSent ? (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ fontSize: 38, marginBottom: 14 }}>📬</div>
                        <p style={{ fontFamily: DISP, fontSize: 24, color: 'white', marginBottom: 8 }}>Confirm your email</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
                          We sent a confirmation link to<br />
                          <strong style={{ color: 'white' }}>{signupConfirmEmail}</strong>.<br /><br />
                          Click the link in that email to activate your account, then sign in here.
                        </p>
                        <button style={{ ...ghostBtn, marginTop: 20 }} onClick={() => { setSignupConfirmSent(false); setTab('signin') }}>
                          ← Back to sign in
                        </button>
                      </div>
                    ) : suView === 'pw' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label style={lbl}>Name</label>
                          <input style={inp} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                          <label style={lbl}>Email</label>
                          <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                          <label style={lbl}>Password</label>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: MONO, fontSize: 9, color: LEVEL_C[score] }}>{LEVEL[score]}</span>
                              </div>
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
                            <input style={inp} type={showPw2 ? 'text' : 'password'} placeholder="Repeat password"
                              value={pw2} onChange={e => setPw2(e.target.value)} />
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
                        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e' }}>{err}</p>}
                        <button style={primaryBtn} onClick={doSignup} disabled={loading || !allRules || !pwMatch}>
                          {loading ? 'Creating…' : 'Create account →'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.06)' }} />
                          <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>OR</span>
                          <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.06)' }} />
                        </div>
                        <button style={magicBtn} onClick={() => { setSuView('magic'); setErr('') }}>
                          ✉ Sign up with magic link
                        </button>
                      </div>
                    )}

                    {!signupConfirmSent && suView === 'magic' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={lbl}>Name</label>
                          <input style={inp} type="text" placeholder="Your name" value={suMagicName} onChange={e => setSuMagicName(e.target.value)} />
                        </div>
                        <div>
                          <label style={lbl}>Email</label>
                          <input style={inp} type="email" placeholder="you@example.com" value={suMagicEmail} onChange={e => setSuMagicEmail(e.target.value)} />
                        </div>
                        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e' }}>{err}</p>}
                        <button style={primaryBtn} onClick={doMagicSignup} disabled={loading}>
                          {loading ? 'Sending…' : 'Send magic link →'}
                        </button>
                        <button style={ghostBtn} onClick={() => { setSuView('pw'); setErr('') }}>← Back</button>
                      </div>
                    )}

                    {!signupConfirmSent && suView === 'magic_sent' && (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ fontSize: 38, marginBottom: 14 }}>📬</div>
                        <p style={{ fontFamily: DISP, fontSize: 24, color: 'white', marginBottom: 8 }}>Almost there</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
                          Sent to <strong style={{ color: 'white' }}>{suMagicEmail}</strong>.<br />Click the link to enter Signal.
                        </p>
                        <button style={{ ...ghostBtn, marginTop: 20 }} onClick={() => { setSuView('pw'); setErr('') }}>← Back</button>
                      </div>
                    )}

                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
