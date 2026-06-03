import React from 'react'
import { MdClose, MdCheck } from 'react-icons/md'
import { THEMES, setTheme, getTheme } from '../utils/theme'

const PREVIEWS = {
  light:    { bg: '#f0f2f8', card: '#fff',    accent: '#3b5bdb', text: '#0f1530' },
  dark:     { bg: '#0c0e1a', card: '#111422', accent: '#5271ff', text: '#e8eaf6' },
  midnight: { bg: '#060b18', card: '#0a1225', accent: '#4a9eff', text: '#c8d8f8' },
  forest:   { bg: '#0a1a0f', card: '#0f2218', accent: '#2ecc71', text: '#c8f0d8' },
  crimson:  { bg: '#180a0a', card: '#250f0f', accent: '#ff5555', text: '#f8d8d8' },
}

export default function ThemePicker({ current, onSelect, onClose }) {
  return (
    <div className="theme-picker-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="theme-picker-box">
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>🎨 Choose Theme</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Select your preferred look</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', lineHeight: 1 }}>
            <MdClose size={16} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {THEMES.map(t => {
            const p = PREVIEWS[t.id]
            const isActive = current === t.id
            return (
              <div key={t.id}
                className={`theme-card ${isActive ? 'active' : ''}`}
                onClick={() => { setTheme(t.id); onSelect(t.id) }}>
                
                <div style={{ width: 52, height: 36, borderRadius: 6, background: p.bg, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 6, background: p.card, borderRadius: 3 }} />
                  <div style={{ position: 'absolute', top: 14, left: 4, width: 16, height: 16, background: p.accent, borderRadius: 3 }} />
                  <div style={{ position: 'absolute', top: 16, left: 24, right: 4, height: 4, background: p.text, borderRadius: 2, opacity: 0.5 }} />
                  <div style={{ position: 'absolute', top: 22, left: 24, right: 8, height: 3, background: p.text, borderRadius: 2, opacity: 0.25 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{t.emoji}</span> {t.label}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 1 }}>{t.desc}</div>
                </div>
                {isActive && (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MdCheck size={13} color="#fff" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
