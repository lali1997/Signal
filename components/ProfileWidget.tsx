'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MONO   = 'DM Mono, monospace'
const DISP   = 'Cormorant Garamond, serif'
const SANS   = 'DM Sans, sans-serif'
const SAGE   = '#4a7c59'
const SAGE_B = '#6adc89'
const BORDER = 'rgba(255,255,255,0.07)'

const TIMEZONES = [
  { label: 'India (IST)',             value: 'Asia/Kolkata' },
  { label: 'US East (EST)',           value: 'America/New_York' },
  { label: 'US West (PST)',           value: 'America/Los_Angeles' },
  { label: 'UK (GMT/BST)',            value: 'Europe/London' },
  { label: 'Central Europe (CET)',    value: 'Europe/Berlin' },
  { label: 'UAE (GST)',               value: 'Asia/Dubai' },
  { label: 'Singapore (SGT)',         value: 'Asia/Singapore' },
  { label: 'Australia Sydney (AEDT)', value: 'Australia/Sydney' },
  { label: 'Japan (JST)',             value: 'Asia/Tokyo' },
]

interface Props {
  open:    boolean
  onClose: () => void
  userId:  string
}

export default function ProfileWidget({ open, onClose, userId }: Props) {
  const router = useRouter()
  const [name,    setName]    = useState('')
  const [goal,    setGoal]    = useState('')
  const [tz,      setTz]      = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [err,     setErr]     = useState('')
  const [tab,     setTab]     = useState<'profile' | 'account'>('profile')

  useEffect(() => {
    if (!open) return
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (data) {
          setName(data.display_name || '')
          setGoal(data.goal_weight ? String(data.goal_weight) : '')
          setTz(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')
        }
      })
  }, [open, userId])

  async function saveProfile() {
    setLoading(true); setErr(''); setSaved(false)
    const { error } = await supabase.from('profiles').update({
      display_name: name.trim() || null,
      goal_weight:  goal ? parseFloat(goal) : null,
      timezone:     tz,
    }).eq('id', userId)
    setLoading(false)
    if (error) { setErr(error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function changePassword() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user.email) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: window.location.origin + '/reset-password'
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setErr('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function exportCSV() {
    const { data } = await supabase
      .from('health_logs')
      .select('date_of, weight_kg, steps, sleep_hrs, water_ml, mood, active_mins, notes')
      .eq('user_id', userId)
      .order('date_of', { ascending: true })
    if (!data?.length) return

    const headers = ['date', 'weight', 'steps', 'sleep_hrs', 'water_ml', 'mood', 'active_mins', 'notes']
    const rows = data.map(r =>
      [r.date_of, r.weight_kg ?? '', r.steps ?? '', r.sleep_hrs ?? '', r.water_ml ?? '',
       r.mood ?? '', r.active_mins ?? '', (r.notes || '').replace(/,/g, ';')].join(',')
    )
    const csv  = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `signal-data-${new Date().toLocaleDateString('en-CA')}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
  const sel: React.CSSProperties = {
    ...inp, cursor: 'pointer',
    appearance: 'none' as any,
    WebkitAppearance: 'none' as any,
  }
  const ghostBtn: React.CSSProperties = {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.25)',
    fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
    marginTop: 10, padding: 0,
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="pb"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(4,6,10,0.65)',
            }}
          />

          <motion.div
            key="pm"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 301,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 420,
                background: 'rgba(4,6,10,0.98)',
                border: `1px solid ${BORDER}`,
                borderRadius: 20, padding: '32px 28px',
                boxShadow: '0 0 0 1px rgba(74,124,89,0.06), 0 40px 80px rgba(0,0,0,0.9)',
                pointerEvents: 'auto',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: 4 }}>Settings</p>
                  <p style={{ fontFamily: DISP, fontSize: 26, fontWeight: 300, color: 'white', letterSpacing: '-0.02em' }}>Your profile.</p>
                </div>
                <button onClick={onClose}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 3, padding: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${BORDER}`, marginBottom: 24 }}>
                {(['profile', 'account'] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setErr(''); setSaved(false) }}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 7, border: 'none',
                      background: tab === t ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: tab === t ? 'white' : 'rgba(255,255,255,0.3)',
                      fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em',
                      textTransform: 'uppercase', cursor: 'pointer',
                    }}>
                    {t === 'profile' ? 'Profile' : 'Account'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* ── PROFILE TAB ── */}
                {tab === 'profile' && (
                  <motion.div key="prof" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div>
                        <label style={lbl}>Display name</label>
                        <input style={inp} type="text" placeholder="Your name"
                          value={name} onChange={e => setName(e.target.value)} />
                      </div>

                      <div>
                        <label style={lbl}>Goal weight (kg)</label>
                        <input style={inp} type="number" step="0.1" placeholder="e.g. 70"
                          value={goal} onChange={e => setGoal(e.target.value)} />
                        <p style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 5, letterSpacing: '0.1em' }}>
                          Used for goal % and projected arrival date
                        </p>
                      </div>

                      <div>
                        <label style={lbl}>Timezone</label>
                        <div style={{ position: 'relative' }}>
                          <select style={sel} value={tz} onChange={e => setTz(e.target.value)}>
                            {TIMEZONES.map(t => (
                              <option key={t.value} value={t.value} style={{ background: '#0a0f0c' }}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', fontSize: 10 }}>▾</span>
                        </div>
                        <p style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 5, letterSpacing: '0.1em' }}>
                          Ensures late-night logs land on the correct date
                        </p>
                      </div>

                      {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e' }}>{err}</p>}

                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={saveProfile} disabled={loading}
                        style={{
                          width: '100%', padding: '12px',
                          background: saved ? 'rgba(74,124,89,0.25)' : 'rgba(74,124,89,0.15)',
                          border: `1px solid ${saved ? SAGE_B : SAGE}`,
                          borderRadius: 10, color: SAGE_B,
                          fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em',
                          textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1,
                        }}>
                        {loading ? 'Saving…' : saved ? '✓ Saved' : 'Save profile →'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── ACCOUNT TAB ── */}
                {tab === 'account' && (
                  <motion.div key="acc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                      {/* Export data */}
                      <div style={{ padding: '16px', borderRadius: 12, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Your data</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>
                          Download all your entries as a CSV file.
                        </p>
                        <button onClick={exportCSV}
                          style={{
                            padding: '9px 18px', borderRadius: 8,
                            background: 'rgba(74,124,89,0.08)',
                            border: '1px solid rgba(74,124,89,0.2)',
                            color: SAGE_B,
                            fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em',
                            textTransform: 'uppercase', cursor: 'pointer',
                          }}>
                          Export CSV →
                        </button>
                      </div>

                      {/* Change password */}
                      <div style={{ padding: '16px', borderRadius: 12, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Password</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>
                          A reset link will be sent to your email address.
                        </p>
                        {saved && tab === 'account' && (
                          <p style={{ fontFamily: MONO, fontSize: 9, color: SAGE_B, marginBottom: 8 }}>✓ Reset link sent — check your email</p>
                        )}
                        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e', marginBottom: 8 }}>{err}</p>}
                        <button onClick={changePassword} disabled={loading}
                          style={{
                            padding: '9px 18px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                            fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em',
                            textTransform: 'uppercase', cursor: 'pointer',
                          }}>
                          {loading ? 'Sending…' : 'Send reset link →'}
                        </button>
                      </div>

                      {/* Sign out */}
                      <div style={{ padding: '16px', borderRadius: 12, border: '1px solid rgba(244,63,94,0.12)', background: 'rgba(244,63,94,0.03)' }}>
                        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Session</p>
                        <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>
                          Sign out of Signal on this device.
                        </p>
                        <button onClick={signOut}
                          style={{
                            padding: '9px 18px', borderRadius: 8,
                            background: 'rgba(244,63,94,0.08)',
                            border: '1px solid rgba(244,63,94,0.2)',
                            color: '#f43f5e',
                            fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em',
                            textTransform: 'uppercase', cursor: 'pointer',
                          }}>
                          Sign out →
                        </button>
                      </div>

                    </div>
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
