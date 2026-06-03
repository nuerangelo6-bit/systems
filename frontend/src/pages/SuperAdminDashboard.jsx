import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import { MdRefresh, MdPeople, MdGavel, MdWarning, MdCheckCircle, MdTrendingUp, MdAssignment, MdCalendarToday, MdAdminPanelSettings, MdHourglassEmpty, MdBalance, MdShowChart, MdAccessTime, MdFolder, MdLocationOn } from 'react-icons/md'

const API = '/api'

function BarChart({ data, max, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 130, fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: max > 0 ? `${(d.value / max) * 100}%` : '0%', background: color || 'var(--accent)' }} />
          </div>
          <div style={{ width: 28, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{d.value}</div>
        </div>
      ))}
    </div>
  )
}

function StatusBreakdown({ segments }) {
  const total = segments.reduce((a, b) => a + b.value, 0)
  if (total === 0) return <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No cases yet</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {segments.map(s => {
        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
        return (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}%</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 20, textAlign: 'right' }}>{s.value}</span>
              </div>
            </div>
            <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 20, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 2 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [grievances, setGrievances] = useState([])
  const [admins, setAdmins] = useState([])
  const [hearings, setHearings] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const addToast = (m, t = 'success') => setToasts(p => [...p, { id: Date.now(), message: m, type: t }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sR, gR, aR] = await Promise.all([
        axios.get(`${API}/grievances/meta/stats`).catch(() => ({ data: { success: false } })),
        axios.get(`${API}/grievances`, { params: { limit: 100 } }).catch(() => ({ data: { success: false } })),
        axios.get(`${API}/auth/users`).catch(() => ({ data: { success: false } })),
      ])
      if (sR.data.success) { setStats(sR.data.data); setHearings(sR.data.data.recentHearings || []) }
      if (gR.data.success) setGrievances(gR.data.data)
      if (aR.data.success) setAdmins(aR.data.data.filter(a => a.role === 'admin'))
      
      try {
        const lR = await axios.get(`${API}/grievances/meta/audit-logs`)
        if (lR.data.success) setAuditLogs(lR.data.data.slice(0, 5))
      } catch {
        setAuditLogs([])
      }
    } catch { addToast('Failed to load data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleAssign = async (grievanceId, adminId) => {
    if (!adminId) return
    try {
      await axios.put(`${API}/grievances/${grievanceId}`, { assigned_admin_id: parseInt(adminId) })
      addToast('Officer assigned successfully')
      fetchAll()
    } catch { addToast('Failed', 'error') }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} /></div>

  const s = stats || { total: 0, submitted: 0, under_review: 0, hearing_scheduled: 0, resolved: 0, rejected: 0, byCategory: [] }
  const unassigned = grievances.filter(g => !g.assigned_admin_id && !['Resolved','Closed','Rejected'].includes(g.status))
  const recent = grievances.slice(0, 6)
  const overdueCases = grievances.filter(g => {
    if (g.status === 'Submitted') {
      const daysOpen = Math.floor((new Date() - new Date(g.submission_date)) / (1000 * 60 * 60 * 24))
      return daysOpen > 7
    }
    return false
  })
  const studentCount = admins.length ? admins.length + 1 : 0

  const officerLoad = admins.map(a => ({
    label: a.full_name,
    value: grievances.filter(g => g.assigned_admin_id === a.user_id && !['Resolved','Closed','Rejected'].includes(g.status)).length
  }))
  const maxLoad = Math.max(...officerLoad.map(o => o.value), 1)

  const categoryData = (s.byCategory || []).slice(0, 6).map(c => ({ label: c.category_name, value: parseInt(c.count) }))
  const maxCat = Math.max(...categoryData.map(d => d.value), 1)

  const donutSegs = [
    { label: 'Submitted', value: parseInt(s.submitted) || 0, color: '#1971c2' },
    { label: 'Under Review', value: parseInt(s.under_review) || 0, color: '#d9480f' },
    { label: 'Hearing', value: parseInt(s.hearing_scheduled) || 0, color: '#6741d9' },
    { label: 'Resolved', value: parseInt(s.resolved) || 0, color: '#0ca678' },
    { label: 'Rejected', value: parseInt(s.rejected) || 0, color: '#e03131' },
  ].filter(d => d.value > 0)

  const resolutionRate = s.total > 0 ? Math.round(((parseInt(s.resolved) || 0) / parseInt(s.total)) * 100) : 0

  return (
    <div className="fade-up">
      
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdAdminPanelSettings size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> System <span className="accent">Overview</span></h1>
          <p className="page-sub">Super Administrator — Full system management dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin" className="btn btn-primary btn-sm"><MdAssignment size={14} /> Manage Cases</Link>
          <button className="btn btn-ghost btn-sm" onClick={fetchAll}><MdRefresh size={14} /> Refresh</button>
        </div>
      </div>

      
      {unassigned.length > 0 && (
        <div className="panel" style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MdWarning size={18} color="var(--yellow)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: '0.85rem' }}>{unassigned.length} case{unassigned.length > 1 ? 's' : ''} need a hearing officer assigned</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>Go to Manage tab to assign</span>
            </div>
            <Link to="/admin" className="btn btn-warning btn-sm"><MdAssignment size={13} /> Assign Now</Link>
          </div>
        </div>
      )}

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Cases', value: s.total || 0, color: 'var(--accent)', bar: 'var(--accent)', icon: <MdAssignment size={20} /> },
          { label: 'Pending', value: (parseInt(s.submitted) || 0) + (parseInt(s.under_review) || 0), color: 'var(--orange)', bar: 'var(--orange)', icon: <MdHourglassEmpty size={20} /> },
          { label: 'In Hearing', value: s.hearing_scheduled || 0, color: 'var(--purple)', bar: 'var(--purple)', icon: <MdBalance size={20} /> },
          { label: 'Resolved', value: s.resolved || 0, color: 'var(--green)', bar: 'var(--green)', icon: <MdCheckCircle size={20} /> },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, color: resolutionRate >= 50 ? 'var(--green)' : 'var(--yellow)', bar: 'var(--green)', icon: <MdShowChart size={20} /> },
          { label: 'Avg Days Open', value: s.avg_days_open || 0, color: 'var(--blue)', bar: 'var(--blue)', icon: <MdAccessTime size={20} /> },
          { label: 'Students', value: studentCount, color: 'var(--green)', bar: 'var(--green)', icon: <MdPeople size={20} /> },
          { label: 'Officers', value: admins.length, color: 'var(--accent)', bar: 'var(--accent)', icon: <MdGavel size={20} /> },
        ].map(c => (
          <div className="stat-card" key={c.label}>
            <div className="stat-accent-bar" style={{ background: c.bar }} />
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value" style={{ color: c.color, fontSize: '1.6rem' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div className="panel" style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
          <div className="section-label" style={{ color: 'var(--green)' }}><MdCheckCircle size={13} /> System Health</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Database</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green)' }}>Connected</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Active Sessions</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{studentCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Students</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{studentCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Officers</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{admins.length}</div>
            </div>
          </div>
        </div>

        {overdueCases.length > 0 && (
          <div className="panel" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
            <div className="section-label" style={{ color: 'var(--red)' }}><MdWarning size={13} /> SLA Warning</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              {overdueCases.length} case{overdueCases.length > 1 ? 's' : ''} stuck in "Submitted" for over 7 days
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              These cases need immediate attention to meet SLA requirements
            </div>
          </div>
        )}

        {auditLogs.length > 0 && (
          <div className="panel">
            <div className="section-label"><MdAccessTime size={13} /> Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLogs.map(log => (
                <div key={log.notification_id || log.log_id} style={{ fontSize: '0.78rem', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', borderLeft: '2px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.title || log.action}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.created_at || log.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{log.message || log.action}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      
      <div className="sa-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

        
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="section-label"><MdTrendingUp size={13} /> Case Status Breakdown</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <StatusBreakdown segments={donutSegs} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donutSegs.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}</span>
                </div>
              ))}
              {donutSegs.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No data yet</div>}
            </div>
          </div>
        </div>

        
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="section-label"><MdPeople size={13} /> Officer Workload (Active Cases)</div>
          {officerLoad.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No hearing officers yet</div>
          ) : (
            <BarChart data={officerLoad} max={maxLoad} color="var(--blue)" />
          )}
        </div>

        
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="section-label"><MdFolder size={13} /> Cases by Category</div>
          {categoryData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No data yet</div>
          ) : (
            <BarChart data={categoryData} max={maxCat} color="var(--purple)" />
          )}
        </div>

        
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="section-label"><MdCalendarToday size={13} /> Upcoming Hearings</div>
          {hearings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No scheduled hearings</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hearings.map(h => (
                <Link to={`/cases/${h.grievance_id}`} key={h.hearing_id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 12px', borderLeft: '3px solid var(--purple)', transition: 'box-shadow 0.15s' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.64rem', color: 'var(--accent)', marginBottom: 2 }}>{h.case_number}</div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.subject}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--purple)' }}><MdCalendarToday size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{new Date(h.scheduled_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} · {h.scheduled_time?.slice(0,5)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}><MdLocationOn size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{h.venue} · {h.student_name}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      
      {unassigned.length > 0 && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <div className="section-label" style={{ color: 'var(--yellow)' }}>
            <MdWarning size={13} /> Needs Assignment ({unassigned.length})
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Case No.</th><th>Subject</th><th>Complainant</th><th>Respondent</th><th>Assign Officer</th></tr></thead>
              <tbody>
                {unassigned.slice(0, 5).map(g => (
                  <tr key={g.grievance_id}>
                    <td><Link to={`/cases/${g.grievance_id}`} style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{g.case_number}</Link></td>
                    <td style={{ maxWidth: 160 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>{g.subject}</div></td>
                    <td style={{ fontSize: '0.83rem' }}>{g.student_name}</td>
                    <td style={{ fontSize: '0.83rem', color: 'var(--purple)' }}>{g.suspect_name || '—'}</td>
                    <td>
                      <select className="filter-select" style={{ minWidth: 'auto', fontSize: '0.76rem', padding: '4px 22px 4px 8px' }}
                        defaultValue="" onChange={e => { if (e.target.value) handleAssign(g.grievance_id, e.target.value); e.target.value = '' }}>
                        <option value="">Select officer...</option>
                        {admins.map(a => {
                          const activeCount = grievances.filter(g => g.assigned_admin_id === a.user_id && !['Resolved','Closed','Rejected'].includes(g.status)).length
                          return <option key={a.user_id} value={a.user_id}>{a.full_name} ({activeCount} active)</option>
                        })}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unassigned.length > 5 && (
            <div style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              +{unassigned.length - 5} more · <Link to="/admin" style={{ color: 'var(--accent)' }}>View all in Manage tab</Link>
            </div>
          )}
        </div>
      )}


      <div className="panel" style={{ marginBottom: 0 }}>
        <div className="section-label"><MdAccessTime size={13} /> Recent Cases</div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Case No.</th><th>Subject</th><th>Complainant</th><th>Respondent</th><th>Officer</th><th>Status</th></tr></thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No cases yet</td></tr>
              ) : recent.map(g => (
                <tr key={g.grievance_id}>
                  <td><Link to={`/cases/${g.grievance_id}`} style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{g.case_number}</Link></td>
                  <td style={{ maxWidth: 170 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>{g.subject}</div></td>
                  <td style={{ fontSize: '0.83rem' }}>{g.student_name}</td>
                  <td style={{ fontSize: '0.83rem', color: 'var(--purple)' }}>{g.suspect_name || '—'}</td>
                  <td style={{ fontSize: '0.83rem', color: g.assigned_admin_name ? 'var(--blue)' : 'var(--red)' }}>{g.assigned_admin_name || 'Unassigned'}</td>
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
