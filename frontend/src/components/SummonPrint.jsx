import React, { useRef } from 'react'
import { MdPrint, MdClose } from 'react-icons/md'

export default function SummonPrint({ summon, grievance, onClose }) {
  const handlePrint = () => {
    const printContent = document.getElementById('summon-print-content').innerHTML
    const win = window.open('', '_blank', 'width=800,height=900')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Summon - ${summon.case_number}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: white; padding: 0; }
            .summon-doc { padding: 2.5cm 2.5cm 2.5cm 3cm; min-height: 100vh; }
            .header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; }
            .school-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
            .school-address { font-size: 10pt; margin-top: 4px; }
            .office { font-size: 11pt; font-weight: bold; margin-top: 8px; text-transform: uppercase; }
            .doc-title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin: 2rem 0; text-decoration: underline; }
            .case-no { text-align: center; font-size: 11pt; margin-bottom: 2rem; }
            .body-text { text-align: justify; line-height: 1.8; margin-bottom: 1rem; font-size: 11pt; }
            .greeting { margin-bottom: 1.5rem; }
            .details-box { border: 1px solid #000; padding: 1rem 1.5rem; margin: 1.5rem 0; background: #f9f9f9; }
            .details-row { display: flex; margin-bottom: 6px; }
            .details-label { font-weight: bold; width: 160px; flex-shrink: 0; }
            .details-value { flex: 1; }
            .warning { font-weight: bold; font-style: italic; }
            .signature-section { margin-top: 3rem; }
            .signature-line { border-top: 1px solid #000; width: 220px; margin-top: 1.5rem; }
            .signature-name { font-weight: bold; font-size: 11pt; margin-top: 4px; }
            .signature-title { font-size: 10pt; }
            .footer { margin-top: 2rem; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 0.5rem; }
            .two-col { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 300)
  }

  const partyType = summon.party_type === 'complainant' ? 'Complainant' : 'Respondent'
  const hearingDate = summon.scheduled_date
    ? new Date(summon.scheduled_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'
  const hearingTime = summon.scheduled_time ? summon.scheduled_time.slice(0, 5) : 'TBD'
  const issuedDate = new Date(summon.issued_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20,
        width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>📨 Summon Letter Preview</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {partyType} — {summon.party_name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <MdPrint size={14} /> Print / Save PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <MdClose size={14} />
            </button>
          </div>
        </div>

        
        <div style={{ padding: '1.5rem' }}>
          <div id="summon-print-content">
            <div className="summon-doc" style={{ background: 'white', color: 'black', padding: '2.5cm', fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: 1.6 }}>
              
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Agusan Del Sur State College of Agriculture and Technology
                </div>
                <div style={{ fontSize: '10pt', marginTop: 4 }}>
                  Bunawan, Agusan del Sur, Philippines
                </div>
                <div style={{ fontWeight: 'bold', marginTop: 8, textTransform: 'uppercase', fontSize: '11pt' }}>
                  Office of Student Affairs and Services
                </div>
                <div style={{ fontSize: '10pt', color: '#555' }}>Student Grievance and Disciplinary Committee</div>
              </div>

              
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15pt', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1.5rem 0' }}>
                SUMMON
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '11pt' }}>
                Case No.: <strong style={{ fontFamily: 'Courier New, monospace' }}>{summon.case_number}</strong>
              </div>

              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem', fontSize: '11pt' }}>Date: {issuedDate}</div>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase' }}>
                  {summon.party_name}
                </div>
                <div style={{ fontSize: '11pt' }}>BSIT 2B</div>
                <div style={{ fontSize: '11pt' }}>Agusan Del Sur State College of Agriculture and Technology</div>
              </div>

              
              <div style={{ marginBottom: '1rem', fontSize: '11pt' }}>
                Dear <strong>{summon.party_name}</strong>,
              </div>

              
              <div style={{ textAlign: 'justify', fontSize: '11pt', lineHeight: 1.8, marginBottom: '1rem' }}>
                You are hereby officially <strong>SUMMONED</strong> to appear before the Student Grievance and
                Disciplinary Committee of Agusan Del Sur State College of Agriculture and Technology (ASSCAT)
                in connection with the following grievance case filed and recorded under this office.
              </div>
              <div style={{ textAlign: 'justify', fontSize: '11pt', lineHeight: 1.8, marginBottom: '1rem' }}>
                Your presence is required as the <strong>{partyType}</strong> in this matter. Failure to appear
                on the scheduled date without valid justification may result in the case being decided
                in your absence.
              </div>

              
              <div style={{ border: '1px solid black', padding: '1rem 1.5rem', margin: '1.5rem 0', background: '#f9f9f9' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '10pt', letterSpacing: '0.08em' }}>
                  Hearing Details
                </div>
                {[
                  { label: 'Case Number:', value: summon.case_number },
                  { label: 'Case Subject:', value: grievance?.subject || 'See file' },
                  { label: 'Your Role:', value: partyType },
                  { label: 'Hearing No.:', value: `Hearing #${summon.hearing_number}` },
                  { label: 'Date:', value: hearingDate },
                  { label: 'Time:', value: hearingTime },
                  { label: 'Venue:', value: summon.venue || 'TBD' },
                  ...(summon.party_type === 'complainant'
                    ? [{ label: 'Respondent:', value: grievance?.suspect_name || 'N/A' }]
                    : [{ label: 'Complainant:', value: grievance?.student_name || 'N/A' }]
                  ),
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', marginBottom: 6, fontSize: '11pt' }}>
                    <span style={{ fontWeight: 'bold', width: 160, flexShrink: 0 }}>{r.label}</span>
                    <span>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'justify', fontSize: '11pt', lineHeight: 1.8, marginBottom: '1rem', fontWeight: 'bold', fontStyle: 'italic' }}>
                Please bring this summon and any relevant documents or evidence you wish to present during
                the hearing. You have the right to be heard and to present your side of the case.
              </div>

              <div style={{ textAlign: 'justify', fontSize: '11pt', lineHeight: 1.8, marginBottom: '2rem' }}>
                For clarifications or concerns, please contact the Office of Student Affairs and Services
                immediately. Thank you for your cooperation.
              </div>

              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                <div>
                  <div style={{ borderTop: '1px solid black', width: 220, marginTop: '1.5rem' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '11pt', marginTop: 4 }}>Hearing Officer</div>
                  <div style={{ fontSize: '10pt' }}>Grievance Committee</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '1.5rem', fontSize: '11pt' }}>Received by:</div>
                  <div style={{ borderTop: '1px solid black', width: 200 }} />
                  <div style={{ fontSize: '10pt', marginTop: 4 }}>Signature over Printed Name</div>
                  <div style={{ fontSize: '10pt' }}>Date: _______________</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '9pt', color: '#777', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
                GrievanceMS v2 — ASSCAT | This document is official when signed by an authorized officer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
