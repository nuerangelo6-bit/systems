import React from 'react'
import { MdClose, MdPrint, MdCheckCircle, MdLoop, MdCalendarToday, MdLocationOn, MdNotes } from 'react-icons/md'

export default function HearingSummaryModal({ summary, grievance, hearing, onClose }) {
  if (!summary) return null

  const isCompleted = summary.summary_type === 'completed'
  const isRescheduled = summary.summary_type === 'rescheduled'

  
  const preparedDate = summary.prepared_at
    ? new Date(summary.prepared_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'

  const handlePrint = () => {
    const hearingDateStr = hearing?.scheduled_date
      ? new Date(hearing.scheduled_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A'
    const hearingTimeStr = hearing?.scheduled_time ? hearing.scheduled_time.slice(0, 5) : 'N/A'
    const nextDateStr = summary.next_hearing_date
      ? new Date(summary.next_hearing_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'To be determined'
    const officerName = summary.prepared_by_name || 'Hearing Officer'
    const caseNum = summary.case_number || ''
    const hearingNum = summary.hearing_number || ''
    const subject = grievance?.subject || 'N/A'
    const complainant = grievance?.student_name || 'N/A'
    const respondent = grievance?.suspect_name || 'N/A'
    const venue = hearing?.venue || 'N/A'
    const outcomeNotes = summary.outcome_notes || 'No outcome notes provided.'
    const rescheduleReason = summary.reschedule_reason || 'No reason specified.'
    const nextTime = summary.next_hearing_time ? summary.next_hearing_time.slice(0, 5) : 'TBD'
    const nextVenue = summary.next_venue || 'TBD'
    const stampText = isCompleted ? 'HEARING COMPLETED' : 'HEARING RESCHEDULED'

    const html = `<!DOCTYPE html>
<html>
<head>
<title>Hearing Summary - ${caseNum}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
  .doc { padding: 2.5cm 3cm; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .school { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; }
  .office { font-size: 11pt; font-weight: bold; margin-top: 6px; text-transform: uppercase; }
  .doc-title { text-align: center; font-size: 15pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.1em; margin: 1.5rem 0 0.5rem; }
  .doc-sub { text-align: center; font-size: 11pt; margin-bottom: 1.5rem; }
  .stamp { text-align: center; margin-bottom: 1.5rem; }
  .stamp span { border: 2px solid #000; padding: 6px 18px; font-weight: bold; font-size: 12pt; letter-spacing: 0.1em; }
  .section { margin-bottom: 1.25rem; }
  .section-label { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; color: #444; }
  .row { display: flex; margin-bottom: 5px; font-size: 11pt; }
  .row-label { font-weight: bold; width: 170px; flex-shrink: 0; }
  .box { border: 1px solid #000; padding: 1rem; margin: 0.5rem 0; min-height: 70px; font-size: 11pt; line-height: 1.7; background: #fafafa; }
  .sig { display: flex; justify-content: space-between; margin-top: 3rem; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #000; width: 200px; margin: 1.5rem auto 4px; }
  .sig-name { font-weight: bold; font-size: 11pt; }
  .sig-title { font-size: 10pt; }
  .footer { margin-top: 2rem; text-align: center; font-size: 9pt; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    <div class="school">Agusan Del Sur State College of Agriculture and Technology</div>
    <div style="font-size:10pt;margin-top:3px;">Bunawan, Agusan del Sur, Philippines</div>
    <div class="office">Office of Student Affairs and Services</div>
    <div style="font-size:10pt;">Student Grievance and Disciplinary Committee</div>
  </div>

  <div class="doc-title">Hearing Summary Report</div>
  <div class="doc-sub">Case No.: <strong style="font-family:Courier New,monospace;">${caseNum}</strong> &nbsp;&middot;&nbsp; Hearing #${hearingNum}</div>

  <div class="stamp"><span>${isCompleted ? '&#10003;' : '&#8635;'} ${stampText}</span></div>

  <div class="section">
    <div class="section-label">Case Information</div>
    <div class="row"><span class="row-label">Case Number:</span><span>${caseNum}</span></div>
    <div class="row"><span class="row-label">Subject:</span><span>${subject}</span></div>
    <div class="row"><span class="row-label">Complainant:</span><span>${complainant}</span></div>
    <div class="row"><span class="row-label">Respondent:</span><span>${respondent}</span></div>
  </div>

  <div class="section">
    <div class="section-label">Hearing Details</div>
    <div class="row"><span class="row-label">Hearing Number:</span><span>Hearing #${hearingNum}</span></div>
    <div class="row"><span class="row-label">Date Conducted:</span><span>${hearingDateStr}</span></div>
    <div class="row"><span class="row-label">Time:</span><span>${hearingTimeStr}</span></div>
    <div class="row"><span class="row-label">Venue:</span><span>${venue}</span></div>
    <div class="row"><span class="row-label">Outcome:</span><span>${isCompleted ? 'Completed' : 'Rescheduled'}</span></div>
  </div>

  ${isCompleted ? `
  <div class="section">
    <div class="section-label">Outcome / Resolution Notes</div>
    <div class="box">${outcomeNotes}</div>
  </div>
  ` : ''}

  ${isRescheduled ? `
  <div class="section">
    <div class="section-label">Reason for Rescheduling</div>
    <div class="box">${rescheduleReason}</div>
  </div>
  <div class="section">
    <div class="section-label">Next Hearing Schedule</div>
    <div class="row"><span class="row-label">New Date:</span><span>${nextDateStr}</span></div>
    <div class="row"><span class="row-label">New Time:</span><span>${nextTime}</span></div>
    <div class="row"><span class="row-label">New Venue:</span><span>${nextVenue}</span></div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-label">Prepared By</div>
    <div class="row"><span class="row-label">Hearing Officer:</span><span>${officerName}</span></div>
    <div class="row"><span class="row-label">Date Prepared:</span><span>${preparedDate}</span></div>
  </div>

  <div class="sig">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">${officerName}</div>
      <div class="sig-title">Hearing Officer</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">Noted by:</div>
      <div class="sig-title">Director, Student Affairs</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">Received by:</div>
      <div class="sig-title">Date: _______________</div>
    </div>
  </div>

  <div class="footer">GrievanceMS &middot; ASSCAT &middot; Official when signed by authorized officers</div>
</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=820,height=960')
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 350)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        
        <div className="modal-header">
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.67rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}>
              {summary.case_number} &middot; Hearing #{summary.hearing_number}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isCompleted
                ? <><span style={{ color: 'var(--green)' }}>✅</span> Hearing Summary — Completed</>
                : <><span style={{ color: 'var(--orange)' }}>🔄</span> Hearing Summary — Rescheduled</>
              }
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={handlePrint}><MdPrint size={13} /> Print</button>
            <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', lineHeight: 1 }}>
              <MdClose size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{
            background: isCompleted ? 'var(--green-bg)' : 'var(--orange-bg)',
            border: `1px solid ${isCompleted ? 'var(--green-border)' : 'var(--orange-border)'}`,
            borderRadius: 'var(--r-sm)', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            {isCompleted ? <MdCheckCircle size={18} color="var(--green)" /> : <MdLoop size={18} color="var(--orange)" />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isCompleted ? 'var(--green)' : 'var(--orange)' }}>
                {isCompleted ? 'Hearing Completed' : 'Hearing Rescheduled'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 1 }}>
                Prepared {preparedDate}{summary.prepared_by_name ? ` by ${summary.prepared_by_name}` : ''}
              </div>
            </div>
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="info-item">
              <div className="info-item-label">Hearing No.</div>
              <div className="info-item-value">Hearing #{summary.hearing_number}</div>
            </div>
            <div className="info-item">
              <div className="info-item-label">Date Held</div>
              <div className="info-item-value" style={{ fontSize: '0.78rem' }}>
                {hearing?.scheduled_date
                  ? new Date(hearing.scheduled_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A'}
                {hearing?.scheduled_time ? ` · ${hearing.scheduled_time.slice(0, 5)}` : ''}
              </div>
            </div>
            <div className="info-item">
              <div className="info-item-label">Complainant</div>
              <div className="info-item-value" style={{ fontSize: '0.82rem' }}>{grievance?.student_name || 'N/A'}</div>
            </div>
            <div className="info-item">
              <div className="info-item-label">Respondent</div>
              <div className="info-item-value" style={{ fontSize: '0.82rem', color: 'var(--purple)' }}>{grievance?.suspect_name || 'N/A'}</div>
            </div>
          </div>

          
          {isCompleted && (
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MdNotes size={12} /> Outcome / Resolution Notes
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', minHeight: 60 }}>
                {summary.outcome_notes || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No outcome notes recorded.</span>}
              </div>
            </div>
          )}

          
          {isRescheduled && (
            <>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Reason for Rescheduling
                </div>
                <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', borderRadius: 'var(--r-sm)', padding: '11px 14px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', minHeight: 50 }}>
                  {summary.reschedule_reason || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No reason specified.</span>}
                </div>
              </div>
              {summary.next_hearing_date && (
                <div style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-border)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--purple)', marginBottom: 8 }}>
                    📅 Next Hearing Schedule
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MdCalendarToday size={13} color="var(--purple)" />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {new Date(summary.next_hearing_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>🕐</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {summary.next_hearing_time ? summary.next_hearing_time.slice(0, 5) : 'TBD'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: '1 / -1' }}>
                      <MdLocationOn size={13} color="var(--purple)" />
                      <span style={{ color: 'var(--text-secondary)' }}>{summary.next_venue || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <MdPrint size={13} /> Print Summary
          </button>
        </div>
      </div>
    </div>
  )
}
