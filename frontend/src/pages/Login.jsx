import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MdLock, MdPerson, MdWarning, MdVisibility, MdVisibilityOff, MdEmail, MdBadge, MdSchool, MdAdminPanelSettings, MdBalance, MdKey, MdEditNote, MdCheckCircle } from 'react-icons/md'
import { setUser } from '../utils/auth'

const API = 'https://systems-production.up.railway.app/api'

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [reg, setReg] = useState({ username: '', password: '', full_name: '', email: '', student_id: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async () => {
    setError('')
    if (!form.username || !form.password) { setError('Please fill in both fields.'); return }
    setLoading(true)
    try {
      const r = await axios.post(`${API}/auth/login`, { username: form.username, password: form.password })
      if (r.data.success) {
        setUser(r.data.data)
        navigate(r.data.data.role === 'student' ? '/student' : '/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    setError(''); setSuccess('')
    if (!reg.username || !reg.password || !reg.full_name || !reg.email) { setError('All fields except Student ID are required.'); return }
    if (!reg.email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (reg.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const r = await axios.post(`${API}/auth/register`, reg)
      if (r.data.success) {
        setSuccess('Account created! You can now sign in.')
        setReg({ username: '', password: '', full_name: '', email: '', student_id: '' })
        setTimeout(() => { setTab('login'); setSuccess('') }, 1800)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const roles = [
    { icon: <MdSchool size={18} />, role: 'Student', cred: 'Register tab below', color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'var(--border)' },
  ]

  return (
    <div className="panel" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeUp 0.4s ease both' }}>

        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 66, height: 66, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: 30, boxShadow: '0 4px 20px var(--accent-glow)', overflow: 'hidden'
          }}>
            <img src="/image/addsu_logo.jpg" alt="ADDSU Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
            <MdSchool size={32} color="#fff" style={{ display: 'none' }} />
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--accent)', marginBottom: 5 }}>Agusan del Sur State University</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Grievance Management System</p>
        </div>

        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: '1.25rem' }}>
          {roles.map(r => (
            <div key={r.role} style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: r.color, marginBottom: 2 }}>{r.role}</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', lineHeight: 1.3 }}>{r.cred}</div>
            </div>
          ))}
        </div>

        
        <div className="panel" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '13px', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: '0.84rem', fontWeight: 700,
                  background: tab === t ? 'var(--accent-bg)' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                {t === 'login' ? <><MdKey size={16} /> Sign In</> : <><MdEditNote size={16} /> Register</>}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 7, padding: '9px 13px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', color: 'var(--red)' }}>
                <MdWarning size={15} /> {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 7, padding: '9px 13px', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <MdCheckCircle size={15} /> {success}
              </div>
            )}

            {tab === 'login' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <MdPerson style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                    <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Enter your username"
                      value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <MdLock style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                    <input className="form-control" style={{ paddingLeft: 34, paddingRight: 38 }}
                      type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                      value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showPw ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                    </button>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleLogin} disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Signing in...</> : <><MdLock size={14} /> Sign In</>}
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <MdPerson style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                    <input className="form-control" style={{ paddingLeft: 34 }} placeholder="e.g. Juan Dela Cruz"
                      value={reg.full_name} onChange={e => setReg(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input className="form-control" placeholder="Choose a username"
                      value={reg.username} onChange={e => setReg(p => ({ ...p, username: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Student ID</label>
                    <div style={{ position: 'relative' }}>
                      <MdBadge style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                      <input className="form-control" style={{ paddingLeft: 34 }} placeholder="e.g. 2024001"
                        value={reg.student_id} onChange={e => setReg(p => ({ ...p, student_id: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">School Email <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <MdEmail style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                    <input className="form-control" style={{ paddingLeft: 34 }} placeholder="you@asscat.edu.ph" type="email"
                      value={reg.email} onChange={e => setReg(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="form-control" type="password" placeholder="Minimum 6 characters"
                    value={reg.password} onChange={e => setReg(p => ({ ...p, password: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleRegister} disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating...</> : <><MdEditNote size={15} /> Create Account</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
