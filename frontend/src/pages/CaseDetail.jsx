import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import SummonPrint from '../components/SummonPrint'
import HearingSummaryModal from '../components/HearingSummaryModal'
import {
  MdArrowBack, MdRefresh, MdSchedule, MdCheckCircle, MdLoop,
  MdPrint, MdAssignment, MdSend, MdSummarize, MdWarning, MdImage,
  MdDelete, MdCalendarToday, MdLocationOn, MdAccessTime, MdMail, MdPeople, MdPerson, MdClose
} from 'react-icons/md'
import { getUser, isSuperAdmin, isStudent } from '../utils/auth'
import API from '../config/api'

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getUser()

  const [grievance, setGrievance] = useState(null)
  const [logs, setLogs] = useState([])
  const [hearings, setHearings] = useState([])
  const [summons, setSummons] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  
  const [printSummon, setPrintSummon] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [lightboxImg, setLightboxImg] = useState(null)
  const [activeSummary, setActiveSummary] = useState(null)
  const [activeSummaryHearing, setActiveSummaryHearing] = useState(null)

  
  const [showHearingForm, setShowHearingForm] = useState(false)
  const [hearingForm, setHearingForm] = useState({ scheduled_date: '', scheduled_time: '', venue: '' })

  
  const [showCompleteForm, setShowCompleteForm] = useState(null) 
  const [completeForm, setCompleteForm] = useState({ outcome: '' })

  
  const [showRescheduleForm, setShowRescheduleForm] = useState(null) 
  const [rescheduleForm, setRescheduleForm] = useState({
    reschedule_reason: '',
    next_hearing_date: '',
    next_hearing_time: '',
    next_venue: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [assignAdmin, setAssignAdmin] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  const addToast = (msg, type = 'success') => setToasts(p => [...p, { id: Date.now(), message: msg, type }])
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [gR, lR, hR, sR, aR] = await Promise.all([
        axios.get(`${API}/grievances/${id}`),
        axios.get(`${API}/grievances/${id}/logs`),
        axios.get(`${API}/grievances/${id}/hearings`),
        axios.get(`${API}/grievances/${id}/summons`),
        axios.get(`${API}/attachments/${id}`),
      ])
      if (gR.data.success) setGrievance(gR.data.data)
      if (lR.data.success) setLogs(lR.data.data)
      if (hR.data.success) setHearings(hR.data.data)
      if (sR.data.success) setSummons(sR.data.data)
      if (aR.data.success) setAttachments(aR.data.data)
    } catch { addToast('Failed to load case', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAll()
    axios.get(`${API}/auth/users`).then(r => { if (r.data.success) setAdmins(r.data.data.filter(a => a.role === 'admin')) }).catch(() => {})
  }, [id])

  const handleStatus = async (s) => {
    try {
      await axios.put(`${API}/grievances/${id}`, { status: s, changed_by: user?.userId })
      addToast(`Status updated to "${s}"`)
      fetchAll()
    } catch { addToast('Failed to update status', 'error') }
  }

  const handleAssign = async () => {
    if (!assignAdmin) return
    try {
      await axios.put(`${API}/grievances/${id}`, { assigned_admin_id: parseInt(assignAdmin) })
      addToast('Officer assigned successfully')
      setAssignAdmin('')
      fetchAll()
    } catch { addToast('Failed to assign', 'error') }
  }

  const handleScheduleHearing = async () => {
    if (!hearingForm.scheduled_date || !hearingForm.scheduled_time || !hearingForm.venue.trim()) {
      addToast('Date, time and venue are required', 'error'); return
    }
    setSubmitting(true)
    try {
      await axios.post(`${API}/grievances/${id}/hearings`, { ...hearingForm, created_by: user?.user_id })
      addToast('Hearing scheduled — summons issued to both parties ✅')
      setShowHearingForm(false)
      setHearingForm({ scheduled_date: '', scheduled_time: '', venue: '' })
      fetchAll()
    } catch { addToast('Failed to schedule', 'error') }
    finally { setSubmitting(false) }
  }

  const handleComplete = async (hearingId) => {
    if (!completeForm.outcome.trim()) {
      addToast('Please enter outcome notes', 'error'); return
    }
    setSubmitting(true)
    try {
      const r = await axios.put(`${API}/grievances/${id}/hearings/${hearingId}`, {
        status: 'Completed',
        outcome: completeForm.outcome,
        prepared_by: user?.user_id
      })
      addToast('Hearing completed — summary saved ✅')
      setShowCompleteForm(null)
      setCompleteForm({ outcome: '' })
      fetchAll()
      
      if (r.data.summary) {
        const h = hearings.find(h => h.hearing_id === hearingId)
        setActiveSummary(r.data.summary)
        setActiveSummaryHearing(h)
      } else {
        
        await fetchAll()
        const updated = hearings.find(h => h.hearing_id === hearingId)
        if (updated?.summary_id) {
          setActiveSummary(updated)
          setActiveSummaryHearing(updated)
        }
      }
    } catch { addToast('Failed to complete hearing', 'error') }
    finally { setSubmitting(false) }
  }

  const handleReschedule = async (hearingId) => {
    if (!rescheduleForm.reschedule_reason.trim()) {
      addToast('Please provide a reason for rescheduling', 'error'); return
    }
    if (!rescheduleForm.next_hearing_date || !rescheduleForm.next_hearing_time || !rescheduleForm.next_venue.trim()) {
      addToast('New date, time and venue are required', 'error'); return
    }
    setSubmitting(true)
    try {
      const r = await axios.put(`${API}/grievances/${id}/hearings/${hearingId}`, {
        status: 'Rescheduled',
        ...rescheduleForm,
        prepared_by: user?.user_id
      })
      addToast('Hearing rescheduled — new hearing created + summons issued')
      setShowRescheduleForm(null)
      setRescheduleForm({ reschedule_reason: '', next_hearing_date: '', next_hearing_time: '', next_venue: '' })
      fetchAll()
      
      if (r.data.summary) {
        const h = hearings.find(h => h.hearing_id === hearingId)
        setActiveSummary(r.data.summary)
        setActiveSummaryHearing(h)
      }
    } catch { addToast('Failed to reschedule', 'error') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== grievance.case_number) {
      addToast('Case ID does not match', 'error')
      return
    }
    try {
      await axios.delete(`${API}/grievances/${id}`)
      setShowDeleteModal(false)
      setDeleteConfirmText('')
      setShowDeleteSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    } catch { addToast('Failed to delete', 'error') }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} /></div>
  if (!grievance) return <div className="empty-state"><div className="empty-title">Case not found</div><button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button></div>

  const statusOptions = ['Submitted','Under Review','Hearing Scheduled','Resolved','Closed','Rejected']
  const hearingStatusColor = { 'Scheduled':'badge-hearing','Completed':'badge-resolved','Rescheduled':'badge-review','Cancelled':'badge-rejected' }

  return (
    <div className="fade-up">
      
      <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><MdArrowBack size={14}/> Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--accent)', fontWeight:600, marginBottom:4, letterSpacing:'0.05em' }}>{grievance.case_number}</div>
          <h1 style={{ fontSize:'1.45rem', fontWeight:800, letterSpacing:'-0.025em', marginBottom:6, color:'var(--text-primary)' }}>{grievance.subject}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <StatusBadge status={grievance.status}/>
            <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>
              Filed {new Date(grievance.submission_date).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}
            </span>
            <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}>· {grievance.days_open} days open</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchAll}><MdRefresh size={14}/></button>
          {!isStudent() && (
            <div style={{position:'relative'}}>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}><MdDelete size={14} /> Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="case-detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:'1.25rem', alignItems:'start' }}>
        
        <div>
          
          <div className="panel">
            <div className="section-label"><MdAssignment size={13} /> Case Information</div>
            <div className="info-grid" style={{ marginBottom:'1rem' }}>
              <div className="info-item"><div className="info-item-label">Complainant</div><div className="info-item-value">{grievance.student_name}</div><div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:1}}>{grievance.student_email}</div></div>
              <div className="info-item"><div className="info-item-label">Student ID</div><div className="info-item-value" style={{fontFamily:'var(--mono)'}}>{grievance.student_id_num}</div></div>
              <div className="info-item"><div className="info-item-label">Category</div><div className="info-item-value">{grievance.category_name}</div></div>
              <div className="info-item"><div className="info-item-label">Assigned Officer</div><div className="info-item-value" style={{color:grievance.assigned_admin_name?'var(--blue)':'var(--text-muted)'}}>{grievance.assigned_admin_name||'Not assigned'}</div></div>
            </div>
            {isSuperAdmin() && (
              <div style={{background:'var(--blue-bg)',border:'1px solid var(--blue-border)',borderRadius:8,padding:'12px',marginBottom:'1rem'}}>
                <div style={{fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--blue)',marginBottom:'6px'}}><MdPeople size={13} style={{verticalAlign:'middle',marginRight:4}} /> Assign Hearing Officer</div>
                <div style={{display:'flex',gap:6}}>
                  <select className="form-control" style={{flex:1,fontSize:'0.8rem'}} value={assignAdmin} onChange={e=>setAssignAdmin(e.target.value)}>
                    <option value="">Select officer...</option>
                    {admins.map(a=><option key={a.user_id} value={a.user_id}>{a.full_name} ({a.role})</option>)}
                  </select>
                  <button className="btn btn-info btn-sm" onClick={handleAssign} disabled={!assignAdmin} style={{padding:'6px 12px'}}>
                    <MdPerson size={13}/> Assign
                  </button>
                </div>
              </div>
            )}
            {grievance.suspect_name && (
              <div className="suspect-box" style={{marginBottom:'1rem'}}>
                <span style={{fontSize:20}}>⚠️</span>
                <div>
                  <div style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--purple)',marginBottom:2}}>Respondent / Suspect</div>
                  <div style={{fontWeight:700,fontSize:'0.95rem'}}>{grievance.suspect_name}</div>
                </div>
              </div>
            )}
            <div>
              <div style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:6}}>Description</div>
              <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:7,padding:'12px 14px',fontSize:'0.875rem',lineHeight:1.7,color:'var(--text-secondary)',whiteSpace:'pre-wrap'}}>{grievance.description}</div>
            </div>
          </div>

          
          {!isStudent() && (
            <div className="panel">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
                <div className="section-label" style={{marginBottom:0}}>⚖️ Hearing Schedule ({hearings.length})</div>
                {!showHearingForm && (
                  <button className="btn btn-purple btn-sm" onClick={()=>setShowHearingForm(true)}>
                    <MdSchedule size={13}/> Schedule Hearing
                  </button>
                )}
              </div>

            
            {showHearingForm && (
              <div style={{background:'var(--purple-bg)',border:'1px solid var(--purple-border)',borderRadius:9,padding:'1.1rem',marginBottom:'1rem'}}>
                <div style={{fontSize:'0.74rem',fontWeight:700,color:'var(--purple)',marginBottom:'0.9rem'}}><MdCalendarToday size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Schedule Hearing #{hearings.length+1}</div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date</label><input className="form-control" type="date" value={hearingForm.scheduled_date} onChange={e=>setHearingForm(p=>({...p,scheduled_date:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Time</label><input className="form-control" type="time" value={hearingForm.scheduled_time} onChange={e=>setHearingForm(p=>({...p,scheduled_time:e.target.value}))}/></div>
                </div>
                <div className="form-group"><label className="form-label">Venue</label>
                  <select className="form-control" value={hearingForm.venue} onChange={e=>setHearingForm(p=>({...p,venue:e.target.value}))}>
                    <option value="">Select venue...</option>
                    <optgroup label="Administrative & Support Offices">
                      <option value="Office of the University President (OUP)">Office of the University President (OUP)</option>
                      <option value="Office of the Vice President for Academic Affairs (OVPAA)">Office of the Vice President for Academic Affairs (OVPAA)</option>
                      <option value="Office of the Vice President for Administration and Finance (OVPAF)">Office of the Vice President for Administration and Finance (OVPAF)</option>
                      <option value="Office of the Vice President for Research, Innovation, and Extension (OVPRIE)">Office of the Vice President for Research, Innovation, and Extension (OVPRIE)</option>
                      <option value="Office of the University Registrar (OUR)">Office of the University Registrar (OUR)</option>
                      <option value="Management Information Systems (MIS) Office">Management Information Systems (MIS) Office</option>
                      <option value="Office of Student Affairs and Services (OSAS)">Office of Student Affairs and Services (OSAS)</option>
                      <option value="Procurement / Bids and Awards Committee (BAC) Office">Procurement / Bids and Awards Committee (BAC) Office</option>
                      <option value="Cashiering / Accounting Office">Cashiering / Accounting Office</option>
                      <option value="Human Resource Management Office (HRMO)">Human Resource Management Office (HRMO)</option>
                      <option value="Supply and Property Management Office (SPMO)">Supply and Property Management Office (SPMO)</option>
                    </optgroup>
                    <optgroup label="Academic Colleges & Departments">
                      <option value="College of Information and Communications Technology (CICT)">College of Information and Communications Technology (CICT)</option>
                      <option value="College of Agriculture (COA)">College of Agriculture (COA)</option>
                      <option value="College of Teacher Education (CTE)">College of Teacher Education (CTE)</option>
                      <option value="College of Engineering and Technology (CET)">College of Engineering and Technology (CET)</option>
                      <option value="College of Arts and Sciences (CAS)">College of Arts and Sciences (CAS)</option>
                    </optgroup>
                    <optgroup label="Campus Venues & Facilities">
                      <option value="University Gymnasium / Cultural Center">University Gymnasium / Cultural Center</option>
                      <option value="ADSSU Library (Learning Resource Center)">ADSSU Library (Learning Resource Center)</option>
                      <option value="CICT Computer Laboratory 1">CICT Computer Laboratory 1</option>
                      <option value="CICT Computer Laboratory 2">CICT Computer Laboratory 2</option>
                      <option value="CICT Multimedia and Mac Lab">CICT Multimedia and Mac Lab</option>
                      <option value="Audio-Visual Room (AVR)">Audio-Visual Room (AVR)</option>
                      <option value="Administration Building Conference Room">Administration Building Conference Room</option>
                      <option value="Agriculture and Chemistry Laboratory">Agriculture and Chemistry Laboratory</option>
                      <option value="Soil Science and Research Laboratory">Soil Science and Research Laboratory</option>
                      <option value="University Oval / Grandstand">University Oval / Grandstand</option>
                      <option value="Student Center / Hostel">Student Center / Hostel</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{display:'flex',gap:7,justifyContent:'flex-end'}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setShowHearingForm(false);setHearingForm({scheduled_date:'',scheduled_time:'',venue:''})}}>Cancel</button>
                  <button className="btn btn-purple btn-sm" onClick={handleScheduleHearing} disabled={submitting}>
                    {submitting?<div className="spinner" style={{width:12,height:12,borderWidth:2}}/>:<MdSend size={12}/>} Schedule & Issue Summons
                  </button>
                </div>
              </div>
            )}

            {hearings.length===0 ? (
              <div style={{textAlign:'center',padding:'1.5rem',color:'var(--text-muted)',fontSize:'0.84rem'}}>No hearings scheduled yet</div>
            ) : hearings.map(h => (
              <div key={h.hearing_id} style={{marginBottom:'0.75rem'}}>
                <div className="hearing-card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,flexWrap:'wrap',gap:6}}>
                    <div className="hearing-card-num">Hearing #{h.hearing_number}</div>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      <span className={`badge ${hearingStatusColor[h.status]||'badge-closed'}`}>{h.status}</span>
                      
                      {h.summary_id && (
                        <button className="btn btn-ghost btn-sm" style={{fontSize:'0.7rem',padding:'3px 8px'}}
                          onClick={()=>{setActiveSummary(h);setActiveSummaryHearing(h)}}>
                          <MdSummarize size={12}/> View Summary
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:3}}>
                    <MdCalendarToday size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {new Date(h.scheduled_date).toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} at {h.scheduled_time?.slice(0,5)}
                  </div>
                  <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:6}}><MdLocationOn size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {h.venue}</div>

                  {h.reschedule_reason && (
                    <div style={{fontSize:'0.74rem',color:'var(--orange)',marginBottom:4,background:'var(--orange-bg)',border:'1px solid var(--orange-border)',borderRadius:5,padding:'5px 9px'}}>
                      <MdLoop size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Reschedule reason: {h.reschedule_reason}
                    </div>
                  )}
                  {h.outcome && (
                    <div style={{fontSize:'0.78rem',color:'var(--green)',background:'var(--green-bg)',border:'1px solid var(--green-border)',borderRadius:5,padding:'7px 10px',marginBottom:4}}>
                      <MdCheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Outcome: {h.outcome}
                    </div>
                  )}

                  
                  {(h.status === 'Scheduled' || h.status === 'Rescheduled') && (
                    <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                      <button className="btn btn-success btn-sm"
                        onClick={()=>{setShowCompleteForm(h.hearing_id);setShowRescheduleForm(null);setCompleteForm({outcome:''})}}>
                        <MdCheckCircle size={13}/> Mark Complete
                      </button>
                      <button className="btn btn-warning btn-sm"
                        onClick={()=>{setShowRescheduleForm(h.hearing_id);setShowCompleteForm(null);setRescheduleForm({reschedule_reason:'',next_hearing_date:'',next_hearing_time:'',next_venue:''})}}>
                        <MdLoop size={13}/> Reschedule
                      </button>
                    </div>
                  )}
                </div>

                
                {showCompleteForm===h.hearing_id && (
                  <div style={{background:'var(--green-bg)',border:'1px solid var(--green-border)',borderRadius:9,padding:'1.1rem',marginTop:4}}>
                    <div style={{fontSize:'0.74rem',fontWeight:700,color:'var(--green)',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:6}}>
                      <MdCheckCircle size={14}/> Complete Hearing #{h.hearing_number}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Outcome / Resolution Notes <span style={{color:'var(--red)'}}>*</span></label>
                      <textarea className="form-control" rows={4}
                        placeholder="Describe what happened during the hearing, the decision reached, any agreements made, or next steps..."
                        value={completeForm.outcome}
                        onChange={e=>setCompleteForm({outcome:e.target.value})}/>
                      {!completeForm.outcome.trim() && <div style={{fontSize:'0.71rem',color:'var(--text-muted)',marginTop:4}}>Required — this will appear in the hearing summary report</div>}
                    </div>
                    <div style={{display:'flex',gap:7,justifyContent:'flex-end'}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setShowCompleteForm(null)}>Cancel</button>
                      <button className="btn btn-success btn-sm" onClick={()=>handleComplete(h.hearing_id)} disabled={submitting}>
                        {submitting?<div className="spinner" style={{width:12,height:12,borderWidth:2}}/>:<MdCheckCircle size={12}/>} Confirm & Generate Summary
                      </button>
                    </div>
                  </div>
                )}

                
                {showRescheduleForm===h.hearing_id && (
                  <div style={{background:'var(--yellow-bg)',border:'1px solid var(--yellow-border)',borderRadius:9,padding:'1.1rem',marginTop:4}}>
                    <div style={{fontSize:'0.74rem',fontWeight:700,color:'var(--yellow)',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:6}}>
                      <MdLoop size={14}/> Reschedule Hearing #{h.hearing_number}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reason for Rescheduling <span style={{color:'var(--red)'}}>*</span></label>
                      <textarea className="form-control" rows={3}
                        placeholder="Explain why this hearing needs to be rescheduled..."
                        value={rescheduleForm.reschedule_reason}
                        onChange={e=>setRescheduleForm(p=>({...p,reschedule_reason:e.target.value}))}/>
                    </div>
                    <div style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:'0.75rem',marginTop:'0.25rem'}}>New Hearing Schedule</div>
                    <div className="form-row">
                      <div className="form-group"><label className="form-label">New Date <span style={{color:'var(--red)'}}>*</span></label><input className="form-control" type="date" value={rescheduleForm.next_hearing_date} onChange={e=>setRescheduleForm(p=>({...p,next_hearing_date:e.target.value}))}/></div>
                      <div className="form-group"><label className="form-label">New Time <span style={{color:'var(--red)'}}>*</span></label><input className="form-control" type="time" value={rescheduleForm.next_hearing_time} onChange={e=>setRescheduleForm(p=>({...p,next_hearing_time:e.target.value}))}/></div>
                    </div>
                    <div className="form-group"><label className="form-label">New Venue <span style={{color:'var(--red)'}}>*</span></label>
                      <select className="form-control" value={rescheduleForm.next_venue} onChange={e=>setRescheduleForm(p=>({...p,next_venue:e.target.value}))}>
                        <option value="">Select venue...</option>
                        <optgroup label="Administrative & Support Offices">
                          <option value="Office of the University President (OUP)">Office of the University President (OUP)</option>
                          <option value="Office of the Vice President for Academic Affairs (OVPAA)">Office of the Vice President for Academic Affairs (OVPAA)</option>
                          <option value="Office of the Vice President for Administration and Finance (OVPAF)">Office of the Vice President for Administration and Finance (OVPAF)</option>
                          <option value="Office of the Vice President for Research, Innovation, and Extension (OVPRIE)">Office of the Vice President for Research, Innovation, and Extension (OVPRIE)</option>
                          <option value="Office of the University Registrar (OUR)">Office of the University Registrar (OUR)</option>
                          <option value="Management Information Systems (MIS) Office">Management Information Systems (MIS) Office</option>
                          <option value="Office of Student Affairs and Services (OSAS)">Office of Student Affairs and Services (OSAS)</option>
                          <option value="Procurement / Bids and Awards Committee (BAC) Office">Procurement / Bids and Awards Committee (BAC) Office</option>
                          <option value="Cashiering / Accounting Office">Cashiering / Accounting Office</option>
                          <option value="Human Resource Management Office (HRMO)">Human Resource Management Office (HRMO)</option>
                          <option value="Supply and Property Management Office (SPMO)">Supply and Property Management Office (SPMO)</option>
                        </optgroup>
                        <optgroup label="Academic Colleges & Departments">
                          <option value="College of Information and Communications Technology (CICT)">College of Information and Communications Technology (CICT)</option>
                          <option value="College of Agriculture (COA)">College of Agriculture (COA)</option>
                          <option value="College of Teacher Education (CTE)">College of Teacher Education (CTE)</option>
                          <option value="College of Engineering and Technology (CET)">College of Engineering and Technology (CET)</option>
                          <option value="College of Arts and Sciences (CAS)">College of Arts and Sciences (CAS)</option>
                        </optgroup>
                        <optgroup label="Campus Venues & Facilities">
                          <option value="University Gymnasium / Cultural Center">University Gymnasium / Cultural Center</option>
                          <option value="ADSSU Library (Learning Resource Center)">ADSSU Library (Learning Resource Center)</option>
                          <option value="CICT Computer Laboratory 1">CICT Computer Laboratory 1</option>
                          <option value="CICT Computer Laboratory 2">CICT Computer Laboratory 2</option>
                          <option value="CICT Multimedia and Mac Lab">CICT Multimedia and Mac Lab</option>
                          <option value="Audio-Visual Room (AVR)">Audio-Visual Room (AVR)</option>
                          <option value="Administration Building Conference Room">Administration Building Conference Room</option>
                          <option value="Agriculture and Chemistry Laboratory">Agriculture and Chemistry Laboratory</option>
                          <option value="Soil Science and Research Laboratory">Soil Science and Research Laboratory</option>
                          <option value="University Oval / Grandstand">University Oval / Grandstand</option>
                          <option value="Student Center / Hostel">Student Center / Hostel</option>
                        </optgroup>
                      </select>
                    </div>
                    <div style={{display:'flex',gap:7,justifyContent:'flex-end'}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setShowRescheduleForm(null)}>Cancel</button>
                      <button className="btn btn-warning btn-sm" onClick={()=>handleReschedule(h.hearing_id)} disabled={submitting}>
                        {submitting?<div className="spinner" style={{width:12,height:12,borderWidth:2}}/>:<MdLoop size={12}/>} Reschedule & Generate Summary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          
          {!isStudent() && summons.length>0 && (
            <div className="panel">
              <div className="section-label" style={{marginBottom:'1rem'}}>📨 Issued Summons</div>
              {summons.map(s=>(
                <div key={s.summon_id} className={`summon-card ${!s.is_read?'summon-unread':''}`}
                  style={{cursor:'default'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:6}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                        <span className={`badge ${s.party_type==='complainant'?'badge-submitted':'badge-review'}`}>{s.party_type}</span>
                        <strong style={{fontSize:'0.84rem'}}>{s.party_name}</strong>
                      </div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>
                        Hearing #{s.hearing_number} · {s.scheduled_date?new Date(s.scheduled_date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}):'TBD'} {s.scheduled_time?.slice(0,5)} · {s.venue}
                      </div>
                      <div style={{fontSize:'0.69rem',color:'var(--text-muted)',marginTop:2}}>Issued {new Date(s.issued_at).toLocaleDateString('en-PH')}{s.issued_by_name?` by ${s.issued_by_name}`:''}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setPrintSummon(s)}><MdPrint size={13}/> Print</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          
          {attachments.length > 0 && (
            <div className="panel">
              <div className="section-label" style={{marginBottom:'1rem'}}>
                <MdImage size={13} /> Evidence Photos ({attachments.length})
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:8}}>
                {attachments.map(a => (
                  <div key={a.attachment_id}
                    style={{borderRadius:'var(--r-sm)',overflow:'hidden',border:'1px solid var(--border)',aspectRatio:'1',cursor:'zoom-in',background:'var(--bg-elevated)'}}
                    onClick={() => setLightboxImg(`https://systems-production.up.railway.app/uploads/${a.stored_name}`)}>
                    <img
                      src={`https://systems-production.up.railway.app/uploads/${a.stored_name}`}
                      alt={a.original_name}
                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                      onError={e => { e.target.style.display='none' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:8}}>
                Click any photo to enlarge
              </div>
            </div>
          )}

          
          {lightboxImg && (
            <div onClick={() => setLightboxImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',cursor:'zoom-out'}}>
              <img src={lightboxImg} alt="Evidence" style={{maxWidth:'90vw',maxHeight:'90vh',objectFit:'contain',borderRadius:8,boxShadow:'0 0 60px rgba(0,0,0,0.8)'}} />
            </div>
          )}

          
          <div className="panel">
            <div className="section-label" style={{marginBottom:'1rem'}}><MdAccessTime size={13} /> Activity Log</div>
            {logs.length===0 ? (
              <div style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>No activity yet</div>
            ) : logs.map(l=>(
              <div key={l.log_id} style={{display:'flex',gap:10,marginBottom:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:6}}/>
                <div style={{flex:1}}>
                  <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontSize:'0.8rem'}}>
                    {l.old_status
                      ? <span><strong style={{color:'var(--red)'}}>{l.old_status}</strong> → <strong style={{color:'var(--green)'}}>{l.new_status}</strong></span>
                      : <span>→ <strong style={{color:'var(--green)'}}>{l.new_status}</strong></span>
                    }
                    {l.changed_by_name && <span style={{color:'var(--text-muted)',marginLeft:6}}>by {l.changed_by_name}</span>}
                    {l.note && <div style={{fontSize:'0.74rem',color:'var(--text-secondary)',marginTop:4,fontStyle:'italic'}}>{l.note}</div>}
                  </div>
                  <div style={{fontSize:'0.67rem',color:'var(--text-muted)',marginTop:2,marginLeft:3}}>{new Date(l.changed_at).toLocaleString('en-PH')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div style={{display:'flex',flexDirection:'column',gap:'1rem',position:'sticky',top:78}}>
          
          {!isStudent() && (
            <div className="panel">
              <div className="section-label" style={{marginBottom:'0.75rem'}}>Update Status</div>
              <div style={{display:'flex',flexDirection:'column',gap:0,position:'relative'}}>
                <div style={{position:'absolute',left:19,top:12,bottom:12,width:2,background:'var(--border)',zIndex:0}} />
                {statusOptions.map((s, idx) => {
                  const currentIndex = statusOptions.indexOf(grievance.status)
                  const isCompleted = idx < currentIndex
                  const isCurrent = s === grievance.status
                  return (
                    <div key={s} style={{position:'relative',zIndex:1}}>
                      <button
                        className={`btn btn-sm ${isCurrent?'btn-primary':'btn-ghost'}`}
                        style={{justifyContent:'flex-start',width:'100%',paddingLeft:'36px',borderRadius:0,background:isCurrent?'var(--accent)':'transparent',border:'none'}}
                        onClick={()=>handleStatus(s)} disabled={isCurrent}>
                        <div style={{position:'absolute',left:8,width:24,height:24,borderRadius:'50%',background:isCompleted?'var(--green)':isCurrent?'var(--accent)':'var(--bg-elevated)',border:isCompleted?'2px solid var(--green)':isCurrent?'2px solid var(--accent)':'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {isCompleted?<MdCheckCircle size={14} color='#fff' />:isCurrent?<div style={{width:8,height:8,borderRadius:'50%',background:'#fff'}} />:null}
                        </div>
                        <span style={{fontSize:'0.8rem',fontWeight:isCurrent?700:500}}>{s}</span>
                        {isCurrent && <span style={{marginLeft:'auto',fontSize:'0.6rem',opacity:0.7}}>Current</span>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}


          
          <div className="panel">
            <div className="section-label" style={{marginBottom:'0.75rem'}}><MdAssignment size={13} /> Case Summary</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {label:'Case No.',value:grievance.case_number,mono:true,color:'var(--accent)'},
                {label:'Filed',value:new Date(grievance.submission_date).toLocaleDateString('en-PH')},
                {label:'Days Open',value:`${grievance.days_open}d`},
                {label:'Hearings',value:hearings.length},
                {label:'Summons',value:summons.length},
                {label:'Hearing Summaries',value:hearings.filter(h=>h.summary_id).length},
                {label:'Evidence Photos',value:attachments.length},
              ].map(item=>(
                <div key={item.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.8rem'}}>
                  <span style={{color:'var(--text-muted)'}}>{item.label}</span>
                  <span style={{fontWeight:700,color:item.color||'var(--text-primary)',fontFamily:item.mono?'var(--mono)':'inherit',fontSize:item.mono?'0.7rem':'inherit'}}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>


          {!isStudent() && hearings.filter(h=>h.summary_id).length>0 && (
            <div className="panel">
              <div className="section-label" style={{marginBottom:'0.75rem'}}><MdSummarize size={13}/> Hearing Summaries</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {hearings.filter(h=>h.summary_id).map(h=>(
                  <button key={h.hearing_id} className="btn btn-ghost btn-sm"
                    style={{justifyContent:'flex-start',width:'100%',fontSize:'0.76rem'}}
                    onClick={()=>{setActiveSummary(h);setActiveSummaryHearing(h)}}>
                    {h.summary_type==='completed'?<MdCheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />:<MdRefresh size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />} Hearing #{h.hearing_number} — {h.summary_type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      
      {printSummon && <SummonPrint summon={printSummon} grievance={grievance} onClose={()=>setPrintSummon(null)}/>}
      {activeSummary && (
        <HearingSummaryModal
          summary={activeSummary}
          grievance={grievance}
          hearing={activeSummaryHearing}
          onClose={()=>{setActiveSummary(null);setActiveSummaryHearing(null)}}
        />
      )}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  <MdWarning size={18} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--red)' }} /> Confirm Deletion
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  This action cannot be undone
                </div>
              </div>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', lineHeight: 1 }}>
                <MdClose size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '12px 14px', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--red)' }}>
                <strong>Warning:</strong> You are about to permanently delete case <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{grievance.case_number}</span>. All associated data including hearings, summons, and attachments will be lost.
              </div>
              <div className="form-group">
                <label className="form-label">Type the case ID to confirm <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  className="form-control"
                  placeholder={grievance.case_number}
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  style={{ fontFamily: 'var(--mono)' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleteConfirmText !== grievance.case_number}>
                <MdDelete size={14} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteSuccess && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-box" style={{ maxWidth: 380, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: 48, color: 'var(--green)', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Delete Successful</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The case has been permanently deleted.</p>
          </div>
        </div>
      )}
      <Toast toasts={toasts} removeToast={removeToast}/>
    </div>
  )
}
