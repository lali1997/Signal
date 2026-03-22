'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const MONO  = 'DM Mono, monospace'
const DISP  = 'Cormorant Garamond, serif'
const SANS  = 'DM Sans, sans-serif'
const SAGE  = '#4a7c59'
const SAGE_B = '#6adc89'
const BORDER = 'rgba(255,255,255,0.07)'

// ── Date parsers ─────────────────────────────────────────────────────────────
function parseDate(s: string): string | null {
  if (!s) return null
  s = s.trim()
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  // MM/DD/YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [m, d, y] = s.split('-')
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  // DD MMM YYYY e.g. "05 Nov 2025"
  const months: Record<string,string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
  }
  const m2 = s.match(/^(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})$/)
  if (m2) return `${m2[3]}-${months[m2[2].toLowerCase()]}-${m2[1].padStart(2,'0')}`
  // Try native
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-CA')
  return null
}

interface ParsedRow {
  date_of:    string
  weight_kg:  number | null
  steps:      number | null
  sleep_hrs:  number | null
  water_ml:   number | null
  mood:       number | null
  notes:      string | null
}

function parseCSV(text: string): { rows: ParsedRow[]; skipped: number } {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { rows: [], skipped: 0 }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const fc = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex(h => h.includes(n))
      if (i > -1) return i
    }
    return -1
  }

  const iDate   = fc('date')
  const iWeight = fc('weight', 'wt', 'kg')
  const iSteps  = fc('step')
  const iSleep  = fc('sleep')
  const iWater  = fc('water')
  const iMood   = fc('mood')
  const iNotes  = fc('note', 'comment', 'remark')

  // Must have date + at least weight or steps
  if (iDate === -1 || (iWeight === -1 && iSteps === -1)) return { rows: [], skipped: 0 }

  const rows: ParsedRow[] = []
  let skipped = 0

  lines.slice(1).forEach(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const date = parseDate(cols[iDate])
    if (!date) { skipped++; return }

    const wt = iWeight > -1 && cols[iWeight] ? parseFloat(cols[iWeight]) : NaN
    const st = iSteps  > -1 && cols[iSteps]  ? parseInt(cols[iSteps])   : NaN

    // Skip rows with no weight AND no steps
    if (isNaN(wt) && isNaN(st)) { skipped++; return }

    rows.push({
      date_of:   date,
      weight_kg: !isNaN(wt) ? wt : null,
      steps:     !isNaN(st) ? st : null,
      sleep_hrs: iSleep > -1 && cols[iSleep] ? parseFloat(cols[iSleep]) || null : null,
      water_ml:  iWater > -1 && cols[iWater] ? parseInt(cols[iWater])   || null : null,
      mood:      iMood  > -1 && cols[iMood]  ? parseInt(cols[iMood])    || null : null,
      notes:     iNotes > -1 && cols[iNotes] ? cols[iNotes] || null              : null,
    })
  })

  return { rows, skipped }
}

interface Props {
  open:    boolean
  onClose: () => void
  userId:  string
}

export default function ImportWidget({ open, onClose, userId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows,    setRows]    = useState<ParsedRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress,  setProgress]  = useState('')
  const [done,      setDone]      = useState(false)
  const [err,       setErr]       = useState('')

  function reset() {
    setRows([]); setSkipped(0); setFileName('')
    setProgress(''); setDone(false); setErr('')
  }

  function close() { reset(); onClose() }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) { setErr('Please select a .csv file'); return }
    setFileName(file.name); setErr(''); setDone(false)
    const reader = new FileReader()
    reader.onload = e => {
      const { rows: parsed, skipped: sk } = parseCSV(e.target?.result as string)
      if (!parsed.length) {
        setErr('Could not parse CSV. Make sure it has a "date" column and at least "weight" or "steps".')
        return
      }
      setRows(parsed); setSkipped(sk)
    }
    reader.readAsText(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function runImport() {
    if (!rows.length) return
    setImporting(true); setErr('')

    const payload = rows.map(r => ({ ...r, user_id: userId, source: 'csv_import' }))
    const CHUNK = 100
    let imported = 0, failed = 0

    for (let i = 0; i < payload.length; i += CHUNK) {
      const chunk = payload.slice(i, i + CHUNK)
      const { error } = await supabase
        .from('health_logs')
        .upsert(chunk, { onConflict: 'user_id,date_of' })
      error ? failed += chunk.length : imported += chunk.length
      setProgress(`Importing… ${Math.min(i + CHUNK, payload.length)} of ${payload.length}`)
    }

    setImporting(false)
    if (failed) {
      setErr(`${imported} imported, ${failed} failed.`)
    } else {
      setDone(true)
      setProgress(`${imported} entries imported successfully.`)
      setRows([])
      // Close after a beat so user sees confirmation
      setTimeout(() => close(), 1800)
    }
  }

  const inp: React.CSSProperties = {
    fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: SAGE_B,
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ib"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(4,6,10,0.7)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="im"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
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
                width: '100%', maxWidth: 480,
                background: 'rgba(4,6,10,0.98)',
                border: `1px solid ${BORDER}`,
                borderRadius: 20, padding: '32px 28px',
                boxShadow: '0 0 0 1px rgba(74,124,89,0.06), 0 40px 80px rgba(0,0,0,0.9)',
                pointerEvents: 'auto',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: SAGE, marginBottom: 4 }}>
                    Import historic data
                  </p>
                  <p style={{ fontFamily: DISP, fontSize: 26, fontWeight: 300, color: 'white', letterSpacing: '-0.02em' }}>
                    Upload CSV
                  </p>
                </div>
                <button onClick={close}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
                  ✕
                </button>
              </div>

              {/* Format hint */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8, marginBottom: 20,
                background: 'rgba(74,124,89,0.07)',
                border: '1px solid rgba(74,124,89,0.18)',
              }}>
                <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  Required columns:
                </span>
                {['date', 'weight', 'steps'].map((col, i) => (
                  <span key={col} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code style={{ fontFamily: MONO, fontSize: 9, color: SAGE_B, background: 'rgba(106,220,137,0.08)', padding: '2px 6px', borderRadius: 4 }}>
                      {col}
                    </code>
                    {i < 2 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>}
                  </span>
                ))}
                <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
                  (date + one of weight/steps minimum)
                </span>
              </div>

              {/* Drop zone */}
              {!rows.length && !done && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1px dashed ${dragging ? SAGE_B : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 12, padding: '32px 20px', textAlign: 'center',
                    cursor: 'pointer', marginBottom: 16,
                    background: dragging ? 'rgba(74,124,89,0.05)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                  <p style={{ fontFamily: DISP, fontSize: 18, color: 'white', marginBottom: 6 }}>
                    {fileName || 'Drop CSV here or click to browse'}
                  </p>
                  <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Google Sheets · Excel · Apple Numbers
                  </p>
                  <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
              )}

              {/* Preview */}
              {rows.length > 0 && !done && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                    {rows.length} rows ready · {skipped > 0 ? `${skipped} skipped (missing date/data)` : 'all rows valid'}
                  </p>
                  <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {['Date', 'Weight', 'Steps', 'Sleep', 'Notes'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}` }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((r, i) => (
                          <tr key={i} style={{ borderBottom: i < 4 ? `1px solid ${BORDER}` : 'none' }}>
                            <td style={{ padding: '7px 12px', fontFamily: MONO, fontSize: 10, color: SAGE_B }}>{r.date_of}</td>
                            <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.7)' }}>{r.weight_kg ?? '—'}</td>
                            <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.7)' }}>{r.steps ? Number(r.steps).toLocaleString() : '—'}</td>
                            <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.4)' }}>{r.sleep_hrs ?? '—'}</td>
                            <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.4)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes ?? '—'}</td>
                          </tr>
                        ))}
                        {rows.length > 5 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '7px 12px', fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                              …and {rows.length - 5} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Done state */}
              {done && (
                <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                  <p style={{ fontFamily: DISP, fontSize: 28, color: SAGE_B, marginBottom: 6 }}>Done.</p>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>
                    {progress}
                  </p>
                </div>
              )}

              {err && (
                <p style={{ fontFamily: MONO, fontSize: 10, color: '#f43f5e', letterSpacing: '0.08em', marginBottom: 12 }}>{err}</p>
              )}

              {/* Actions */}
              {!done && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {rows.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={runImport}
                      disabled={importing}
                      style={{
                        flex: 1, padding: '12px',
                        background: 'rgba(74,124,89,0.2)',
                        border: `1px solid ${SAGE}`,
                        borderRadius: 10, color: SAGE_B,
                        fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em',
                        textTransform: 'uppercase', cursor: importing ? 'not-allowed' : 'pointer',
                        opacity: importing ? 0.6 : 1,
                      }}>
                      {importing ? progress || 'Importing…' : `Import ${rows.length} rows →`}
                    </motion.button>
                  )}
                  {rows.length > 0 && (
                    <button onClick={reset}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '12px 8px' }}>
                      Change file
                    </button>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
