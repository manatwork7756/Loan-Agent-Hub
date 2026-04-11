import React from 'react'

export default function Topbar({ title, subtitle, actions }) {
  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="font-head text-[15px] font-bold text-slate-900 leading-none">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  )
}
