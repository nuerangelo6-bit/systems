import React, { useState } from 'react'
import axios from 'axios'
import { MdPlayArrow, MdCode, MdContentCopy } from 'react-icons/md'

const API = 'https://systems-production.up.railway.app/api'
const PRESETS = [
  { label: 'All Grievances', sql: 'SELECT * FROM vw_grievance_summary ORDER BY submission_date DESC' },
  { label: 'Unassigned Cases', sql: "SELECT case_number, student_name, suspect_name, subject, status FROM grievances WHERE assigned_admin_id IS NULL AND status NOT IN ('Resolved','Closed','Rejected')" },
  { label: 'Scheduled Hearings', sql: 'SELECT h.*, g.case_number, g.student_name, g.suspect_name FROM hearings h JOIN grievances g ON h.grievance_id = g.grievance_id ORDER BY h.scheduled_date ASC' },
  { label: 'Summons Issued', sql: 'SELECT s.*, h.scheduled_date, h.venue FROM summons s JOIN hearings h ON s.hearing_id = h.hearing_id ORDER BY s.issued_at DESC' },
  { label: 'By Category', sql: 'SELECT category_name, COUNT(*) as count FROM vw_grievance_summary GROUP BY category_name ORDER BY count DESC' },
  { label: 'Status Stats', sql: "SELECT status, COUNT(*) as count FROM grievances GROUP BY status ORDER BY count DESC" },
  { label: 'Activity Log', sql: 'SELECT gl.*, g.case_number FROM grievance_logs gl JOIN grievances g ON gl.grievance_id = g.grievance_id ORDER BY gl.changed_at DESC LIMIT 30' },
  { label: 'All Users', sql: "SELECT user_id, username, full_name, email, role, created_at FROM users ORDER BY role, full_name" },
  { label: 'All Suspects', sql: 'SELECT * FROM suspects ORDER BY full_name' },
  { label: 'Show Tables', sql: 'SHOW TABLES' },
  { label: 'Describe Grievances', sql: 'DESCRIBE grievances' },
]

export default function SqlQueries() {
  const [sql, setSql] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const runQuery = async () => {
    if (!sql.trim()) return
    setLoading(true); setError(''); setResults(null)
    try {
      const r = await axios.post(`${API}/data/sql`, { sql })
      setResults(r.data)
    } catch (err) { setError(err.response?.data?.error || err.response?.data?.message || 'Query failed') }
    finally { setLoading(false) }
  }

  const cols = results?.length > 0 ? Object.keys(results[0]) : []

  return (
    <div className="fade-up">
      <div className="page-header" style={{ borderBottom: '3px solid var(--red)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title"><MdCode size={22} style={{ verticalAlign: 'middle', color: 'var(--red)', marginRight: 6 }} />SQL <span style={{ color: 'var(--red)' }}>Query Runner</span></h1>
          <p className="page-sub" style={{ color: 'var(--red)' }}>⚠️ Root Access Terminal — Execute SELECT / SHOW / DESCRIBE queries against the live database</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div className="section-label">Quick Queries</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map(p => <button key={p.label} className="btn btn-ghost btn-sm" onClick={() => setSql(p.sql)} style={{ fontSize: '0.72rem' }}>{p.label}</button>)}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <MdCode size={15} color="var(--accent)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SQL Editor</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(sql)}><MdContentCopy size={13} /> Copy</button>
            <button className="btn btn-primary btn-sm" onClick={runQuery} disabled={loading || !sql.trim()}>
              {loading ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <MdPlayArrow size={15} />} Run Query
            </button>
          </div>
        </div>
        <textarea
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 7, padding: '12px', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: '0.84rem', outline: 'none', resize: 'vertical', minHeight: 110, lineHeight: 1.6, transition: 'border-color 0.15s' }}
          placeholder="SELECT * FROM vw_grievance_summary LIMIT 10;"
          value={sql} onChange={e => setSql(e.target.value)}
          onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') runQuery() }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
          spellCheck={false} />
        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 5 }}>Ctrl+Enter to run · Only SELECT, SHOW, DESCRIBE allowed</div>
      </div>

      {error && <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '11px 14px', marginBottom: '1rem', color: 'var(--red)', fontSize: '0.84rem', fontFamily: 'var(--mono)' }}>❌ {error}</div>}

      {results && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            ✅ {results.length} row{results.length !== 1 ? 's' : ''} returned
          </div>
          {results.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-title">No rows returned</div></div>
          ) : (
            <div className="data-table-wrap" style={{ overflow: 'auto', maxHeight: 460 }}>
              <table className="data-table">
                <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i}>
                      {cols.map(c => (
                        <td key={c} style={{ fontFamily: typeof row[c] === 'number' ? 'var(--mono)' : 'inherit', fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[c] === null ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span> : String(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
