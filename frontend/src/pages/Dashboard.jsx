import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import GrievanceChart from '../components/GrievanceChart'
import { MdRefresh, MdSearch, MdGavel, MdCalendarToday, MdPerson, MdFilterList, MdInbox, MdAssignment, MdHourglassEmpty, MdCheckCircle, MdWarning, MdLocationOn } from 'react-icons/md'
import { getUser } from '../utils/auth'

const API = '/api'
const LIMIT = 50 

export default function Dashboard() {
  const user = getUser()
  const navigate = useNavigate()
  
  const myUserId = user?.userId ? Number(user.userId) : null

  const [allCases, setAllCases] = useState([])
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [toasts, setToasts] = useState([])
  const [upcomingHearings, setUpcomingHearings] = useState([])
  const [chartData, setChartData] = useState({ byStatus: [], byCategory: [] })

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchHearings = async () => {
    try {
      const r = await axios.get(`${API}/grievances/meta/stats`)
      if (r.data.success) setUpcomingHearings(r.data.data.recentHearings || [])
    } catch {}
  }

  const fetchChartData = async () => {
    if (!myUserId) return
    try {
      const r = await axios.get(`${API}/data/stats/admin`)
      if (r.data) {
        setChartData({
          byStatus: r.data.byStatus?.map(s => ({ name: s.status, value: s.count })) || [],
          byCategory: r.data.byCategory?.map(c => ({ name: c.category_name, value: c.count })) || []
        })
      }
    } catch {}
  }

  const fetchGrievances = useCallback(async () => {
    setLoading(true)
    try {
      
      const r = await axios.get(`${API}/grievances`, { params: { limit: LIMIT, page: 1 } })
      if (r.data.success) {
        
        const mine = r.data.data.filter(g => Number(g.assigned_admin_id) === myUserId)
        setAllCases(mine)
        applyFilters(mine, statusFilter, search)
      }
    } catch { addToast('Failed to load cases', 'error') }
    finally { setLoading(false) }
  }, [myUserId])

  const applyFilters = (cases, status, q) => {
    let filtered = cases
    if (status !== 'All') filtered = filtered.filter(g => g.status === status)
    if (q.trim()) {
      const lower = q.toLowerCase()
      filtered = filtered.filter(g =>
        g.case_number?.toLowerCase().includes(lower) ||
        g.subject?.toLowerCase().includes(lower) ||
        g.student_name?.toLowerCase().includes(lower) ||
        g.suspect_name?.toLowerCase().includes(lower)
      )
    }
    setGrievances(filtered)
  }

  useEffect(() => { fetchHearings(); fetchGrievances(); fetchChartData() }, [])
  useEffect(() => { applyFilters(allCases, statusFilter, search) }, [statusFilter, allCases])

  const handleSearch = () => applyFilters(allCases, statusFilter, search)

  const myTotal = allCases.length
  const myPending = allCases.filter(g => ['Submitted','Under Review'].includes(g.status)).length
  const myHearing = allCases.filter(g => g.status === 'Hearing Scheduled').length
  const myResolved = allCases.filter(g => g.status === 'Resolved').length

  const statCards = [
    { label: 'My Total Assigned',  value: myTotal,    color: 'var(--accent)',  bar: 'var(--accent)',  icon: <MdAssignment size={20} /> },
    { label: 'Pending Investigation',   value: myPending,  color: 'var(--orange)',  bar: 'var(--orange)',  icon: <MdHourglassEmpty size={20} /> },
    { label: 'Active Hearings',value: myHearing,  color: 'var(--purple)',  bar: 'var(--purple)',  icon: <MdGavel size={20} /> },
    { label: 'Resolved',  value: myResolved, color: 'var(--green)',   bar: 'var(--green)',   icon: <MdCheckCircle size={20} /> },
  ]

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdGavel size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> My <span className="accent">Workload</span></h1>
          <p className="page-sub">Welcome back, {user?.full_name}! Here is your active caseload and schedule</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/cases')}>
            <MdAssignment size={14} /> View All Cases
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { fetchHearings(); fetchGrievances() }}>
            <MdRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-row">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-accent-bar" style={{ background: s.bar }} />
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {upcomingHearings.length > 0 && (
        <div className="panel" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MdCalendarToday size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{upcomingHearings.length} upcoming hearing{upcomingHearings.length > 1 ? 's' : ''} this week</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>Next: {upcomingHearings[0].scheduled_date ? new Date(upcomingHearings[0].scheduled_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}</span>
            </div>
          </div>
        </div>
      )}

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="panel">
          <div className="section-label"><MdAssignment size={13} /> My Cases by Status</div>
          <GrievanceChart data={chartData.byStatus} color="var(--accent)" />
        </div>
        <div className="panel">
          <div className="section-label"><MdGavel size={13} /> My Cases by Category</div>
          <GrievanceChart data={chartData.byCategory} color="var(--purple)" />
        </div>
      </div>

      {upcomingHearings.length > 0 && (
        <div className="panel" style={{ marginBottom: '1.25rem' }}>
          <div className="section-label"><MdCalendarToday size={13} color="var(--purple)" /><span style={{ color: 'var(--purple)' }}>Today's Schedule</span></div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {upcomingHearings.map(h => (
              <Link to={`/cases/${h.grievance_id}`} key={h.hearing_id} style={{ textDecoration: 'none', flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px', borderLeft: '4px solid var(--purple)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--accent)', marginBottom: 4, fontWeight: 700 }}>{h.case_number}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.subject}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--purple)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdCalendarToday size={14} />{new Date(h.scheduled_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{h.scheduled_time?.slice(0,5)}</span>
                    <span>·</span>
                    <MdLocationOn size={14} />{h.venue}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <div className="section-label"><MdSearch size={13} /> Search & Filter</div>
        <div className="filters-bar" style={{ marginBottom: 0 }}>
          <div className="search-wrap">
            <MdSearch className="search-icon" size={16} />
            <input className="filter-input" placeholder="Search case no., subject, student, suspect..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {['All','Submitted','Under Review','Hearing Scheduled','Resolved','Rejected','Closed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={handleSearch}><MdFilterList size={14} /> Filter</button>
        </div>
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 26, height: 26 }} />
          Loading your cases...
        </div>
      ) : grievances.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="empty-icon"><MdInbox size={48} /></div>
          <div className="empty-title">{allCases.length === 0 ? 'No cases assigned to you yet' : 'No cases match the filter'}</div>
          <div className="empty-sub">{allCases.length === 0 ? 'The Super Admin will assign cases to you shortly' : 'Try clearing the filter'}</div>
        </div>
      ) : (
        <div className="panel-grid">
          {grievances.map(g => (
            <Link to={`/cases/${g.grievance_id}`} key={g.grievance_id} className="panel-item">
              <div className="panel-header">
                <span className="panel-case">{g.case_number}</span>
                <StatusBadge status={g.status} />
              </div>
              <div className="panel-title">{g.subject}</div>
              <div className="panel-meta">
                <div className="panel-meta-row"><MdPerson size={13} color="var(--text-muted)" /><span>Complainant: <strong style={{ color: 'var(--text-primary)' }}>{g.student_name}</strong></span></div>
                {g.suspect_name && <div className="panel-meta-row"><MdWarning size={13} color="var(--text-muted)" /><span>Respondent: <strong style={{ color: 'var(--purple)' }}>{g.suspect_name}</strong></span></div>}
                <div className="panel-meta-row"><MdGavel size={13} color="var(--text-muted)" /><span>{g.category_name}</span></div>
              </div>
              <div className="panel-footer">
                <span>{new Date(g.submission_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{g.days_open}d open</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
