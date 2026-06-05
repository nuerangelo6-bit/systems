import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdOutlineReport, MdCode, MdGavel, MdSupervisorAccount, MdPalette, MdSchool, MdMenu, MdClose } from 'react-icons/md'
import { getUser, isAdmin, isSuperAdmin } from '../utils/auth'
import { getTheme } from '../utils/theme'
import ThemePicker from './ThemePicker'

export default function Navbar() {
  const navigate = useNavigate()
  const user = getUser()
  const [theme, setTheme] = useState(getTheme())
  const [showPicker, setShowPicker] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) return null

  const roleLabel = { superadmin: 'Super Admin', admin: 'Hearing Officer', student: 'Student' }
  const roleClass = { superadmin: 'role-superadmin', admin: 'role-admin', student: 'role-student' }

  const navItems = [
    { path: '/student', label: 'Dashboard', icon: MdDashboard, roles: ['student'] },
    { path: '/dashboard', label: 'Dashboard', icon: MdDashboard, roles: ['admin', 'superadmin'] },
    { path: '/file-grievance', label: 'File Grievance', icon: MdOutlineReport, roles: ['student'] },
    { path: '/admin-panel', label: 'Admin Panel', icon: MdGavel, roles: ['admin', 'superadmin'] },
    { path: '/super-admin', label: 'Super Admin', icon: MdSupervisorAccount, roles: ['superadmin'] },
    { path: '/reports', label: 'Reports', icon: MdCode, roles: ['admin', 'superadmin'] },
  ]

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role))

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            <div className="brand-icon">
              <img src="/image/addsu_logo.jpg" alt="ADDSU Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
              <MdSchool size={20} color="#fff" style={{ display: 'none' }} />
            </div>
            <span className="brand-text">Agusan del Sur State University</span>
          </NavLink>

          <div className="navbar-nav">
            {filteredNavItems.map(item => (
              <NavLink key={item.path} to={item.path} className="nav-link">
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} title="Menu">
              <MdMenu size={20} />
            </button>
            <button className="theme-toggle" onClick={() => setShowPicker(true)} title="Change theme">
              <MdPalette size={16} />
            </button>
            <span className={`role-badge ${roleClass[user.role] || 'role-student'}`}>
              {roleLabel[user.role] || user.role}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.full_name}
            </span>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu open">
            <div className="mobile-menu-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Menu</span>
              <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>
                <MdClose size={18} />
              </button>
            </div>
            <nav className="mobile-menu-nav">
              {filteredNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `mobile-menu-link ${isActive ? 'mobile-menu-link-active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mobile-menu-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {roleLabel[user.role] || user.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showPicker && (
        <ThemePicker
          current={theme}
          onSelect={t => setTheme(t)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
