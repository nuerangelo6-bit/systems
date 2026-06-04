import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { MdSettings, MdRefresh, MdSave, MdSchool, MdCalendarToday, MdEdit, MdCheckCircle } from 'react-icons/md'
import Toast from '../components/Toast'
import API from '../config/api'

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    academic_year: '',
    semester: '',
    case_id_prefix: '',
    case_id_start_number: 1
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`${API}/grievances/meta/settings`)
      if (r.data.success) {
        setSettings(r.data.data || {
          academic_year: '2025-2026',
          semester: '1st Semester',
          case_id_prefix: 'GRV',
          case_id_start_number: 1
        })
      }
    } catch { addToast('Failed to load settings', 'error') }
    finally { setLoading(false) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await axios.put(`${API}/grievances/meta/settings`, settings)
      addToast('System settings saved successfully')
      setEditMode(false)
    } catch { addToast('Failed to save settings', 'error') }
    finally { setSaving(false) }
  }

  useEffect(() => { fetchSettings() }, [])

  const generateCaseIdPreview = () => {
    return `${settings.case_id_prefix}-${settings.academic_year.split('-')[0]}-${String(settings.case_id_start_number).padStart(4, '0')}`
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdSettings size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> System <span className="accent">Settings</span></h1>
          <p className="page-sub">Configure academic year and case ID generation</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchSettings}>
            <MdRefresh size={14} /> Refresh
          </button>
          {!editMode && (
            <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>
              <MdEdit size={14} /> Edit Settings
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 28, height: 28 }} />
          Loading settings...
        </div>
      ) : (
        <div style={{ maxWidth: 700 }}>
          <div className="panel" style={{ marginBottom: '1.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>
              <MdSchool size={13} /> Academic Year Configuration
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input
                  className="form-control"
                  value={settings.academic_year}
                  onChange={e => setSettings(p => ({ ...p, academic_year: e.target.value }))}
                  disabled={!editMode}
                  placeholder="e.g. 2025-2026"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  className="form-control"
                  value={settings.semester}
                  onChange={e => setSettings(p => ({ ...p, semester: e.target.value }))}
                  disabled={!editMode}
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: '1.5rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>
              <MdCalendarToday size={13} /> Case ID Generation
            </div>
            <div className="form-row" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Case ID Prefix</label>
                <input
                  className="form-control"
                  value={settings.case_id_prefix}
                  onChange={e => setSettings(p => ({ ...p, case_id_prefix: e.target.value.toUpperCase() }))}
                  disabled={!editMode}
                  placeholder="e.g. GRV"
                  maxLength={10}
                  style={{ fontFamily: 'var(--mono)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Number</label>
                <input
                  className="form-control"
                  type="number"
                  value={settings.case_id_start_number}
                  onChange={e => setSettings(p => ({ ...p, case_id_start_number: parseInt(e.target.value) || 1 }))}
                  disabled={!editMode}
                  min={1}
                  style={{ fontFamily: 'var(--mono)' }}
                />
              </div>
            </div>
            <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 4 }}>
                Case ID Preview
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>
                {generateCaseIdPreview()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                This format will be used for new grievance cases
              </div>
            </div>
          </div>

          {editMode && (
            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="section-label" style={{ marginBottom: '1rem' }}>
                <MdCheckCircle size={13} /> Save Changes
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                Changes to academic year settings will affect new case ID generation. Existing cases will retain their original IDs.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(false); fetchSettings() }}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={saving}>
                  {saving ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Saving...</> : <><MdSave size={14} /> Save Settings</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
