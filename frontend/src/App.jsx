import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import FileGrievance from './pages/FileGrievance'
import CaseDetail from './pages/CaseDetail'
import AdminPanel from './pages/AdminPanel'
import SqlQueries from './pages/SqlQueries'
import Profile from './pages/Profile'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import SystemAuditLogs from './pages/SystemAuditLogs'
import SystemSettings from './pages/SystemSettings'
import NotFound from './pages/NotFound'
import { getUser, isAdmin, isSuperAdmin } from './utils/auth'
import './styles/global.css'

function RequireAdmin({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/student" replace />
  return children
}
function RequireSuperAdmin({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (!isSuperAdmin()) return <Navigate to="/" replace />
  return children
}
function RequireStudent({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'student') return <Navigate to="/" replace />
  return children
}
function RequireAuth({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}
function SmartHome() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'student') return <Navigate to="/student" replace />
  if (user.role === 'superadmin') return <SuperAdminDashboard />
  return <Dashboard />
}

export default function App() {
  const location = useLocation()
  const user = getUser()
  const isLoggedIn = !!user
  const isLoginPage = location.pathname === '/login'

  return (
    <div className="app-wrapper">
      {isLoggedIn && !isLoginPage && <Sidebar />}
      <div className="app-main">
        {isLoggedIn && !isLoginPage && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={isLoggedIn ? <SmartHome /> : <Landing />} />
            <Route path="/login" element={<Landing />} />
            <Route path="/dashboard" element={<SmartHome />} />
            <Route path="/cases" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
            <Route path="/cases/:id" element={<RequireAuth><CaseDetail /></RequireAuth>} />
            <Route path="/student/cases/:id" element={<RequireStudent><CaseDetail /></RequireStudent>} />
            <Route path="/admin" element={<RequireSuperAdmin><AdminPanel /></RequireSuperAdmin>} />
            <Route path="/sql" element={<RequireSuperAdmin><SqlQueries /></RequireSuperAdmin>} />
            <Route path="/audit-logs" element={<RequireSuperAdmin><SystemAuditLogs /></RequireSuperAdmin>} />
            <Route path="/settings" element={<RequireSuperAdmin><SystemSettings /></RequireSuperAdmin>} />
            <Route path="/student" element={<RequireStudent><StudentDashboard /></RequireStudent>} />
            <Route path="/file" element={<RequireStudent><FileGrievance /></RequireStudent>} />
            <Route path="/profile" element={<RequireStudent><Profile /></RequireStudent>} />
            <Route path="/reports" element={<RequireStudent><Reports /></RequireStudent>} />
            <Route path="/notifications" element={<RequireStudent><Notifications /></RequireStudent>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {isLoggedIn && !isLoginPage && <footer className="app-footer">© 2026 Agusan del Sur State University · Grievance Management System</footer>}
      </div>
    </div>
  )
}
