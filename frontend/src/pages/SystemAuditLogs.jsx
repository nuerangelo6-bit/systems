import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { MdHistory, MdRefresh, MdFilterList, MdSearch, MdPerson, MdCheckCircle, MdWarning, MdInfo } from 'react-icons/md'
import Toast from '../components/Toast'

const API = '/api'

export default function SystemAuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState([])

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/grievances/meta/audit-logs`)
      if (r.data.success) setLogs(r.data.data || [])
    } catch { addToast('Failed to load audit logs', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    if (filter === 'status') return log.action_type === 'status_change'
    if (filter === 'assignment') return log.action_type === 'assignment'
    if (filter === 'hearing') return log.action_type === 'hearing'
    if (filter === 'delete') return log.action_type === 'delete'
    return true
  }).filter(log => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      log.user_name?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.case_number?.toLowerCase().includes(query)
    )
  })

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'status_change': return <MdCheckCircle size={16} color="var(--green)" />
      case 'assignment': return <MdPerson size={16} color="var(--blue)" />
      case 'hearing': return <MdInfo size={16} color="var(--purple)" />
      case 'delete': return <MdWarning size={16} color="var(--red)" />
      default: return <MdHistory size={16} color="var(--accent)" />
    }
  }

  const getActionBadge = (actionType) => {
    switch (actionType) {
      case 'status_change': return 'badge-resolved'
      case 'assignment': return 'badge-submitted'
      case 'hearing': return 'badge-hearing'
      case 'delete': return 'badge-rejected'
      default: return 'badge-closed'
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdHistory size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> System <span className="accent">Audit Logs</span></h1>
          <p className="page-sub">Track all system changes and administrative actions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchLogs}>
            <MdRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-wrap">
          <MdSearch className="search-icon" />
          <input
            className="filter-input"
            placeholder="Search by user, action, or case number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Actions</option>
          <option value="status">Status Changes</option>
          <option value="assignment">Assignments</option>
          <option value="hearing">Hearings</option>
          <option value="delete">Deletions</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 28, height: 28 }} />
          Loading audit logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MdHistory size={48} /></div>
          <div className="empty-title">No audit logs found</div>
          <div className="empty-sub">System actions will appear here</div>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action Type</th>
                <th>Details</th>
                <th>Case Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.log_id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
                    {new Date(log.timestamp).toLocaleString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {log.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user_name || 'System'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.user_role || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getActionIcon(log.action_type)}
                      <span className={`badge ${getActionBadge(log.action_type)}`}>
                        {log.action_type?.replace('_', ' ') || 'Action'}
                      </span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {log.action || 'No details available'}
                    </div>
                    {log.old_value && log.new_value && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <span style={{ color: 'var(--red)' }}>{log.old_value}</span> → <span style={{ color: 'var(--green)' }}>{log.new_value}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {log.case_number || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
