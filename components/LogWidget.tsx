'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const MONO   = 'DM Mono, monospace'
const DISP   = 'Cormorant Garamond, serif'
const SANS   = 'DM Sans, sans-serif'
const SAGE   = '#4a7c59'
const SAGE_B = '#6adc89'
const BORDER = 'rgba(255,255,255,0.07)'
const CORAL  = '#f43f5e'

function todayISO(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

interface LogRow {
  id: string
  date_of: string
  weight_kg: number | null
  steps: number | null
  sleep_hrs: number | null
  water_ml: number | null
  mood: number | null
  active_mins: number | null
  notes: string | null
}

interface EditState {
  id: string
  field: keyof Omit<LogRow, 'id' | 'date_of'>
}

interface Toast { msg: string; type: 'ok' | 'err' }

interface EditableCellProps {
  row: LogRow
  field: EditState['field']
  display: string
  editing: EditState | null
  editVal: string
  editSaving: boolean
  setEditVal: (v: string) => void
  setEditing: (e: EditState | null) => void
  commitEdit: () => void
  startEdit: (row: LogRow, field: EditState['field']) => void
}

function EditableCell({ row, field, display, editing, editVal, editSaving, setEditVal, setEditing, commitEdit, startEdit }: EditableCellProps) {
  const isEditing = editing?.id === row.id && editing?.field === field
  if (isEditing) return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        autoFocus
        type={field === 'notes' ? 'text' : 'number'}
        step={field === 'weight_kg' ? '0.1' : '1'}
        value={editVal}
        onChange={e => setEditVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null) }}
        style={{ width: field === 'notes' ? 100 : 65, padding: '3px 6px', background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.4)', borderRadius: 5, color: 'white', fontFamily: field === 'notes' ? SANS : MONO, fontSize: 11, outline: 'none' }}
      />
      <button onClick={commitEdit} disabled={editSaving}
        style={{ background: 'none', border: 'none', color: SAGE_B, cursor: 'pointer', fontSize: 12, opacity: editSaving ? 0.4 : 1 }}>
        {editSaving ? '…' : '✓'}
      </button>
      <button onClick={() => setEditing(null)}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11 }}>✕</button>
    </div>
  )
  return (
    <span
      onClick={() => startEdit(row, field)}
      title="Click to edit"
      style={{
        color: display === '—' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.65)',
        cursor: 'pointer',
        borderBottom: '1px dashed rgba(255,255,255,0.12)',
        paddingBottom: 1,
        fontFamily: field === 'notes' ? SANS : MONO,
        fontSize: 11,
        display: 'block',
        maxWidth: field === 'notes' ? 110 : undefined,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
      {display}
    </span>
  )
}

export default function LogWidget({
  userId,
  timezone = 'Asia/Kolkata',
  forceOpen = 0,
  onForceOpenDone,
}: {
  userId: string
  timezone?: string
  forceOpen?: number
  onForceOpenDone?: () => void
}) {
  const [open, setOpen]   = useState(false)
  const [tab, setTab]     = useState<'today' | 'past' | 'history'>('today')

  // Form state
  const [weight, setWeight]   = useState('')
  const [steps, setSteps]     = useState('')
  const [sleep, setSleep]     = useState('')
  const [water, setWater]     = useState('')
  const [mood, setMood]       = useState('')
  const [active, setActive]   = useState('')
  const [notes, setNotes]     = useState('')
  const [pastDate, setPastDate] = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [err, setErr]         = useState('')

  // History state
  const [history, setHistory]       = useState<LogRow[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [editing, setEditing]       = useState<EditState | null>(null)
  const [editVal, setEditVal]       = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [histSearch, setHistSearch] = useState('')

  // Toast
  const [toast, setToast] = useState<Toast | null>(null)

  // Width animate — in animate prop not style
  const panelWidth = tab === 'history' ? 560 : 340

  useEffect(() => {
    if (forceOpen > 0) {
      setOpen(v => !v)
      onForceOpenDone?.()
    }
  }, [forceOpen])

  // Pre-fill today's existing data when opening Today tab
  useEffect(() => {
    if (open && tab === 'today') prefillToday()
    if (open && tab === 'history') loadHistory()
  }, [open, tab])

  async function prefillToday() {
    const today = todayISO(timezone)
    const { data } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date_of', today)
      .single()
    if (data) {
      setWeight(data.weight_kg ? String(data.weight_kg) : '')
      setSteps(data.steps ? String(data.steps) : '')
      setSleep(data.sleep_hrs ? String(data.sleep_hrs) : '')
      setWater(data.water_ml ? String(data.water_ml) : '')
      setMood(data.mood ? String(data.mood) : '')
      setActive(data.active_mins ? String(data.active_mins) : '')
      setNotes(data.notes || '')
    }
  }

  function clearForm() {
    setWeight(''); setSteps(''); setSleep(''); setWater('')
    setMood(''); setActive(''); setNotes('')
  }

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  async function save(dateStr: string) {
    if (!dateStr) { setErr('Select a date'); return }
    const wt = parseFloat(weight) || null
    const st = parseInt(steps) || null
    if (!wt && !st) { setErr('Enter at least weight or steps'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('health_logs').upsert({
      user_id: userId, date_of: dateStr,
      weight_kg: wt, steps: st,
      sleep_hrs: parseFloat(sleep) || null,
      water_ml: parseInt(water) || null,
      mood: parseInt(mood) || null,
      active_mins: parseInt(active) || null,
      notes: notes.trim() || null,
      source: 'manual',
    }, { onConflict: 'user_id,date_of' })
    setSaving(false)
    if (error) { setErr(error.message); return }
    setSaved(true)
    showToast('Entry saved', 'ok')
    // Don't auto-close — user may want to log steps later
    setTimeout(() => setSaved(false), 2000)
  }

  async function loadHistory() {
    setHistLoading(true)
    const { data } = await supabase
      .from('health_logs')
      .select('id, date_of, weight_kg, steps, sleep_hrs, water_ml, mood, active_mins, notes')
      .eq('user_id', userId)
      .order('date_of', { ascending: false })
      .limit(90)
    setHistory(data || [])
    setHistLoading(false)
  }

  function startEdit(row: LogRow, field: EditState['field']) {
    setEditing({ id: row.id, field })
    setEditVal(String(row[field] ?? ''))
    setPendingDelete(null)
  }

  async function commitEdit() {
    if (!editing) return
    const { id, field } = editing
    let val: any = editVal.trim()
    if (field !== 'notes') {
      val = field === 'weight_kg' ? parseFloat(val) : parseInt(val)
      if (isNaN(val) || val === 0) val = null
    } else {
      val = val || null
    }
    setEditSaving(true)
    const { error } = await supabase.from('health_logs')
      .update({ [field]: val })
      .eq('id', id).eq('user_id', userId)
    setEditSaving(false)
    if (error) { showToast(error.message, 'err'); return }
    setEditing(null)
    showToast('Updated', 'ok')
    loadHistory()
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase.from('health_logs')
      .delete().eq('id', id).eq('user_id', userId)
    if (error) { showToast(error.message, 'err'); return }
    setPendingDelete(null)
    showToast('Entry deleted', 'ok')
    loadHistory()
  }

  const filteredHistory = histSearch
    ? history.filter(r => r.date_of.includes(histSearch) || (r.notes || '').toLowerCase().includes(histSearch.toLowerCase()))
    : history

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, color: 'white',
    fontFamily: SANS, fontSize: 14, outline: 'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
    display: 'block', marginBottom: 5,
  }
  const dateInp: React.CSSProperties = {
    ...inp, cursor: 'pointer', colorScheme: 'dark',
  }

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, padding: '10px 20px',
              background: 'rgba(4,6,10,0.97)',
              border: `1px solid ${toast.type === 'ok' ? 'rgba(74,124,89,0.4)' : 'rgba(244,63,94,0.4)'}`,
              borderRadius: 10, fontFamily: MONO, fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: toast.type === 'ok' ? SAGE_B : CORAL,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget panel — positioned from NavBar via right offset */}
      {/* Widget rendered into document.body to escape dashboard stacking contexts */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
          <>
            {/* Backdrop — click outside to close */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setOpen(false); setEditing(null); setPendingDelete(null) }}
              style={{ position: 'fixed', inset: 0, zIndex: 198 }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0, width: panelWidth }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed',
                top: 68, right: 16, zIndex: 199,
                maxHeight: 'calc(100vh - 88px)',
                background: 'rgba(4,6,10,0.98)',
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                backdropFilter: 'blur(40px)',
                boxShadow: '0 0 0 1px rgba(74,124,89,0.06), 0 24px 60px rgba(0,0,0,0.85)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontFamily: DISP, fontSize: 18, fontWeight: 300, color: 'white', letterSpacing: '-0.02em' }}>Log entry</span>
                <button onClick={() => { setOpen(false); setEditing(null); setPendingDelete(null) }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }}>✕</button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', padding: '10px 18px 0', flexShrink: 0, gap: 0 }}>
                {(['today', 'past', 'history'] as const).map(t => (
                  <button key={t}
                    onClick={() => { setTab(t); setErr(''); setEditing(null); setPendingDelete(null) }}
                    style={{
                      flex: 1, padding: '7px 4px', border: 'none',
                      borderBottom: `1.5px solid ${tab === t ? SAGE_B : 'rgba(255,255,255,0.07)'}`,
                      background: 'transparent',
                      color: tab === t ? SAGE_B : 'rgba(255,255,255,0.28)',
                      fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em',
                      textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {t === 'today' ? 'Today' : t === 'past' ? 'Past date' : 'Edit history'}
                  </button>
                ))}
              </div>

              {/* Scrollable content */}
              <div style={{ overflowY: 'auto', flex: 1 }}>

                {/* ── TODAY ── */}
                {tab === 'today' && (
                  <div style={{ padding: '16px 18px 20px' }}>
                    {/* Show what date we're logging for */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '6px 10px', background: 'rgba(74,124,89,0.08)', borderRadius: 8, border: '1px solid rgba(74,124,89,0.15)' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: SAGE_B, boxShadow: `0 0 6px ${SAGE_B}`, animation: 'pulseDot 2.5s ease-in-out infinite' }} />
                      <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: SAGE_B }}>
                        {todayISO(timezone)}
                      </span>
                      {(weight || steps) && <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginLeft: 'auto' }}>pre-filled from existing entry</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={lbl}>Weight (kg)</label><input style={inp} type="number" step="0.1" placeholder="78.4" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                      <div><label style={lbl}>Steps</label><input style={inp} type="number" placeholder="8432" value={steps} onChange={e => setSteps(e.target.value)} /></div>
                      <div><label style={lbl}>Sleep (hrs)</label><input style={inp} type="number" step="0.5" placeholder="7.5" value={sleep} onChange={e => setSleep(e.target.value)} /></div>
                      <div><label style={lbl}>Water (ml)</label><input style={inp} type="number" placeholder="2500" value={water} onChange={e => setWater(e.target.value)} /></div>
                      <div><label style={lbl}>Mood (1–5)</label><input style={inp} type="number" min="1" max="5" placeholder="4" value={mood} onChange={e => setMood(e.target.value)} /></div>
                      <div><label style={lbl}>Active mins</label><input style={inp} type="number" placeholder="45" value={active} onChange={e => setActive(e.target.value)} /></div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={lbl}>Notes</label>
                      <input style={inp} type="text" placeholder="e.g. ate late, leg day…" maxLength={200} value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    {err && <p style={{ fontFamily: MONO, fontSize: 9, color: CORAL, marginTop: 8 }}>{err}</p>}
                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => save(todayISO(timezone))}
                      disabled={saving}
                      style={{
                        width: '100%', marginTop: 14, padding: '11px',
                        background: saved ? 'rgba(74,124,89,0.25)' : 'rgba(74,124,89,0.15)',
                        border: `1px solid ${saved ? SAGE_B : SAGE}`,
                        borderRadius: 10, color: SAGE_B,
                        fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                      }}>
                      {saved ? '✓ Saved' : saving ? 'Saving…' : "Save today's entry"}
                    </motion.button>
                  </div>
                )}

                {/* ── PAST DATE ── */}
                {tab === 'past' && (
                  <div style={{ padding: '16px 18px 20px' }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Date</label>
                      <input style={dateInp} type="date"
                        max={todayISO(timezone)}
                        value={pastDate} onChange={e => {
                          setPastDate(e.target.value)
                          setErr('')
                          // Pre-fill if entry exists for this date
                          if (e.target.value) {
                            supabase.from('health_logs').select('*').eq('user_id', userId).eq('date_of', e.target.value).single()
                              .then(({ data }) => {
                                if (data) {
                                  setWeight(data.weight_kg ? String(data.weight_kg) : '')
                                  setSteps(data.steps ? String(data.steps) : '')
                                  setSleep(data.sleep_hrs ? String(data.sleep_hrs) : '')
                                  setWater(data.water_ml ? String(data.water_ml) : '')
                                  setMood(data.mood ? String(data.mood) : '')
                                  setActive(data.active_mins ? String(data.active_mins) : '')
                                  setNotes(data.notes || '')
                                } else {
                                  clearForm()
                                }
                              })
                          }
                        }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={lbl}>Weight (kg)</label><input style={inp} type="number" step="0.1" placeholder="78.4" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                      <div><label style={lbl}>Steps</label><input style={inp} type="number" placeholder="8432" value={steps} onChange={e => setSteps(e.target.value)} /></div>
                      <div><label style={lbl}>Sleep (hrs)</label><input style={inp} type="number" step="0.5" placeholder="7.5" value={sleep} onChange={e => setSleep(e.target.value)} /></div>
                      <div><label style={lbl}>Water (ml)</label><input style={inp} type="number" placeholder="2500" value={water} onChange={e => setWater(e.target.value)} /></div>
                      <div><label style={lbl}>Mood (1–5)</label><input style={inp} type="number" min="1" max="5" placeholder="4" value={mood} onChange={e => setMood(e.target.value)} /></div>
                      <div><label style={lbl}>Active mins</label><input style={inp} type="number" placeholder="45" value={active} onChange={e => setActive(e.target.value)} /></div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={lbl}>Notes</label>
                      <input style={inp} type="text" placeholder="e.g. ate late, leg day…" maxLength={200} value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    {err && <p style={{ fontFamily: MONO, fontSize: 9, color: CORAL, marginTop: 8 }}>{err}</p>}
                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => save(pastDate)}
                      disabled={saving || !pastDate}
                      style={{
                        width: '100%', marginTop: 14, padding: '11px',
                        background: saved ? 'rgba(74,124,89,0.25)' : 'rgba(74,124,89,0.15)',
                        border: `1px solid ${saved ? SAGE_B : SAGE}`,
                        borderRadius: 10, color: SAGE_B,
                        fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', cursor: (saving || !pastDate) ? 'not-allowed' : 'pointer',
                        opacity: (saving || !pastDate) ? 0.5 : 1,
                      }}>
                      {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save entry'}
                    </motion.button>
                  </div>
                )}

                {/* ── EDIT HISTORY ── */}
                {tab === 'history' && (
                  <div style={{ padding: '12px 0 0' }}>
                    {/* Search */}
                    <div style={{ padding: '0 14px 10px' }}>
                      <input
                        style={{ ...inp, fontSize: 12 }}
                        type="text" placeholder="Search by date or notes…"
                        value={histSearch} onChange={e => setHistSearch(e.target.value)}
                      />
                    </div>

                    {histLoading ? (
                      <div style={{ padding: '32px', textAlign: 'center', fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Loading…</div>
                    ) : !filteredHistory.length ? (
                      <div style={{ padding: '32px', textAlign: 'center', fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        {histSearch ? 'No matching entries' : 'No entries yet'}
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr>
                              {['Date', 'Weight', 'Steps', 'Sleep', 'Water', 'Mood', 'Active', 'Notes', ''].map(h => (
                                <th key={h} style={{ padding: '5px 10px', fontFamily: MONO, fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHistory.map(row => (
                              <tr key={row.id} style={{
                                borderBottom: `1px solid ${BORDER}`,
                                background: pendingDelete === row.id ? 'rgba(244,63,94,0.06)' : 'transparent',
                                transition: 'background 0.2s',
                              }}>
                                <td style={{ padding: '7px 10px', fontFamily: MONO, fontSize: 10, color: SAGE_B, whiteSpace: 'nowrap' }}>{row.date_of}</td>
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  <EditableCell row={row} field="weight_kg" display={row.weight_kg ? `${row.weight_kg}` : '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  <EditableCell row={row} field="steps" display={row.steps ? Number(row.steps).toLocaleString() : '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  <EditableCell row={row} field="sleep_hrs" display={row.sleep_hrs ? `${row.sleep_hrs}h` : '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  <EditableCell row={row} field="water_ml" display={row.water_ml ? `${row.water_ml}ml` : '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  <EditableCell row={row} field="mood" display={row.mood ? '★'.repeat(row.mood) : '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  <EditableCell row={row} field="active_mins" display={row.active_mins ? `${row.active_mins}m` : '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                <td style={{ padding: '4px 10px' }}>
                                  <EditableCell row={row} field="notes" display={row.notes || '—'}  editing={editing} editVal={editVal} editSaving={editSaving} setEditVal={setEditVal} setEditing={setEditing} commitEdit={commitEdit} startEdit={startEdit}/>
                                </td>
                                {/* Inline delete confirmation */}
                                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                  {pendingDelete === row.id ? (
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                      <span style={{ fontFamily: MONO, fontSize: 8, color: CORAL, letterSpacing: '0.1em' }}>Sure?</span>
                                      <button onClick={() => deleteEntry(row.id)}
                                        style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 5, padding: '2px 7px', color: CORAL, fontFamily: MONO, fontSize: 8, cursor: 'pointer', letterSpacing: '0.1em' }}>
                                        Yes
                                      </button>
                                      <button onClick={() => setPendingDelete(null)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11 }}>✕</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setPendingDelete(row.id); setEditing(null) }}
                                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', cursor: 'pointer', fontSize: 13, transition: 'color 0.15s', padding: '0 2px' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = CORAL)}
                                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}>
                                      ✕
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                      <p style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
                        Click any value to edit · Enter to save · Escape to cancel
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.25)} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        input:focus { border-color: rgba(74,124,89,0.45) !important; background: rgba(74,124,89,0.04) !important; }
      `}</style>
    </>
  )
}
