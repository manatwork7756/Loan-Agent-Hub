import React from 'react'

const badgeVariants = {
  default: 'bg-slate-100 text-slate-600',
  blue:    'bg-blue-50 text-blue-700',
  green:   'bg-green-50 text-green-700',
  red:     'bg-red-50 text-red-700',
  amber:   'bg-amber-50 text-amber-700',
  indigo:  'bg-indigo-50 text-indigo-700',
  purple:  'bg-purple-50 text-purple-700',
}

export function Badge({ children, variant = 'default', dot, className = '' }) {
  return (
    <span className={[
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      badgeVariants[variant],
      className,
    ].join(' ')}>
      {dot && (
        <span className={[
          'w-1.5 h-1.5 rounded-full',
          variant === 'green' ? 'bg-green-500' :
          variant === 'red'   ? 'bg-red-500' :
          variant === 'amber' ? 'bg-amber-500' : 'bg-slate-400',
        ].join(' ')} />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    approved:   { variant: 'green',  label: 'Approved' },
    locked:     { variant: 'indigo', label: 'Locked' },
    rejected:   { variant: 'red',    label: 'Rejected' },
    initiated:  { variant: 'default',label: 'Initiated' },
    kyc_pending:{ variant: 'amber',  label: 'KYC Pending' },
    kyc_done:   { variant: 'blue',   label: 'KYC Done' },
    underwriting:{ variant: 'purple',label: 'Underwriting' },
    negotiation:{ variant: 'blue',   label: 'Negotiation' },
    sanction:   { variant: 'green',  label: 'Sanctioned' },
    pending:    { variant: 'amber',  label: 'Pending' },
  }
  const cfg = map[status] || { variant: 'default', label: status }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white border border-slate-100 rounded-xl shadow-card p-5',
        hover ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg-card' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, accentColor }) {
  return (
    <div className={[
      'bg-white border border-slate-100 rounded-xl p-4 shadow-card',
      accentColor ? `border-l-4 border-l-[${accentColor}]` : '',
    ].join(' ')}>
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="font-head text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={['relative bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]', maxWidth].join(' ')}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h3 className="font-head text-base font-700 text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-4' : 'w-7 h-7 border-3'
  return (
    <span className={[s, 'border-slate-200 border-t-blue-600 rounded-full'].join(' ')}
      style={{ display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  )
}

export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}
