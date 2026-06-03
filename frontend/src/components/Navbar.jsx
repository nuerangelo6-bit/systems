import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdOutlineReport, MdCode, MdGavel, MdSupervisorAccount, MdPalette, MdSchool } from 'react-icons/md'
import { getUser, isAdmin, isSuperAdmin } from '../utils/auth'
import { getTheme } from '../utils/theme'
import ThemePicker from './ThemePicker'

export default function Navbar() {
  const navigate = useNavigate()
  const user = getUser()
  const [theme, setTheme] = useState(getTheme())
  const [showPicker, setShowPicker] = useState(false)

  if (!user) return null

  const roleLabel = { superadmin: 'Super Admin', admin: 'Hearing Officer', student: 'Student' }
  const roleClass = { superadmin: 'role-superadmin', admin: 'role-admin', student: 'role-student' }

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
          </div>

          <div className="navbar-right">
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
