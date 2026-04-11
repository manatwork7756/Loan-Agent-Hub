import React from 'react'
import { StatusBadge } from '../ui/index.jsx'
import { formatINR } from '../../services/loanService'

export default function LoanStatusCard({ app }) {
  if (!app) return null
  const total = app.monthly_emi && app.tenure_months
    ? app.monthly_emi * app.tenure_months : null
  const interest = total && app.approved_amount
    ? total - app.approved_amount : null

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-6 py-5 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Loan Application</p>
            <h3 className="font-head text-lg font-bold capitalize">
              {app.loan_type} Loan
            </h3>
          </div>
          <StatusBadge status={app.status} />
        </div>
        {app.lock_id && (
          <div>
            <p className="text-xs text-white/40 mb-1">Lock ID</p>
            <span className="font-mono text-sm font-bold text-blue-300 bg-blue-900/40 px-3 py-1 rounded-lg">
              {app.lock_id}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
        <Field label="Requested" value={formatINR(app.requested_amount)} />
        <Field label="Approved" value={formatINR(app.approved_amount)} highlight />
        <Field label="Interest Rate" value={app.interest_rate ? `${app.interest_rate}% p.a.` : '—'} />
        <Field label="Tenure" value={app.tenure_months ? `${app.tenure_months} months` : '—'} />
        <Field label="Monthly EMI" value={formatINR(app.monthly_emi)} highlight />
        <Field label="Credit Score" value={app.credit_score || '—'}
          sub={app.credit_score >= 750 ? '● Excellent' : app.credit_score >= 700 ? '● Good' : app.credit_score >= 650 ? '● Fair' : '● Below avg'}
          subColor={app.credit_score >= 750 ? 'text-green-600' : app.credit_score >= 700 ? 'text-lime-600' : 'text-amber-600'}
        />
        {total && <Field label="Total Payable" value={formatINR(total)} />}
        {interest && <Field label="Total Interest" value={formatINR(interest)} />}
        <Field label="Risk Level" value={app.risk_level ? app.risk_level.charAt(0).toUpperCase() + app.risk_level.slice(1) : '—'} />
      </div>

      {(app.kyc_name || app.kyc_email) && (
        <div className="border-t border-slate-100 px-6 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">KYC Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {app.kyc_name && <Field label="Name" value={app.kyc_name} />}
            {app.kyc_email && <Field label="Email" value={app.kyc_email} />}
            {app.monthly_income && <Field label="Monthly Income" value={formatINR(app.monthly_income)} />}
          </div>
        </div>
      )}

      {app.rejection_reason && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{app.rejection_reason}</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, highlight, sub, subColor }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={['font-semibold', highlight ? 'text-blue-700 text-base' : 'text-slate-800 text-sm'].join(' ')}>
        {value ?? '—'}
      </p>
      {sub && <p className={`text-xs mt-0.5 ${subColor || 'text-slate-400'}`}>{sub}</p>}
    </div>
  )
}
