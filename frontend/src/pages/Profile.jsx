import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { MdPerson, MdEmail, MdBadge, MdEdit, MdLock, MdSave, MdCancel } from 'react-icons/md'
import { getUser, setUser } from '../utils/auth'
import Toast from '../components/Toast'

const API = '/api'

export default function Profile() {
  const user = getUser()
  const [toasts, setToasts] = useState([])
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    student_id: user?.student_id || '',
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const r = await axios.put(`${API}/auth/profile`, formData)
      if (r.data.success) {
        setUser({ ...user, ...formData })
        addToast('Profile updated successfully')
        setEditing(false)
      } else {
        addToast(r.data.message || 'Failed to update profile', 'error')
      }
    } catch (err) {
      console.error('Profile update error:', err)
      addToast('Profile update requires backend implementation. Contact administrator.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      addToast('Passwords do not match', 'error')
      return
    }
    if (passwordData.new_password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }
    setLoading(true)
    try {
      const r = await axios.put(`${API}/auth/password`, passwordData)
      if (r.data.success) {
        addToast('Password changed successfully')
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdPerson size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> My <span className="accent">Profile</span></h1>
          <p className="page-sub">Manage your account information and security settings</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <MdEdit size={14} /> Edit Profile
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        <div className="panel">
          <div className="form-section-title">
            <MdPerson size={14} /> Personal Information
          </div>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!editing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              disabled={!editing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input
              className="form-control"
              value={formData.student_id}
              onChange={e => setFormData({ ...formData, student_id: e.target.value })}
              disabled={!editing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={user?.username || ''}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input
              className="form-control"
              value={user?.role || 'Student'}
              disabled
            />
          </div>

          {editing && (
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setEditing(false); setFormData({ full_name: user?.full_name || '', email: user?.email || '', student_id: user?.student_id || '' }) }}>
                <MdCancel size={14} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleProfileUpdate} disabled={loading}>
                {loading ? 'Saving...' : <><MdSave size={14} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="form-section-title">
            <MdLock size={14} /> Change Password
          </div>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              className="form-control"
              type="password"
              value={passwordData.current_password}
              onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
              placeholder="Enter current password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-control"
              type="password"
              value={passwordData.new_password}
              onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-control"
              type="password"
              value={passwordData.confirm_password}
              onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handlePasswordChange} disabled={loading}>
              {loading ? 'Changing...' : <><MdLock size={14} /> Change Password</>}
            </button>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
