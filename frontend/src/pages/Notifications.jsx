import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { MdNotifications, MdMarkEmailRead, MdDelete, MdFilterList, MdCheckCircle, MdWarning, MdInfo, MdCalendarToday, MdGavel, MdMail, MdNotificationsOff } from 'react-icons/md'
import { getUser } from '../utils/auth'
import Toast from '../components/Toast'
import API from '../config/api'

export default function Notifications() {
  const user = getUser()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toasts, setToasts] = useState([])

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/notifications`)
      if (r.data.success) setNotifications(r.data.data)
    } catch (err) {
      addToast('Failed to load notifications', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (user?.userId || user?.user_id) {
      fetchNotifications()
    } else {
      setLoading(false)
    }
  }, [user?.userId, user?.user_id])

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`)
      setNotifications(p => p.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n))
    } catch { addToast('Failed to mark as read', 'error') }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`)
      setNotifications(p => p.map(n => ({ ...n, is_read: 1 })))
    } catch { addToast('Failed to mark all as read', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return
    try {
      await axios.delete(`${API}/notifications/${id}`)
      setNotifications(p => p.filter(n => n.notification_id !== id))
      addToast('Notification deleted')
    } catch { addToast('Failed to delete', 'error') }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.is_read
    if (filter === 'info') return n.type === 'info'
    if (filter === 'success') return n.type === 'success'
    if (filter === 'warning') return n.type === 'warning'
    if (filter === 'error') return n.type === 'error'
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdNotifications size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> <span className="accent">Notifications</span></h1>
          <p className="page-sub">Stay updated on your grievance cases and hearing notices</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllAsRead}>
              <MdMarkEmailRead size={14} /> Mark All Read
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={fetchNotifications}>
            <MdFilterList size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Notifications</option>
          <option value="unread">Unread Only</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {unreadCount} unread
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 26, height: 26 }} />
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MdNotificationsOff size={48} /></div>
          <div className="empty-title">No notifications</div>
          <div className="empty-sub">{filter === 'unread' ? 'No unread notifications' : 'You have no notifications yet'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifications.map(notif => (
            <div
              key={notif.notification_id}
              className={`panel ${!notif.is_read ? 'panel-unread' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem 1.25rem' }}
              onClick={() => { handleMarkAsRead(notif.notification_id); if (notif.grievance_id) navigate(user?.role === 'student' ? `/student/cases/${notif.grievance_id}` : `/cases/${notif.grievance_id}`) }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ marginTop: 2 }}>
                  {notif.type === 'warning' && <MdWarning size={20} color="var(--yellow)" />}
                  {notif.type === 'error' && <MdWarning size={20} color="var(--red)" />}
                  {notif.type === 'success' && <MdCheckCircle size={20} color="var(--green)" />}
                  {!notif.type || notif.type === 'info' && <MdInfo size={20} color="var(--blue)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdCalendarToday size={12} />
                    {new Date(notif.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {notif.case_number && <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{notif.case_number}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
