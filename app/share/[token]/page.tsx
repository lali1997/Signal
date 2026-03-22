'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { computeAll } from '@/lib/calculations'
import DashboardClient from '@/components/dashboard/DashboardClient'
import NavBar from '@/components/NavBar'

const MONO  = 'DM Mono, monospace'
const DISP  = 'Cormorant Garamond, serif'
const SAGE_B = '#6adc89'

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string

  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'expired'>('loading')
  const [dashData, setDashData] = useState<ReturnType<typeof computeAll> | null>(null)
  const [sharedBy, setSharedBy] = useState('')

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    load()
  }, [token])

  async function load() {
    // Look up the share token
    const { data: shareRow } = await supabase
      .from('share_tokens')
      .select('user_id, expires_at, label')
      .eq('token', token)
      .single()

    if (!shareRow) { setState('invalid'); return }

    // Check expiry
    if (shareRow.expires_at && new Date(shareRow.expires_at) < new Date()) {
      setState('expired'); return
    }

    const uid = shareRow.user_id

    // Load their profile
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', uid).single()

    // Load their logs
    const { data: logs } = await supabase
      .from('health_logs')
      .select('date_of, weight_kg, steps')
      .eq('user_id', uid)
      .not('weight_kg', 'is', null)
      .order('date_of', { ascending: true })

    if (!logs || logs.length < 2 || !profile?.goal_weight) {
      setState('invalid'); return
    }

    const name = profile.display_name || 'Signal user'
    setSharedBy(name)

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

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    setDashData(computeAll(entries, meta, today))
    setState('ready')
  }

  if (state === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(74,124,89,0.2)', borderTopColor: '#6adc89', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Loading signal…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (state === 'invalid') return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
      <NavBar minimal />
      <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: 80 }}>Invalid link</p>
      <p style={{ fontFamily: DISP, fontSize: 32, fontWeight: 300, color: 'white' }}>This signal doesn't exist.</p>
      <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.8 }}>The share link is invalid or has been revoked.</p>
    </div>
  )

  if (state === 'expired') return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
      <NavBar minimal />
      <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8793a', marginTop: 80 }}>Link expired</p>
      <p style={{ fontFamily: DISP, fontSize: 32, fontWeight: 300, color: 'white' }}>This signal has gone dark.</p>
      <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Ask {sharedBy} to share a new link.</p>
    </div>
  )

  return (
    <>
      {/* Read-only banner */}
      <div style={{
        position: 'fixed', top: 60, left: 0, right: 0, zIndex: 140,
        background: 'rgba(61,122,138,0.08)',
        borderBottom: '1px solid rgba(61,122,138,0.2)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 48px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3d7a8a', flexShrink: 0 }} />
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(61,122,138,0.9)' }}>
            Read-only view · {sharedBy}'s signal
          </span>
        </div>
      </div>

      <NavBar minimal />
      {dashData && <DashboardClient data={dashData} />}
    </>
  )
}
