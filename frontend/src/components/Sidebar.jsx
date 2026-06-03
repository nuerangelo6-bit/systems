import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MdHome, MdAdd, MdPerson, MdAssessment, MdNotifications, MdGavel, MdSettings, MdLogout, MdSchool, MdCode, MdHistory, MdCalendarToday } from 'react-icons/md'
import { getUser, logout } from '../utils/auth'
import axios from 'axios'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getUser()
  const isStudent = user?.role === 'student'
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/notifications/unread-count')
        if (response.data.success) {
          setUnreadCount(response.data.count)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const studentNavItems = [
    { path: '/student', icon: <MdHome size={20} />, label: 'Dashboard' },
    { path: '/file', icon: <MdAdd size={20} />, label: 'File Grievance' },
    { path: '/reports', icon: <MdAssessment size={20} />, label: 'Reports' },
    { path: '/notifications', icon: <MdNotifications size={20} />, label: 'Notifications', hasBadge: true },
    { path: '/profile', icon: <MdPerson size={20} />, label: 'Profile' },
  ]

  const adminNavItems = [
    { path: '/', icon: <MdHome size={20} />, label: 'Dashboard' },
    { path: '/cases', icon: <MdGavel size={20} />, label: 'My Cases' },
    { path: '/reports', icon: <MdAssessment size={20} />, label: 'Reports' },
    { path: '/notifications', icon: <MdNotifications size={20} />, label: 'Notifications', hasBadge: true },
  ]

  const superAdminNavItems = [
    { path: '/', icon: <MdHome size={20} />, label: 'Dashboard' },
    { path: '/admin', icon: <MdSettings size={20} />, label: 'Admin Panel' },
    { path: '/sql', icon: <MdCode size={20} />, label: 'SQL Queries' },
    { path: '/audit-logs', icon: <MdHistory size={20} />, label: 'Audit Logs' },
    { path: '/settings', icon: <MdCalendarToday size={20} />, label: 'System Settings' },
  ]

  const navItems = isStudent ? studentNavItems : (user?.role === 'superadmin' ? superAdminNavItems : adminNavItems)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/image/addsu_logo.jpg" alt="ADDSU Logo" className="sidebar-logo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
          <MdSchool size={28} color="var(--accent)" style={{ display: 'none' }} />
        </div>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Agusan del Sur State University</div>
          <div className="sidebar-brand-sub">Grievance Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">
              {item.icon}
              {item.hasBadge && unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--red)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span className="sidebar-link-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" style={{
          borderColor: user?.role === 'superadmin' ? 'var(--gold)' : user?.role === 'admin' ? 'var(--blue)' : 'var(--green)',
          borderWidth: '2px',
          borderStyle: 'solid'
        }}>
          <div className="sidebar-user-avatar" style={{
            background: user?.role === 'superadmin' ? 'linear-gradient(135deg, var(--gold), var(--orange))' : user?.role === 'admin' ? 'linear-gradient(135deg, var(--blue), var(--accent))' : 'linear-gradient(135deg, var(--green), var(--accent))'
          }}>
            {user?.fullName?.charAt(0).toUpperCase() || user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName || user?.full_name || user?.username || 'User'}</div>
            <div className="sidebar-user-role" style={{
              color: user?.role === 'superadmin' ? 'var(--gold)' : user?.role === 'admin' ? 'var(--blue)' : 'var(--green)',
              fontWeight: 600
            }}>{user?.role || 'Student'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <MdLogout size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
