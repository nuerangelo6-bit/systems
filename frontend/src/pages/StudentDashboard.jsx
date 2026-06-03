import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import SummonModal from '../components/SummonModal'
import SummonPrint from '../components/SummonPrint'
import GrievanceChart from '../components/GrievanceChart'
import { MdAdd, MdGavel, MdCalendarToday, MdNotifications, MdRefresh, MdDescription, MdChevronRight, MdPrint, MdAssignment, MdInbox, MdSettings, MdCheckCircle, MdLocationOn, MdWarning, MdMail } from 'react-icons/md'
import { getUser } from '../utils/auth'

const API = '/api'

export default function StudentDashboard() {
  const user = getUser()
  const navigate = useNavigate()
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  
  const [summons, setSummons] = useState([])
  const [activeSummon, setActiveSummon] = useState(null)   
  const [printSummon, setPrintSummon] = useState(null)     
  const [activeGrievanceForPrint, setActiveGrievanceForPrint] = useState(null)
  const [chartData, setChartData] = useState({ byStatus: [], byCategory: [] })

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchData = async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const r = await axios.get(`${API}/grievances`, { params: { complainant_id: user.userId, limit: 50 } })
      if (r.data.success) setGrievances(r.data.data)
    } catch { addToast('Failed to load cases', 'error') }
    finally { setLoading(false) }
  }

  const fetchSummons = async () => {
    if (!user?.userId) return
    try {
      const r = await axios.get(`${API}/grievances`, { params: { complainant_id: user.userId, limit: 50 } })
      if (!r.data.success || r.data.data.length === 0) return

      const all = []
      for (const g of r.data.data) {
        try {
          const sr = await axios.get(`${API}/grievances/${g.grievance_id}/summons`)
          if (sr.data.success) {
            
            
            
            
            
            sr.data.data.forEach(s => {
              const myName = (user?.full_name || '').toLowerCase().trim()
              const partyName = (s.party_name || '').toLowerCase().trim()
              const isMyComplainantSummon = s.party_type === 'complainant'
              const isMyRespondentSummon = s.party_type === 'respondent' && myName && partyName === myName
              if (isMyComplainantSummon || isMyRespondentSummon) {
                all.push({ ...s, _grievance: g })
              }
            })
          }
        } catch {}
      }
      
      all.sort((a, b) => {
        if (a.is_read !== b.is_read) return a.is_read - b.is_read
        return new Date(b.issued_at) - new Date(a.issued_at)
      })
      setSummons(all)
    } catch {}
  }

  const fetchChartData = async () => {
    if (!user?.userId) return
    try {
      const r = await axios.get(`${API}/data/stats/student`)
      if (r.data) {
        setChartData({
          byStatus: r.data.byStatus?.map(s => ({ name: s.status, value: s.count })) || [],
          byCategory: r.data.byCategory?.map(c => ({ name: c.category_name, value: c.count })) || []
        })
      }
    } catch {}
  }

  useEffect(() => {
    if (user?.userId) { fetchData(); fetchSummons(); fetchChartData() }
    else setLoading(false)
  }, [])

  const unread = summons.filter(s => !s.is_read)

  const handleOpenSummon = (s) => {
    setActiveSummon(s)
  }

  const handlePrintSummon = (e, s) => {
    e.stopPropagation()
    setActiveGrievanceForPrint(s._grievance)
    setPrintSummon(s)
  }

  const stats = [
    { label: 'Total Filed', value: grievances.length, color: 'var(--accent)', bar: 'var(--accent)', icon: <MdAssignment size={20} /> },
    { label: 'Pending', value: grievances.filter(g => g.status === 'Submitted').length, color: 'var(--blue)', bar: 'var(--blue)', icon: <MdInbox size={20} /> },
    { label: 'In Progress', value: grievances.filter(g => ['Under Review','Hearing Scheduled'].includes(g.status)).length, color: 'var(--yellow)', bar: 'var(--yellow)', icon: <MdSettings size={20} /> },
    { label: 'Resolved', value: grievances.filter(g => g.status === 'Resolved').length, color: 'var(--green)', bar: 'var(--green)', icon: <MdCheckCircle size={20} /> },
  ]

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MdAssignment size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            My <span className="accent">Dashboard</span>
          </h1>
          <p className="page-sub">Welcome back, {user?.full_name}! Here is an overview of your grievances</p>
        </div>
      </div>

      <div className="stats-row">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-accent-bar" style={{ background: s.bar }} />
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <GrievanceChart data={chartData.byStatus} title="Cases by Status" color="var(--accent)" />
        <GrievanceChart data={chartData.byCategory} title="Cases by Category" color="var(--purple)" />
      </div>

      
      {summons.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--blue-border)', borderRadius: 'var(--r-lg)', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <MdCalendarToday size={15} color="var(--blue)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--blue)' }}>
              Hearing Notices & Summons
            </span>
            {unread.length > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '0.6rem', fontWeight: 700 }}>
                {unread.length} NEW
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {summons.map(s => (
              <div key={s.summon_id}
                className={`summon-card ${!s.is_read ? 'summon-unread' : ''}`}
                onClick={() => handleOpenSummon(s)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.67rem', color: 'var(--accent)', marginBottom: 2 }}>{s.case_number}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <MdMail size={14} style={{ verticalAlign: 'middle' }} /> Hearing #{s.hearing_number}
                      <span className={`badge ${s.party_type === 'complainant' ? 'badge-submitted' : 'badge-review'}`} style={{ fontSize: '0.58rem' }}>
                        {s.party_type}
                      </span>
                      {!s.is_read && <span style={{ fontSize: '0.58rem', fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '1px 6px' }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      {s.scheduled_time ? ` at ${s.scheduled_time.slice(0,5)}` : ''} · <MdLocationOn size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{s.venue}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      onClick={e => handlePrintSummon(e, s)}
                      title="Print summon letter">
                      <MdPrint size={13} />
                    </button>
                    <MdChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
            Tap any notice to view details · <MdPrint size={12} style={{ verticalAlign: 'middle' }} /> to print your summon letter
          </div>
        </div>
      )}

      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MdDescription size={16} style={{ color: 'var(--accent)' }} /> My Filed Grievances
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={() => { fetchData(); fetchSummons() }}>
          <MdRefresh size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 26, height: 26 }} />
          Loading...
        </div>
      ) : grievances.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MdAssignment size={48} /></div>
          <div className="empty-title">No grievances filed yet</div>
          <div className="empty-sub">File your first grievance to get started</div>
        </div>
      ) : (
        <div className="panel-grid">
          {grievances.map(g => (
            <div key={g.grievance_id} className="panel-item">
              <div className="panel-header">
                <span className="panel-case">{g.case_number}</span>
                <StatusBadge status={g.status} />
              </div>
              <div className="panel-title">{g.subject}</div>
              <div className="panel-meta">
                <div className="panel-meta-row"><MdGavel size={13} color="var(--text-muted)" /><span>{g.category_name}</span></div>
                {g.suspect_name && <div className="panel-meta-row"><MdWarning size={13} color="var(--text-muted)" /><span>Against: <strong style={{ color: 'var(--purple)' }}>{g.suspect_name}</strong></span></div>}
                {g.assigned_admin_name && <div className="panel-meta-row"><MdGavel size={13} color="var(--text-muted)" /><span>Officer: <strong style={{ color: 'var(--accent)' }}>{g.assigned_admin_name}</strong></span></div>}
              </div>
              <div className="panel-footer">
                <span>{new Date(g.submission_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{g.days_open}d open</span>
              </div>
            </div>
          ))}
        </div>
      )}

      
      {activeSummon && (
        <SummonModal
          summon={activeSummon}
          onClose={() => setActiveSummon(null)}
          onRead={() => { fetchSummons(); setActiveSummon(null) }}
          onPrint={() => {
            setActiveGrievanceForPrint(activeSummon._grievance)
            setPrintSummon(activeSummon)
            setActiveSummon(null)
          }}
        />
      )}

      
      {printSummon && (
        <SummonPrint
          summon={printSummon}
          grievance={activeGrievanceForPrint}
          onClose={() => { setPrintSummon(null); setActiveGrievanceForPrint(null) }}
        />
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
