'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { computeAll } from '@/lib/calculations'
import DashboardClient from '@/components/dashboard/DashboardClient'
import LogWidget from '@/components/LogWidget'
import ImportWidget from '@/components/ImportWidget'
import ProfileWidget from '@/components/ProfileWidget'
import NavBar from '@/components/NavBar'

const MONO   = 'DM Mono, monospace'
const DISP   = 'Cormorant Garamond, serif'
const SANS   = 'DM Sans, sans-serif'
const SAGE   = '#4a7c59'
const SAGE_B = '#6adc89'
const BORDER = 'rgba(255,255,255,0.07)'

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Goal setup prompt — shown when user has data but no goal set ─────────────
function GoalPrompt({ name, onSave }: { name: string; onSave: (goal: number) => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')

  function submit() {
    const n = parseFloat(val)
    if (!val || isNaN(n) || n < 30 || n > 300) { setErr('Enter a valid weight between 30–300 kg'); return }
    onSave(n)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#04060a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse,rgba(74,124,89,0.05),transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse,rgba(61,122,138,0.04),transparent 70%)', borderRadius: '50%' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, textAlign: 'center' }}
      >
        <p style={{ fontFamily: DISP, fontSize: 22, color: 'white', letterSpacing: '-0.02em', marginBottom: 32 }}>
          Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
        </p>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: SAGE, marginBottom: 8 }}>One last thing</p>
        <h1 style={{ fontFamily: DISP, fontSize: 'clamp(40px,7vw,64px)', fontWeight: 300, color: 'white', letterSpacing: '-0.04em', lineHeight: 0.9, marginBottom: 12 }}>
          {name}.
        </h1>
        <p style={{ fontFamily: DISP, fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 300, fontStyle: 'italic', color: SAGE_B, marginBottom: 32 }}>
          What's your goal weight?
        </p>
        <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', lineHeight: 1.8, marginBottom: 24 }}>
          This drives your goal %, projected arrival date,<br />and all trajectory calculations.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <input
            type="number" step="0.1" placeholder="e.g. 70"
            value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{
              width: 140, padding: '12px 16px', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'white',
              fontFamily: DISP, fontSize: 22, outline: 'none',
            }}
          />
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>kg</span>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={submit}
            style={{
              padding: '12px 24px', borderRadius: 999,
              background: 'rgba(74,124,89,0.15)', border: `1px solid ${SAGE}`,
              color: SAGE_B, fontFamily: MONO, fontSize: 10,
              letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
            Set goal →
          </motion.button>
        </div>
        {err && <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e', marginTop: 12 }}>{err}</p>}
      </motion.div>
    </div>
  )
}

// ── Empty state — new user, no data ─────────────────────────────────────────
function EmptyState({ name, onImport, onLog }: { name: string; onImport: () => void; onLog: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse,rgba(74,124,89,0.05),transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse,rgba(61,122,138,0.04),transparent 70%)', borderRadius: '50%' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480 }}
      >
        <p style={{ fontFamily: DISP, fontSize: 22, color: 'white', letterSpacing: '-0.02em', marginBottom: 32 }}>
          Sig<em style={{ fontStyle: 'italic', color: SAGE_B }}>nal</em>
        </p>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: SAGE, marginBottom: 8 }}>Welcome</p>
        <h1 style={{ fontFamily: DISP, fontSize: 'clamp(48px,8vw,80px)', fontWeight: 300, color: 'white', letterSpacing: '-0.04em', lineHeight: 0.9, marginBottom: 12 }}>{name}.</h1>
        <p style={{ fontFamily: DISP, fontSize: 'clamp(24px,4vw,36px)', fontWeight: 300, fontStyle: 'italic', color: SAGE_B, letterSpacing: '-0.02em', marginBottom: 32 }}>Your signal awaits.</p>
        <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', lineHeight: 1.8, marginBottom: 40 }}>
          No data yet. Import your historic CSV<br />or start logging daily entries.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={onImport}
            style={{ padding: '14px 32px', borderRadius: 999, background: 'rgba(74,124,89,0.15)', border: `1px solid ${SAGE}`, color: SAGE_B, fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(20px)', boxShadow: '0 0 24px rgba(74,124,89,0.12)' }}>
            Import CSV →
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={onLog}
            style={{ padding: '14px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Log today
          </motion.button>
        </div>
        <div style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 8, background: 'rgba(74,124,89,0.06)', border: '1px solid rgba(74,124,89,0.14)' }}>
          <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>CSV columns:</span>
          {['date', 'weight', 'steps'].map((col, i) => (
            <span key={col} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <code style={{ fontFamily: MONO, fontSize: 9, color: SAGE_B, background: 'rgba(106,220,137,0.08)', padding: '2px 6px', borderRadius: 4 }}>{col}</code>
              {i < 2 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}


// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()

  const [state, setState] = useState<
    'loading' | 'no_data' | 'no_goal' | 'ready' | 'error'
  >('loading')

  const [dashData,    setDashData]    = useState<ReturnType<typeof computeAll> | null>(null)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [userName,    setUserName]    = useState('You')
  const [importOpen,  setImportOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logTrigger,  setLogTrigger]  = useState(0)
  const [logSaved,    setLogSaved]    = useState(false)
  const [userTz,      setUserTz]      = useState('Asia/Kolkata')

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/'); return }

    const uid = session.user.id
    setUserId(uid)

    // Load profile — no fallbacks, purely from Supabase
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', uid).single()

    const name = profile?.display_name || session.user.email?.split('@')[0] || 'You'
    setUserName(name)
    setUserTz(profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')

    // Load logs
    const { data: logs, error } = await supabase
      .from('health_logs')
      .select('date_of, weight_kg, steps')
      .eq('user_id', uid)
      .not('weight_kg', 'is', null)
      .order('date_of', { ascending: true })

    if (error) { setState('error'); return }

    // Not enough data yet
    if (!logs || logs.length < 2) { setState('no_data'); return }

    // Has data but no goal weight set
    if (!profile?.goal_weight) { setState('no_goal'); return }

    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })

    const entries = logs.map(r => ({
      date:   formatDate(r.date_of),
      weight: r.weight_kg,
      steps:  r.steps ?? 0,
    }))

    const meta = {
      name,
      goal_weight:  profile.goal_weight,
      start_date:   formatDate(logs[0].date_of),
      log_gap_warn: 3,
    }

    setDashData(computeAll(entries, meta, today))
    setState('ready')
  }, [router])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('health_logs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'health_logs' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function saveGoal(goal: number) {
    if (!userId) return
    await supabase.from('profiles').update({ goal_weight: goal }).eq('id', userId)
    load()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (state === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(74,124,89,0.2)', borderTopColor: '#6adc89', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Decoding your signal…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (state === 'error') return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f43f5e' }}>Connection error</p>
      <button onClick={load} style={{ fontFamily: MONO, fontSize: 9, color: SAGE_B, background: 'none', border: `1px solid ${SAGE}`, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Retry →</button>
    </div>
  )

  if (state === 'no_data') return (
    <>
      <EmptyState name={userName} onImport={() => setImportOpen(true)} onLog={() => setLogTrigger(n => n + 1)} />
      {userId && (
        <>
          <ImportWidget open={importOpen} onClose={() => { setImportOpen(false); load() }} userId={userId} />
          <LogWidget userId={userId} timezone={userTz} forceOpen={logTrigger} onForceOpenDone={() => {}} />
          <NavBar userName={userName} onImport={() => setImportOpen(true)} onProfile={() => setProfileOpen(true)} onSignOut={signOut} onLog={() => setLogTrigger(n => n + 1)} logSaved={logSaved} />
          <ProfileWidget open={profileOpen} onClose={() => { setProfileOpen(false); load() }} userId={userId} />
        </>
      )}
    </>
  )

  if (state === 'no_goal') return (
    <>
      <GoalPrompt name={userName} onSave={saveGoal} />
      {userId && <NavBar userName={userName} onImport={() => setImportOpen(true)} onProfile={() => setProfileOpen(true)} onSignOut={signOut} onLog={() => setLogTrigger(n => n + 1)} logSaved={logSaved} />}
      {userId && <ImportWidget open={importOpen} onClose={() => { setImportOpen(false); load() }} userId={userId} />}
      {userId && <ProfileWidget open={profileOpen} onClose={() => { setProfileOpen(false); load() }} userId={userId} />}
    </>
  )

  if (state === 'ready' && dashData && userId) return (
    <>
      <NavBar userName={userName} onImport={() => setImportOpen(true)} onProfile={() => setProfileOpen(true)} onSignOut={signOut} onLog={() => setLogTrigger(n => n + 1)} logSaved={logSaved} />
      <ImportWidget open={importOpen} onClose={() => { setImportOpen(false); load() }} userId={userId} />
      <ProfileWidget open={profileOpen} onClose={() => { setProfileOpen(false); load() }} userId={userId} />
      <LogWidget userId={userId} timezone={userTz} forceOpen={logTrigger} onForceOpenDone={() => {}} />
      <DashboardClient data={dashData} onSettings={() => setProfileOpen(true)} />
    </>
  )

  return null
}
