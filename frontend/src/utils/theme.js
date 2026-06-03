
export const THEMES = [
  { id: 'light',     label: 'Light',      emoji: '☀️',  desc: 'Clean & professional' },
  { id: 'dark',      label: 'Dark',       emoji: '🌙',  desc: 'Easy on the eyes' },
  { id: 'midnight',  label: 'Midnight',   emoji: '🔵',  desc: 'Deep navy blue' },
  { id: 'forest',    label: 'Forest',     emoji: '🌿',  desc: 'Calm green tones' },
  { id: 'crimson',   label: 'Crimson',    emoji: '🔴',  desc: 'Bold & intense' },
]

export function getTheme() {
  return localStorage.getItem('gms_theme') || 'light'
}
export function setTheme(t) {
  localStorage.setItem('gms_theme', t)
  applyTheme(t)
}
export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
}
