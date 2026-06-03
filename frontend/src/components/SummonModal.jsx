import React from 'react'
import { MdClose, MdCalendarToday, MdLocationOn, MdPerson, MdGavel, MdCheckCircle, MdPrint } from 'react-icons/md'
import axios from 'axios'

const API = 'https://systems-production.up.railway.app/api'

export default function SummonModal({ summon, onClose, onRead, onPrint }) {
  if (!summon) return null

  const hearingDate = summon.scheduled_date
    ? new Date(summon.scheduled_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'To be determined'
  const hearingTime = summon.scheduled_time ? summon.scheduled_time.slice(0, 5) : 'TBD'

  const handleMarkRead = async () => {
    try { await axios.patch(`${API}/grievances/summons/${summon.summon_id}/read`) } catch {}
    onRead?.()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}>{summon.case_number}</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>📨 Hearing Summon Notice</div>
          </div>
          <div style={{ display: 'flex', align: 'center', gap: 6 }}>
            {!summon.is_read && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '2px 8px', alignSelf: 'center' }}>NEW</span>}
            <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', lineHeight: 1 }}>
              <MdClose size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem' }}>
            <span className={`badge ${summon.party_type === 'complainant' ? 'badge-submitted' : 'badge-review'}`}>{summon.party_type}</span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              You are summoned as the <strong style={{ color: 'var(--text-primary)' }}>{summon.party_type === 'complainant' ? 'Complainant' : 'Respondent'}</strong> in this case
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
            <div style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-border)', borderRadius: 'var(--r-sm)', padding: '12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MdCalendarToday size={16} color="var(--purple)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--purple)', marginBottom: 3 }}>Date & Time</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{hearingDate}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--purple)', marginTop: 2 }}>{hearingTime}</div>
              </div>
            </div>
            <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 'var(--r-sm)', padding: '12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MdLocationOn size={16} color="var(--blue)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--blue)', marginBottom: 3 }}>Venue</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{summon.venue || 'To be announced'}</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px', marginBottom: '1rem' }}>
            {[
              { icon: <MdGavel size={14} />, label: 'Hearing No.', value: `Hearing #${summon.hearing_number}` },
              { icon: <MdPerson size={14} />, label: 'Issued to', value: summon.party_name },
              { icon: '📋', label: 'Case Number', value: summon.case_number, mono: true },
              { icon: '📅', label: 'Issued on', value: new Date(summon.issued_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', width: 16 }}>{row.icon}</span>
                <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: row.mono ? 'var(--mono)' : 'inherit', fontSize: row.mono ? '0.76rem' : 'inherit' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', borderRadius: 'var(--r-sm)', padding: '10px 13px', fontSize: '0.78rem', color: 'var(--yellow)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>Your attendance is <strong>required</strong>. Failure to appear without valid justification may result in the case being decided in your absence. Bring this notice and relevant documents.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          {onPrint && (
            <button className="btn btn-ghost btn-sm" onClick={() => { onPrint(); }}>
              <MdPrint size={13} /> Print Summon
            </button>
          )}
          {!summon.is_read && (
            <button className="btn btn-success btn-sm" onClick={handleMarkRead}>
              <MdCheckCircle size={14} /> Mark as Read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
