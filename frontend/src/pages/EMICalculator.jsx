import React, { useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Topbar from '../components/layout/Topbar'
import { Card } from '../components/ui/index.jsx'
import { useEMI } from '../hooks/useEMI'
import { formatINR } from '../services/loanService'

const formatEMI = (n) => {
  if (!n && n !== 0) return '—'
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const LOAN_RATES = [
  { name: 'Gold Loan',       icon: '💰', rate: 7.5  },
  { name: 'Education Loan',  icon: '🎓', rate: 7.8  },
  { name: 'Home Loan',       icon: '🏠', rate: 8.4  },
  { name: 'Car Loan',        icon: '🚗', rate: 9.25 },
  { name: 'Personal Loan',   icon: '👤', rate: 10.5 },
  { name: 'Business Loan',   icon: '💼', rate: 12.0 },
]

function SliderField({ label, value, display, min, max, step, onChange }) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value.toString())

  const handleClick = () => {
    setIsEditing(true)
    setInputValue(value.toString())
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    let numValue = parseFloat(inputValue) || 0
    
    numValue = Math.max(min, Math.min(max, numValue))
    
    const steps = Math.round(numValue / step)
    numValue = steps * step
    
    onChange(numValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {isEditing ? (
          <input
            type="number"
            autoFocus
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 text-right"
          />
        ) : (
          <span 
            onClick={handleClick}
            className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          >
            {display}
          </span>
        )}
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{typeof min === 'number' && min >= 1000 ? formatINR(min) : min}</span>
        <span>{typeof max === 'number' && max >= 1000 ? formatINR(max) : max}</span>
      </div>
    </div>
  )
}

function DonutChart({ principal, interest }) {
  const total = principal + interest
  const pPct = (principal / total) * 100
  const iPct = (interest / total) * 100
  const r = 54
  const circ = 2 * Math.PI * r
  const pDash = (pPct / 100) * circ
  const iDash = (iPct / 100) * circ
  const gap = circ - pDash - iDash

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#E2E8F0" strokeWidth="14" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#3B82F6" strokeWidth="14"
          strokeDasharray={`${pDash} ${iDash + gap}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#8B5CF6" strokeWidth="14"
          strokeDasharray={`${iDash} ${pDash + gap}`}
          strokeDashoffset={circ * 0.25 - pDash}
          strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-[10px] text-slate-400">Total</div>
        <div className="font-head text-xs font-bold text-slate-800">{formatINR(principal + interest)}</div>
      </div>
    </div>
  )
}

export default function EMICalculator() {
  const { principal, setPrincipal, annualRate, setAnnualRate, months, setMonths,
    emi, total, interest, formatted } = useEMI()

  return (
    <AppLayout>
      <Topbar title="EMI Calculator" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 flex-wrap items-start">

          <Card className="flex-1 min-w-[300px]">
            <h3 className="font-head text-base font-bold text-slate-900 mb-6">Calculate Your EMI</h3>

            <SliderField
              label="Loan Amount"
              value={principal}
              display={formatted.principal}
              min={50000} max={10000000} step={1000}
              onChange={setPrincipal}
            />
            <SliderField
              label="Interest Rate (p.a.)"
              value={annualRate}
              display={`${annualRate}%`}
              min={6} max={24} step={0.01}
              onChange={setAnnualRate}
            />
            <SliderField
              label="Tenure"
              value={months}
              display={`${months} months`}
              min={6} max={360} step={6}
              onChange={setMonths}
            />

            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl p-5 mt-2">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Monthly EMI</p>
              <p className="font-head text-4xl font-extrabold text-white mb-5">{formatEMI(emi)}</p>
              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                {[
                  { label: 'Principal', value: formatted.principal, color: 'text-blue-400' },
                  { label: 'Total Interest', value: formatted.interest, color: 'text-purple-400' },
                  { label: 'Total Payable', value: formatted.total, color: 'text-white' },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">{f.label}</p>
                    <p className={`text-sm font-bold ${f.color}`}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-5 min-w-[260px] flex-1 max-w-[340px]">

            <Card>
              <h3 className="font-head text-sm font-bold text-slate-800 mb-5">Payable Breakup</h3>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <DonutChart principal={principal} interest={interest} />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-600">Principal Amount</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{formatted.principal}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-600">Total Interest</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{formatted.interest}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-head text-sm font-bold text-slate-800 mb-3">Quick Rate Presets</h3>
              <div className="space-y-1.5">
                {LOAN_RATES.map((l) => (
                  <button
                    key={l.name}
                    onClick={() => setAnnualRate(l.rate)}
                    className={[
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                      annualRate === l.rate
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'hover:bg-slate-50 text-slate-600',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.icon}</span>
                      <span>{l.name}</span>
                    </span>
                    <span className="font-bold text-xs">{l.rate}%</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
