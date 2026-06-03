import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Toast from '../components/Toast'
import StatusBadge from '../components/StatusBadge'
import { MdRefresh, MdAssignment, MdPeople, MdGavel, MdAdminPanelSettings, MdWarning } from 'react-icons/md'
import { Link } from 'react-router-dom'

const API = '/api'

export default function AdminPanel() {
  const [admins, setAdmins] = useState([])
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [aRes, gRes] = await Promise.all([
        axios.get(`${API}/auth/users`),
        axios.get(`${API}/grievances`, { params: { limit: 50 } }),
      ])
      if (aRes.data.success) setAdmins(aRes.data.data)
      if (gRes.data.success) setGrievances(gRes.data.data)
    } catch { addToast('Failed to load data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleAssign = async (grievanceId, adminId) => {
    if (!adminId) return
    try {
      await axios.put(`${API}/grievances/${grievanceId}`, { assigned_admin_id: parseInt(adminId) })
      addToast('Hearing officer assigned successfully')
      fetchAll()
    } catch { addToast('Failed to assign officer', 'error') }
  }

  const unassigned = grievances.filter(g => !g.assigned_admin_id && !['Resolved','Closed','Rejected'].includes(g.status))
  const assigned = grievances.filter(g => g.assigned_admin_id)
  const adminLoad = admins.filter(a => a.role === 'admin').map(a => ({
    ...a,
    active: grievances.filter(g => g.assigned_admin_id === a.user_id && !['Resolved','Closed','Rejected'].includes(g.status)).length
  }))

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdAdminPanelSettings size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Super <span className="accent">Admin</span> Panel</h1>
          <p className="page-sub">Assign hearing officers and monitor all case workloads</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll}><MdRefresh size={14} /> Refresh</button>
      </div>

      
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="section-label"><MdPeople size={13} /> Hearing Officers Workload</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {adminLoad.map(a => (
            <div key={a.user_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--blue-border)' }}><MdGavel size={18} color="var(--blue)" /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{a.full_name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{a.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active cases</span>
                <span style={{ fontWeight: 800, color: a.active > 3 ? 'var(--red)' : a.active > 1 ? 'var(--yellow)' : 'var(--green)', fontSize: '1.1rem' }}>{a.active}</span>
              </div>
            </div>
          ))}
          {adminLoad.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No hearing officers found</div>}
        </div>
      </div>

      
      {unassigned.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-label" style={{ color: 'var(--red)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
            Unassigned Cases ({unassigned.length})
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case No.</th>
                  <th>Subject</th>
                  <th>Complainant</th>
                  <th>Respondent</th>
                  <th>Status</th>
                  <th>Assign Officer</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map(g => (
                  <tr key={g.grievance_id}>
                    <td><Link to={`/cases/${g.grievance_id}`} style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{g.case_number}</Link></td>
                    <td style={{ maxWidth: 180 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.84rem' }}>{g.subject}</div></td>
                    <td style={{ fontSize: '0.84rem' }}>{g.student_name}</td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--purple)' }}>{g.suspect_name || '—'}</td>
                    <td><StatusBadge status={g.status} /></td>
                    <td>
                      <select className="filter-select" style={{ minWidth: 'auto', fontSize: '0.78rem', padding: '5px 24px 5px 8px' }}
                        defaultValue="" onChange={e => { if (e.target.value) handleAssign(g.grievance_id, e.target.value); e.target.value = '' }}>
                        <option value="">Select officer...</option>
                        {adminLoad.map(a => <option key={a.user_id} value={a.user_id}>{a.full_name} ({a.active} active)</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      <div className="panel">
        <div className="section-label"><MdGavel size={13} /> All Assigned Cases ({assigned.length})</div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Case No.</th><th>Subject</th><th>Complainant</th><th>Respondent</th><th>Officer</th><th>Status</th></tr>
            </thead>
            <tbody>
              {assigned.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No assigned cases yet</td></tr>
              ) : assigned.map(g => (
                <tr key={g.grievance_id}>
                  <td><Link to={`/cases/${g.grievance_id}`} style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{g.case_number}</Link></td>
                  <td style={{ fontSize: '0.84rem', maxWidth: 180 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.subject}</div></td>
                  <td style={{ fontSize: '0.84rem' }}>{g.student_name}</td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--purple)' }}>{g.suspect_name || '—'}</td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--blue)', fontWeight: 600 }}>{g.assigned_admin_name}</td>
                  <td><StatusBadge status={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
