import React from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Topbar from '../components/layout/Topbar'
import { StatCard, Card } from '../components/ui/index.jsx'
import Button from '../components/ui/Button'
import useAuthStore from '../store/useAuthStore'
import useLoanStore from '../store/useLoanStore'

const LOAN_HIGHLIGHTS = [
  { icon: '🏠', name: 'Home Loan',     rate: '8.4%',  max: '₹2 Cr',  color: 'from-blue-600 to-blue-700' },
  { icon: '👤', name: 'Personal Loan', rate: '10.5%', max: '₹25 L',  color: 'from-violet-600 to-violet-700' },
  { icon: '🚗', name: 'Car Loan',      rate: '9.25%', max: '₹50 L',  color: 'from-emerald-600 to-teal-700' },
]

const HOW_IT_WORKS = [
  { step: 1, icon: '💬', label: 'Chat with CredoAI',     desc: 'Our AI loan advisor finds the perfect loan for you' },
  { step: 2, icon: '✅', label: 'Eligibility Check',   desc: 'Quick questions to confirm you qualify' },
  { step: 3, icon: '📄', label: 'Upload Documents',    desc: 'Guided one-by-one document collection' },
  { step: 4, icon: '🎉', label: 'Application Done',    desc: 'Pay ₹199 fee and your application is submitted' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { applications } = useLoanStore()

  const firstName = user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const approved = applications.filter((a) => ['approved', 'locked', 'kyc_pending'].includes(a.status)).length

  return (
    <AppLayout>
      <Topbar
        title="Overview"
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/chat')}>
            💬 Start Loan Application
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-7 overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute right-16 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-y-1/2" />
            <div className="relative">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{greeting}</p>
              <h2 className="font-head text-2xl font-extrabold text-white mb-2">
                Hello, {firstName} 👋
              </h2>
              <p className="text-sm text-white/55 mb-5 max-w-sm leading-relaxed">
                Your AI loan advisor CredoAI is ready. Get the perfect loan in minutes —
                eligibility check, documents, and UPI payment all in one chat.
              </p>
              <Button variant="primary" onClick={() => navigate('/chat')}>
                Start AI Loan Application →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📂" label="Applications"   value={applications.length} sub="Total submitted" />
            <StatCard icon="✅" label="Approved"       value={approved}            sub="Successfully sanctioned" />
            <StatCard icon="🤖" label="AI Agents"      value="3"                   sub="Loan · Docs · Chat" />
            <StatCard icon="⚡" label="Avg Time"       value="~5 min"              sub="End-to-end" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-head text-base font-bold text-slate-900">Loan Products</h3>
              <button onClick={() => navigate('/explore')} className="text-sm text-blue-600 hover:underline">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LOAN_HIGHLIGHTS.map((l) => (
                <div
                  key={l.name}
                  onClick={() => navigate('/chat')}
                  className={`bg-gradient-to-br ${l.color} rounded-xl p-5 text-white cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className="text-3xl mb-3">{l.icon}</div>
                  <div className="font-head font-bold text-base mb-1">{l.name}</div>
                  <div className="flex justify-between text-xs text-white/70 mt-3">
                    <span>From {l.rate} p.a.</span>
                    <span>Up to {l.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card>
            <h3 className="font-head text-base font-bold text-slate-900 mb-5">How It Works</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="flex flex-col items-center text-center">
                  <div className="relative w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-3">
                    {step.icon}
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden lg:block absolute left-full top-1/2 w-full h-0.5 bg-slate-100" />
                    )}
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mb-2">
                    {step.step}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">{step.label}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </AppLayout>
  )
}
