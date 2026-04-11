import React from 'react'
import { StatusBadge } from '../ui/index.jsx'
import { formatINR } from '../../services/loanService'

export default function LoanTable({ applications, onView }) {
  if (!applications?.length) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="text-5xl mb-3">📋</div>
        <p className="font-semibold text-slate-500 mb-1">No applications yet</p>
        <p className="text-sm">Start a conversation with the AI assistant to apply</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Lock ID', 'Type', 'Amount', 'Approved', 'Status', 'Score', 'Rate', 'EMI', 'Date'].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.loan_id || app.id || app._id}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => onView?.(app)}
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {app.lock_id || '—'}
                </span>
              </td>
              <td className="px-4 py-3 capitalize font-medium text-slate-700">
                {app.loan_type} Loan
              </td>
              <td className="px-4 py-3 font-semibold">{formatINR(app.requested_amount)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">
                {app.approved_amount ? formatINR(app.approved_amount) : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-4 py-3">
                {app.credit_score ? (
                  <span className={[
                    'font-bold text-sm',
                    app.credit_score >= 750 ? 'text-green-600' :
                    app.credit_score >= 700 ? 'text-lime-600' :
                    app.credit_score >= 650 ? 'text-amber-600' : 'text-red-500',
                  ].join(' ')}>
                    {app.credit_score}
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {app.interest_rate ? `${app.interest_rate}%` : '—'}
              </td>
              <td className="px-4 py-3 font-semibold text-blue-700">
                {app.monthly_emi ? formatINR(app.monthly_emi) + '/mo' : '—'}
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
