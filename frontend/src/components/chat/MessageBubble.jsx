import React from 'react'
import useAuthStore from '../../store/useAuthStore'

const AGENT_CONFIG = {
  loan_agent:    { label: 'CredoAI • Loan Advisor',  initials: 'LA', av: 'av-loan',   tag: 'tag-loan' },
  doc_collector: { label: 'Document Collector',     initials: 'DC', av: 'av-docs',   tag: 'tag-docs' },
  master:        { label: 'LoanAI',                 initials: 'AI', av: 'av-master', tag: 'tag-master' },
}

export default function MessageBubble({ message }) {
  const { user } = useAuthStore()
  if (message.role === 'user') return <UserBubble message={message} user={user} />
  return <AgentBubble message={message} />
}

function UserBubble({ message, user }) {
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
  return (
    <div className="flex gap-3 justify-end animate-fade-up max-w-[800px] ml-auto">
      <div className="flex flex-col gap-1 items-end max-w-[520px]">
        <span className="text-[10px] text-slate-400">{message.timestamp}</span>
        <div className="bg-[#0F172A] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-white text-xs font-bold font-head flex-shrink-0 mt-1">
        {initials}
      </div>
    </div>
  )
}

function AgentBubble({ message }) {
  const agent = AGENT_CONFIG[message.agent] || AGENT_CONFIG.loan_agent

  const formatted = message.content
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      const content = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)

      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-3 list-disc">{content.slice(1)}</li>
      }
      if (line.trim() === '') return <br key={i} />
      return <span key={i} className="block">{content}</span>
    })

  return (
    <div className="flex gap-3 animate-fade-up max-w-[800px]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold font-head flex-shrink-0 mt-1 ${agent.av}`}>
        {agent.initials}
      </div>
      <div className="flex flex-col gap-1.5 max-w-[580px]">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${agent.tag}`}>
            {agent.label}
          </span>
          <span className="text-[10px] text-slate-400">{message.timestamp}</span>
        </div>
        <div className="bg-white border border-slate-100 shadow-card rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 leading-relaxed">
          {formatted}
        </div>
        {message.loanSnapshot && <LoanSummaryCard data={message.loanSnapshot} />}
      </div>
    </div>
  )
}

function LoanSummaryCard({ data }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mt-1">
      <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1">
        <span>🎉</span> Application Submitted
      </p>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        {data.loan_type && <Row label="Loan Type" value={cap(data.loan_type) + ' Loan'} />}
        {data.monthly_income && <Row label="Monthly Income" value={'Rs.' + Number(data.monthly_income).toLocaleString('en-IN')} />}
        {data.bank_name && <Row label="Bank" value={data.bank_name} />}
        {data.employment_type && <Row label="Employment" value={cap(data.employment_type)} />}
      </div>
      <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-blue-600 font-medium">
        ✅ Documents received · Payment confirmed · Application under review
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
