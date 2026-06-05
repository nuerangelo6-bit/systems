import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import {
  MdArrowBack, MdSend, MdWarning, MdSearch, MdClose, MdPerson,
  MdImage, MdDeleteOutline, MdVisibility, MdCheckCircle, MdEdit,
  MdWavingHand, MdAssignment, MdAccountCircle, MdDescription, MdInfo
} from 'react-icons/md'
import { getUser } from '../utils/auth'
import API from '../config/api'
const MAX_FILES = 5
const MAX_SIZE_MB = 2

export default function FileGrievance() {
  const navigate = useNavigate()
  const user = getUser()
  const suspectRef = useRef(null)
  const fileInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [suspects, setSuspects] = useState([])
  const [filteredSuspects, setFilteredSuspects] = useState([])
  const [suspectSearch, setSuspectSearch] = useState('')
  const [showSuspectDropdown, setShowSuspectDropdown] = useState(false)
  const [selectedSuspect, setSelectedSuspect] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [form, setForm] = useState({ student_id_num: '', category_id: '', subject: '', description: '' })
  const [errors, setErrors] = useState({})

  const categoriesRequiringSuspect = ['Bullying', 'Faculty/Staff Conduct', 'Harassment & Discrimination']
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [submitted, setSubmitted] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: `${Date.now()}-${Math.random()}`, message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, susRes] = await Promise.all([
          axios.get(`${API}/data/categories`),
          axios.get(`${API}/data/suspects`)
        ])
        console.log('Categories response:', catRes.data)
        console.log('Suspects response:', susRes.data)
        setCategories(catRes.data.data || [])
        setSuspects(susRes.data.data || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        addToast('Failed to load form data', 'error')
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    setFilteredSuspects(
      suspectSearch.trim()
        ? suspects.filter(s => s.full_name.toLowerCase().includes(suspectSearch.toLowerCase()))
        : suspects
    )
  }, [suspectSearch, suspects])

  useEffect(() => {
    const handler = e => { if (suspectRef.current && !suspectRef.current.contains(e.target)) setShowSuspectDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    processFiles(files)
    e.target.value = ''
  }

  const processFiles = (files) => {
    const remaining = MAX_FILES - attachments.length
    if (remaining <= 0) { addToast(`Maximum ${MAX_FILES} images allowed`, 'error'); return }

    const toAdd = []
    for (const file of files.slice(0, remaining)) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
        addToast(`${file.name} — only JPG, PNG, and PDF allowed`, 'error'); continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        addToast(`${file.name} — max ${MAX_SIZE_MB}MB per file`, 'error'); continue
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      toAdd.push({ file, preview, name: file.name, size: file.size, type: file.type })
    }
    setAttachments(p => [...p, ...toAdd])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const removeAttachment = (idx) => {
    setAttachments(p => {
      URL.revokeObjectURL(p[idx].preview)
      return p.filter((_, i) => i !== idx)
    })
  }

  const validate = () => {
    const e = {}
    if (!form.student_id_num.trim()) e.student_id_num = 'Student ID is required'
    if (!form.category_id) e.category_id = 'Please select a category'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    else if (form.subject.trim().length < 5) e.subject = 'Subject must be at least 5 characters'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters'
    
    const categoryName = categories.find(c => c.category_id === Number(form.category_id))?.category_name || ''
    if (categoriesRequiringSuspect.includes(categoryName) && !selectedSuspect) {
      e.suspect = 'Please select the respondent/suspect for this category'
    }
    return e
  }

  const handlePreview = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); addToast('Please fix errors before previewing', 'error'); return }
    setShowPreview(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setShowPreview(false)
    try {
      
      const r = await axios.post(`${API}/grievances`, {
        complainant_id: user?.userId,
        student_name: user?.full_name || user?.username || 'Unknown',
        student_email: user?.email || 'unknown@email.com',
        student_id_num: form.student_id_num,
        category_id: Number(form.category_id),
        subject: form.subject,
        description: form.description,
        suspect_id: selectedSuspect?.suspect_id || null,
        suspect_name: selectedSuspect?.full_name || null,
      })

      const grievanceId = r.data.data?.grievance_id
      const caseNumber = r.data.data?.case_number

      
      if (attachments.length > 0 && grievanceId) {
        const fd = new FormData()
        attachments.forEach(a => fd.append('files', a.file))
        try {
          await axios.post(`${API}/attachments/${grievanceId}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch {
          addToast('Grievance submitted but some attachments failed to upload', 'error')
        }
      }

      setSubmitted({ ...r.data.data, attachmentCount: attachments.length })
      setForm({ student_id_num: '', category_id: '', subject: '', description: '' })
      setSelectedSuspect(null)
      setAttachments([])
      
      setTimeout(() => {
        navigate('/student')
      }, 2000)
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit grievance', 'error')
    } finally { setSubmitting(false) }
  }

  const categoryName = categories.find(c => c.category_id === Number(form.category_id))?.category_name || ''
  const requiresSuspect = categoriesRequiringSuspect.includes(categoryName)
  const charCount = form.description.length
  const charOk = charCount >= 20

  
  if (submitted) {
    return (
      <div className="form-page fade-up">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 'var(--r-xl)', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 56, marginBottom: '1rem' }}><MdCheckCircle size={56} color="var(--green)" /></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Grievance Filed Successfully</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your grievance has been submitted
            {submitted.attachmentCount > 0 ? ` with ${submitted.attachmentCount} evidence photo${submitted.attachmentCount > 1 ? 's' : ''}` : ''}.
          </p>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', display: 'inline-block' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>YOUR CASE NUMBER</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em' }}>
              {submitted.case_number}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Save this to track your case</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/student')}>← My Cases</button>
            <button className="btn btn-primary" onClick={() => setSubmitted(null)}>File Another</button>
          </div>
        </div>
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    )
  }

  return (
    <div className="form-page fade-up">
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: '0.85rem' }}>
          <MdWavingHand size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> <strong style={{ color: 'var(--accent)' }}>{user?.full_name}</strong>
          <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>{user?.email}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student')}>
          <MdArrowBack size={13} /> Dashboard
        </button>
      </div>

      <div className="form-page-header">
        <h1 className="form-page-title"><MdAssignment size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> File a Grievance</h1>
        <p className="form-page-sub">Fill out the form then preview before submitting. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.</p>
      </div>

      <div className="form-card">

        <div className="form-section-title"><MdAccountCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Your Information</div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" value={user?.full_name || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Student ID <span>*</span></label>
            <input className={`form-control ${errors.student_id_num ? 'error' : ''}`}
              placeholder="e.g. 2024001"
              value={form.student_id_num}
              onChange={e => { setForm(p => ({ ...p, student_id_num: e.target.value })); setErrors(p => ({ ...p, student_id_num: '' })) }} />
            {errors.student_id_num && <div className="form-error"><MdWarning size={13} /> {errors.student_id_num}</div>}
          </div>
        </div>


        {requiresSuspect && (
          <>
            <div className="form-section-title" style={{ marginTop: '0.5rem' }}><MdWarning size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Respondent / Suspect</div>
            <div className="form-group">
              <label className="form-label">Select Respondent <span>*</span></label>
              <div className="suspect-picker" ref={suspectRef}>
                {selectedSuspect ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="suspect-selected-tag">
                      <MdPerson size={14} />
                      {selectedSuspect.full_name}
                      <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>· {selectedSuspect.section}</span>
                      <button onClick={() => setSelectedSuspect(null)}><MdClose size={13} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'relative' }}>
                      <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                      <input className={`form-control ${errors.suspect ? 'error' : ''}`}
                        style={{ paddingLeft: 36 }}
                        placeholder="Type to search classmate name..."
                        value={suspectSearch}
                        onChange={e => setSuspectSearch(e.target.value)}
                        onFocus={() => setShowSuspectDropdown(true)} />
                    </div>
                    {showSuspectDropdown && (
                      <div className="suspect-dropdown">
                        {filteredSuspects.length === 0
                          ? <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>No results found — type full name</div>
                          : filteredSuspects.map(s => (
                            <div key={s.suspect_id} className="suspect-option"
                              onClick={() => { setSelectedSuspect(s); setSuspectSearch(''); setShowSuspectDropdown(false); setErrors(p => ({ ...p, suspect: '' })) }}>
                              <MdPerson size={15} color="var(--purple)" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.full_name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.section}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </>
                )}
              </div>
              {errors.suspect && <div className="form-error"><MdWarning size={13} /> {errors.suspect}</div>}
            </div>
          </>
        )}


        <div className="form-section-title"><MdDescription size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Grievance Details</div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">Category <span>*</span></label>
            <select className={`form-control ${errors.category_id ? 'error' : ''}`}
              value={form.category_id}
              onChange={e => { setForm(p => ({ ...p, category_id: e.target.value })); setErrors(p => ({ ...p, category_id: '' })) }}>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
            {errors.category_id && <div className="form-error"><MdWarning size={13} /> {errors.category_id}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Subject <span>*</span></label>
            <input className={`form-control ${errors.subject ? 'error' : ''}`}
              placeholder="Brief title of your complaint"
              maxLength={255}
              value={form.subject}
              onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: '' })) }} />
            {errors.subject && <div className="form-error"><MdWarning size={13} /> {errors.subject}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Description <span>*</span></span>
            <span style={{ color: charOk ? 'var(--green)' : 'var(--red)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'none', letterSpacing: 0 }}>
              {charOk ? `${charCount} chars ✓` : `${charCount}/20 min`}
            </span>
          </label>
          <textarea className={`form-control ${errors.description ? 'error' : ''}`}
            rows={7}
            placeholder="Describe the incident in detail — include dates, times, location, and what happened..."
            value={form.description}
            onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: '' })) }} />
          {errors.description && <div className="form-error"><MdWarning size={13} /> {errors.description}</div>}
        </div>


        <div className="form-section-title"><MdImage size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Evidence Attachments <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem' }}>(optional · JPG/PNG/PDF · max 2MB each · up to {MAX_FILES})</span></div>


        {attachments.length < MAX_FILES && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '2rem', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.15s', marginBottom: '1rem',
              background: isDragging ? 'var(--accent-bg)' : 'var(--bg-elevated)'
            }}
          >
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            <MdImage size={32} color={isDragging ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {isDragging ? 'Drop files here' : 'Click to upload or drag & drop'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {attachments.length}/{MAX_FILES} files · JPG, PNG, or PDF · Max 2MB each
            </div>
          </div>
        )}


        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
            {attachments.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                {a.preview ? (
                  <img src={a.preview} alt={a.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
                ) : (
                  <div style={{ width: 48, height: 48, background: 'var(--accent-bg)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdDescription size={24} color="var(--accent)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(a.size / 1024).toFixed(1)} KB · {a.type.split('/')[1].toUpperCase()}</div>
                </div>
                {a.preview && (
                  <button onClick={() => setLightboxImg(a.preview)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdVisibility size={16} color="var(--text-secondary)" />
                  </button>
                )}
                <button onClick={() => removeAttachment(i)}
                  style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdDeleteOutline size={16} color="var(--red)" />
                </button>
              </div>
            ))}
            {attachments.length < MAX_FILES && (
              <div onClick={() => fileInputRef.current?.click()}
                style={{ border: '2px dashed var(--border)', borderRadius: 'var(--r-md)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-elevated)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}>
                <MdImage size={20} color="var(--text-muted)" style={{ marginRight: 8 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Add more files</div>
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/student')}>
            <MdArrowBack size={14} /> Cancel
          </button>
          <button className="form-btn-submit" onClick={handlePreview} disabled={submitting}>
            <MdVisibility size={15} /> Preview & Submit
          </button>
        </div>
      </div>

      
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}>
          <img src={lightboxImg} alt="preview" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdClose size={20} />
          </button>
        </div>
      )}

      
      {showPreview && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPreview(false)}>
          <div className="modal-box" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="modal-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  <MdAssignment size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Grievance Preview
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Review all details before submitting
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', lineHeight: 1 }}>
                <MdClose size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--purple))', borderRadius: 'var(--r-sm)', padding: '14px 18px', color: '#fff' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>New Grievance</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{form.subject}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 4 }}>{categoryName}</div>
              </div>

              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="info-item">
                  <div className="info-item-label">Complainant</div>
                  <div className="info-item-value">{user?.full_name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{user?.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Student ID</div>
                  <div className="info-item-value" style={{ fontFamily: 'var(--mono)' }}>{form.student_id_num}</div>
                </div>
              </div>

              
              {selectedSuspect && requiresSuspect && (
                <div className="suspect-box">
                  <MdWarning size={20} style={{ color: 'var(--purple)' }} />
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--purple)', marginBottom: 2 }}>Respondent / Suspect</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedSuspect.full_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedSuspect.section}</div>
                  </div>
                </div>
              )}

              
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>Description</div>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                  {form.description}
                </div>
              </div>

              
              {attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Evidence Photos ({attachments.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
                    {attachments.map((a, i) => (
                      <div key={i} style={{ borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', cursor: 'zoom-in' }}
                        onClick={() => setLightboxImg(a.preview)}>
                        <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}


              <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--blue)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <MdInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Once submitted, this grievance will be reviewed by the administration. A hearing officer will be assigned and you will be notified via summon when a hearing is scheduled.</span>
              </div>
            </div>

            
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(false)}>
                <MdEdit size={13} /> Edit
              </button>
              <button className="form-btn-submit" onClick={handleSubmit} disabled={submitting} style={{ padding: '9px 20px', fontSize: '0.875rem' }}>
                {submitting
                  ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Submitting...</>
                  : <><MdCheckCircle size={15} /> Confirm & Submit</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
