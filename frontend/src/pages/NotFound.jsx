import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MdSearch } from 'react-icons/md'
import { getUser } from '../utils/auth'

export default function NotFound() {
  const navigate = useNavigate()
  const user = getUser()
  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}><MdSearch size={56} color="var(--text-muted)" /></div>
      <div className="empty-title" style={{ fontSize: '1.4rem' }}>404 — Page Not Found</div>
      <div className="empty-sub" style={{ marginBottom: '1.5rem' }}>The page you're looking for doesn't exist.</div>
      <button className="btn btn-primary" onClick={() => navigate(user ? (user.role === 'student' ? '/student' : '/') : '/login')}>← Go Home</button>
    </div>
  )
}
