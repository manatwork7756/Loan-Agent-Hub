import React, { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Topbar    from '../components/layout/Topbar'
import { Card }  from '../components/ui/index.jsx'
import Input     from '../components/ui/Input'
import Button    from '../components/ui/Button'
import { formatINR } from '../services/loanService'
import api       from '../services/api'

const NAVY = '#0F172A'


const PROVIDERS = [
  {
    id:      'cibil',
    name:    'CIBIL',
    full:    'TransUnion CIBIL',
    tagline: 'India\'s most trusted credit bureau',
    badge:   'Most Popular',
    badgeColor: 'bg-blue-600',
    icon:    '🏛️',
    color:   '#1d4ed8',
    bg:      'from-blue-600 to-blue-800',
    score_range: '300 – 900',
    free:    true,
    note:    '1 free report per year',
    url:     'https://www.cibil.com/freecibilscore',
    steps:   ['Enter Name & PAN', 'Verify with OTP', 'View your score free'],
  },
  {
    id:      'experian',
    name:    'Experian',
    full:    'Experian India',
    tagline: 'Global bureau with detailed insights',
    badge:   'Free Forever',
    badgeColor: 'bg-emerald-600',
    icon:    '🌐',
    color:   '#059669',
    bg:      'from-emerald-600 to-teal-700',
    score_range: '300 – 850',
    free:    true,
    note:    'Unlimited free checks',
    url:     'https://www.experian.in/consumer/free-credit-score.html',
    steps:   ['Register free account', 'Enter PAN details', 'Instant score access'],
  },
  {
    id:      'bankbazaar',
    name:    'BankBazaar',
    full:    'BankBazaar.com',
    tagline: 'Free CIBIL score with improvement tips',
    badge:   'Free',
    badgeColor: 'bg-orange-600',
    icon:    '🏦',
    color:   '#ea580c',
    bg:      'from-orange-500 to-red-600',
    score_range: '300 – 900',
    free:    true,
    note:    'Instant score with tips',
    url:     'https://www.bankbazaar.com/cibil.html',
    steps:   ['Quick registration', 'PAN + OTP', 'Free CIBIL score'],
  },
  {
    id:      'onescore',
    name:    'OneScore',
    full:    'OneScore App',
    tagline: 'Mobile-first credit score monitoring',
    badge:   '100% Free',
    badgeColor: 'bg-cyan-600',
    icon:    '📱',
    color:   '#0891b2',
    bg:      'from-cyan-600 to-sky-700',
    score_range: '300 – 900',
    free:    true,
    note:    'Always free, no credit card',
    url:     'https://www.onescore.in/',
    steps:   ['Download app / open web', 'Verify PAN & mobile', 'Live score tracking'],
  },
  {
    id:      'cred',
    name:    'CRED',
    full:    'CRED App',
    tagline: 'Score monitoring with rewards',
    badge:   'App Only',
    badgeColor: 'bg-gray-700',
    icon:    '⭐',
    color:   '#374151',
    bg:      'from-gray-700 to-gray-900',
    score_range: '300 – 900',
    free:    true,
    note:    'CIBIL score + CRED rewards',
    url:     'https://cred.club/',
    steps:   ['Download CRED app', 'Register with mobile', 'Track score + earn rewards'],
  },
]


const BANDS = [
  { min: 750, label: 'Excellent',     color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  bar: 'bg-green-500'  },
  { min: 700, label: 'Good',          color: '#65a30d', bg: 'bg-lime-50',   border: 'border-lime-200',   text: 'text-lime-800',   bar: 'bg-lime-500'   },
  { min: 650, label: 'Fair',          color: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  bar: 'bg-amber-500'  },
  { min: 600, label: 'Below Average', color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', bar: 'bg-orange-500' },
  { min: 300, label: 'Poor',          color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    bar: 'bg-red-500'    },
]

function getMeta(score) {
  return BANDS.find((b) => score >= b.min) || BANDS[BANDS.length - 1]
}


function ScoreGauge({ score }) {
  const [disp, setDisp] = useState(300)
  const meta = getMeta(score)

  useEffect(() => {
    let cur = 300
    const step = Math.max(1, Math.ceil((score - 300) / 55))
    const t = setInterval(() => {
      cur = Math.min(cur + step, score)
      setDisp(cur)
      if (cur >= score) clearInterval(t)
    }, 18)
    return () => clearInterval(t)
  }, [score])

  const pct     = Math.min(1, Math.max(0, (disp - 300) / 600))
  const SWEEP   = 220
  const START   = 160
  const R       = 72
  const CX = CY = 90

  const toRad = (d) => (d * Math.PI) / 180
  const pt    = (a) => ({
    x: CX + R * Math.cos(toRad(a)),
    y: CY + R * Math.sin(toRad(a)),
  })

  const arc = (a1, a2) => {
    const s = pt(a1), e = pt(a2)
    const la = (a2 - a1) > 180 ? 1 : 0
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${la} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
  }

  const fillEnd = START + SWEEP * pct
  const dotPt   = pt(fillEnd)

  return (
    <div className="flex flex-col items-center select-none">
      <svg width="180" height="120" viewBox="0 0 180 120">
        <path d={arc(START, START + SWEEP)} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round"/>
        {[
          [0,    0.20, '#dc2626'],
          [0.20, 0.40, '#ea580c'],
          [0.40, 0.60, '#d97706'],
          [0.60, 0.80, '#65a30d'],
          [0.80, 1.00, '#16a34a'],
        ].map(([f, t, c]) => (
          <path key={c} d={arc(START + SWEEP*f, START + SWEEP*t)}
            fill="none" stroke={c} strokeWidth="12" strokeLinecap="butt" opacity="0.2"/>
        ))}
        <path d={arc(START, Math.max(START + 0.01, fillEnd))}
          fill="none" stroke={meta.color} strokeWidth="12" strokeLinecap="round"
          style={{ transition: 'all 0.02s linear' }}/>
        <circle cx={dotPt.x} cy={dotPt.y} r="6" fill={meta.color}/>
        <text x={CX} y={CY+4} textAnchor="middle" fontSize="28" fontWeight="800"
          fontFamily="'Syne',sans-serif" fill={meta.color}>{disp}</text>
        <text x={CX} y={CY+20} textAnchor="middle" fontSize="9"
          fontFamily="sans-serif" fill="#94a3b8">out of 900</text>
      </svg>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${meta.bg} ${meta.text} border ${meta.border}`}>
        {meta.label}
      </span>
    </div>
  )
}


function ProviderCard({ p, onSelect }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
         onClick={() => onSelect(p)}>

      <div className={`bg-gradient-to-br ${p.bg} p-5 relative`}>
        <div className="flex items-start justify-between">
          <div className="text-3xl">{p.icon}</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${p.badgeColor} bg-opacity-90`}>
            {p.badge}
          </span>
        </div>
        <h3 className="text-white font-bold text-lg mt-3 font-head">{p.name}</h3>
        <p className="text-white/70 text-xs mt-0.5">{p.tagline}</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Score range</span>
          <span className="font-mono font-semibold text-slate-700">{p.score_range}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Cost</span>
          <span className="font-semibold text-green-700">🆓 {p.note}</span>
        </div>

        <div className="space-y-1 pt-1 border-t border-slate-50">
          {p.steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: p.color + '20', color: p.color }}>
                {i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>

        <button
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all
                     group-hover:brightness-110 active:scale-95"
          style={{ background: p.color }}
        >
          Check Free Score →
        </button>
      </div>
    </div>
  )
}


function LaunchModal({ provider, onConfirm, onClose }) {
  if (!provider) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        <div className={`bg-gradient-to-br ${provider.bg} px-6 py-5 text-white`}>
          <div className="text-4xl mb-2">{provider.icon}</div>
          <h2 className="font-head text-xl font-bold">{provider.full}</h2>
          <p className="text-white/70 text-sm mt-1">{provider.tagline}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">What happens next</p>
            {provider.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: provider.color }}>
                  {i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-400 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <span className="text-blue-500 flex-shrink-0">ℹ</span>
            <span>
              You'll open <strong className="text-slate-600">{provider.full}</strong> in a new tab.
              After checking your score, come back here and enter it below to get
              personalised loan matches.
            </span>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: provider.color }}>
              Open {provider.name} ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function ManualScorePanel({ savedScore, onSave }) {
  const [val, setVal]       = useState(savedScore || '')
  const [source, setSource] = useState('')
  const [saved, setSaved]   = useState(false)
  const meta                = val && val >= 300 && val <= 900 ? getMeta(Number(val)) : null

  const handleSave = () => {
    const n = Number(val)
    if (!n || n < 300 || n > 900) return
    onSave(n, source)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card className="border-2 border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg flex-shrink-0">
          ✏️
        </div>
        <div>
          <h3 className="font-head text-sm font-bold text-slate-900">Enter Your Score</h3>
          <p className="text-xs text-slate-500">Got your score from a bureau? Save it here for loan matching</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            label="Your Credit Score"
            type="number"
            placeholder="e.g. 742"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            hint="Enter the score shown on your bureau report (300–900)"
          />
          {meta && (
            <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border ${meta.bg} ${meta.border}`}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className={`text-xs font-bold ${meta.text}`}>{meta.label}</span>
              <span className="text-xs text-slate-500 ml-auto">{meta.label === 'Excellent' || meta.label === 'Good' ? '✅ Eligible for best rates' : '⚠ Limited loan options'}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Source (optional)</label>
          <div className="flex flex-wrap gap-2">
            {['CIBIL', 'Experian', 'Paisabazaar', 'BankBazaar', 'Other'].map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  source === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant={saved ? 'success' : 'primary'}
          fullWidth
          onClick={handleSave}
          disabled={!val || val < 300 || val > 900}
        >
          {saved ? '✓ Score Saved!' : 'Save My Score'}
        </Button>
      </div>
    </Card>
  )
}


function SavedScoreCard({ score, source, date, onClear }) {
  const meta = getMeta(score)
  return (
    <Card className={`border-2 ${meta.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-head text-sm font-bold text-slate-900">Your Credit Score</h3>
        <button onClick={onClear}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50">
          Update ✕
        </button>
      </div>

      <ScoreGauge score={score} />

      <div className="mt-4 space-y-2">
        {[
          { label: 'Status',  value: meta.label, color: meta.text },
          { label: 'Source',  value: source || 'Self-reported' },
          { label: 'Checked', value: date ? new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'Today' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className={`font-semibold ${color || 'text-slate-800'}`}>{value}</span>
          </div>
        ))}
      </div>

      <div className={`mt-4 rounded-xl p-3 ${meta.bg} border ${meta.border}`}>
        <p className={`text-xs font-medium ${meta.text}`}>
          {score >= 750
            ? '🎯 You qualify for the best interest rates. Apply for loans with confidence!'
            : score >= 700
            ? '✅ Good score. Competitive rates are available across most loan types.'
            : score >= 650
            ? '⚠️ Fair score. Standard rates apply. Reducing existing debt will help.'
            : '📉 Consider improving your score before applying for large loans.'}
        </p>
      </div>
    </Card>
  )
}


function QuickEstimator() {
  const [income, setIncome] = useState('')
  const [loan,   setLoan]   = useState('')
  const [emi,    setEmi]    = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const calc = () => {
    if (!income || !loan) return
    setLoading(true)
    setTimeout(() => {
      const inc = parseFloat(income), ln = parseFloat(loan), ex = parseFloat(emi) || 0
      const ltv = ln / (inc * 12), dti = ex / inc
      let base = 780
      if      (ltv > 5)   base -= 100
      else if (ltv > 3)   base -= 60
      else if (ltv > 1)   base -= 20
      else                base += 20
      if      (dti > 0.5) base -= 80
      else if (dti > 0.3) base -= 40
      else if (dti > 0.1) base -= 10
      const jitter = Math.floor(Math.random() * 20 - 10)
      const score = Math.min(850, Math.max(500, base + jitter))
      setResult({ score, dti: (dti * 100).toFixed(1), ltv: ltv.toFixed(2), inc, ln })
      setLoading(false)
    }, 900)
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧮</span>
        <div>
          <h3 className="font-head text-sm font-bold text-slate-900">Quick Estimator</h3>
          <p className="text-xs text-slate-400">Can't check now? Get an indicative score</p>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <Input label="Monthly Income (₹)" type="number" placeholder="50000"
          value={income} onChange={(e) => setIncome(e.target.value)} />
        <Input label="Loan Amount Needed (₹)" type="number" placeholder="500000"
          value={loan} onChange={(e) => setLoan(e.target.value)} />
        <Input label="Existing EMIs / mo (₹)" type="number" placeholder="0"
          value={emi} onChange={(e) => setEmi(e.target.value)} />
      </div>
      <Button variant="secondary" fullWidth loading={loading} onClick={calc} size="sm">
        {loading ? 'Estimating…' : 'Estimate Score'}
      </Button>
      {result && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Estimated Score</span>
            <span className="font-head text-xl font-extrabold" style={{ color: getMeta(result.score).color }}>
              ~{result.score}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Debt-to-Income</span><span className="font-semibold text-slate-700">{result.dti}%</span>
          </div>
          <p className="text-[11px] text-slate-400 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-2">
            ⚠ This is an estimate only. Check your real score from a bureau above.
          </p>
        </div>
      )}
    </Card>
  )
}


const STORAGE_KEY = 'credoai_credit_score'

export default function CreditScore() {
  const [activeProv,  setActiveProv]  = useState(null)
  const [savedData,   setSavedData]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null } catch { return null }
  })
  const [tab, setTab] = useState('providers')

  const handleProviderSelect = (p) => setActiveProv(p)

  const handleLaunch = () => {
    window.open(activeProv.url, '_blank', 'noopener,noreferrer')
    setActiveProv(null)
    setTimeout(() => setTab('entry'), 800)
  }

  const handleSaveScore = (score, source) => {
    const data = { score, source, date: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setSavedData(data)
    setTab('providers')
  }

  const handleClearScore = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSavedData(null)
  }

  return (
    <AppLayout>
      <Topbar title="Credit Score" />
      <div className="flex-1 overflow-y-auto">

        <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] px-6 py-8">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/5" />
          <div className="absolute -right-8 -top-8  w-48 h-48 rounded-full border border-white/5" />

          <div className="relative flex flex-wrap items-center gap-6 max-w-4xl">
            <div className="flex-1 min-w-[220px]">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-2">Free Credit Score</p>
              <h1 className="font-head text-2xl font-extrabold text-white leading-tight">
                Check Your Real<br/>CIBIL Score — Free
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">
                Choose any provider below. All are 100% free. Soft enquiry only — your score won't drop.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-green-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Soft pull — score safe
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  100% free
                </div>
                <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Results in 2 minutes
                </div>
              </div>
            </div>

            {savedData && (
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl px-6 py-4 text-center min-w-[160px]">
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Your Score</p>
                <p className="font-head text-4xl font-extrabold"
                  style={{ color: getMeta(savedData.score).color }}>
                  {savedData.score}
                </p>
                <p className="text-white/60 text-xs mt-1">{getMeta(savedData.score).label}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto">

          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 max-w-xs">
            {[
              { key: 'providers', label: '🏦 Get Score' },
              { key: 'entry',     label: '✏️ Enter Score' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={[
                  'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                  tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-6 flex-wrap items-start">

            <div className="flex-1 min-w-[300px]">

              {tab === 'providers' && (
                <>
                  {/* How to use */}
                  <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6">
                    {['1. Pick a provider', '2. Check your score free', '3. Come back & save it here'].map((s, i) => (
                      <React.Fragment key={s}>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 font-medium">{s.slice(3)}</span>
                        </div>
                        {i < 2 && <span className="text-slate-300 hidden sm:block">→</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PROVIDERS.map((p) => (
                      <ProviderCard key={p.id} p={p} onSelect={handleProviderSelect} />
                    ))}
                  </div>
                </>
              )}

              {tab === 'entry' && (
                <div className="max-w-md">
                  {savedData ? (
                    <div className="space-y-4">
                      <SavedScoreCard
                        score={savedData.score}
                        source={savedData.source}
                        date={savedData.date}
                        onClear={handleClearScore}
                      />
                      <div className="text-center">
                        <p className="text-sm text-slate-500 mb-3">Want to update your score?</p>
                        <Button variant="secondary" size="sm" onClick={handleClearScore}>
                          Enter New Score
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-2xl">👆</span>
                        <div>
                          <p className="text-sm font-bold text-amber-900">Haven't checked yet?</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Switch to the <strong>"Get Score"</strong> tab, visit any free provider,
                            then come back here to enter your score.
                          </p>
                        </div>
                      </div>
                      <ManualScorePanel savedScore={savedData?.score} onSave={handleSaveScore} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-72 flex-shrink-0 space-y-5">

              {savedData && tab === 'providers' && (
                <SavedScoreCard
                  score={savedData.score}
                  source={savedData.source}
                  date={savedData.date}
                  onClear={handleClearScore}
                />
              )}

              <QuickEstimator />

              <Card>
                <h3 className="font-head text-sm font-bold text-slate-800 mb-4">Improve Your Score</h3>
                <ul className="space-y-2.5">
                  {[
                    'Pay every EMI on time — even 1 miss drops score by 50–100 pts',
                    'Keep credit card usage below 30% of your limit',
                    'Avoid multiple loan applications at the same time',
                    'Maintain older credit accounts — age matters',
                    'Check your bureau report for errors every 6 months',
                  ].map((tip, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold
                                      flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h3 className="font-head text-sm font-bold text-slate-800 mb-3">Score Bands</h3>
                <div className="space-y-2">
                  {BANDS.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: b.color }} />
                      <div className="flex-1 flex justify-between items-center">
                        <span className={`text-xs font-semibold ${savedData && getMeta(savedData.score).label === b.label ? b.text : 'text-slate-700'}`}>
                          {b.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {b.min}+
                        </span>
                      </div>
                      {savedData && getMeta(savedData.score).label === b.label && (
                        <span className="text-[10px] font-bold" style={{ color: b.color }}>◀ You</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <LaunchModal
        provider={activeProv}
        onConfirm={handleLaunch}
        onClose={() => setActiveProv(null)}
      />
    </AppLayout>
  )
}
