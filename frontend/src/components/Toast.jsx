import React, { useEffect } from 'react'
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md'

export default function Toast({ toasts, removeToast }) {
  useEffect(() => {
    toasts.forEach(t => {
      const timer = setTimeout(() => removeToast(t.id), 3500)
      return () => clearTimeout(timer)
    })
  }, [toasts])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type || 'success'}`}>
          {t.type === 'error' ? <MdError size={16} /> : t.type === 'info' ? <MdInfo size={16} /> : <MdCheckCircle size={16} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}>
            <MdClose size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
