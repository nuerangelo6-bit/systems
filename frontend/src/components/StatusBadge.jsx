import React from 'react'

const map = {
  'Submitted': 'badge-submitted',
  'Under Review': 'badge-review',
  'Hearing Scheduled': 'badge-hearing',
  'Resolved': 'badge-resolved',
  'Rejected': 'badge-rejected',
  'Closed': 'badge-closed',
}

export default function StatusBadge({ status }) {
  return <span className={`badge ${map[status] || 'badge-closed'}`}>{status}</span>
}
