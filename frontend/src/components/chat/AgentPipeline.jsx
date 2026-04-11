import React from 'react'
import useChatStore from '../../store/useChatStore'

export default function AgentPipeline() {
  const steps = useChatStore((s) => s.getPipelineStatus())

  return (
    <div className="flex items-center gap-0 overflow-x-auto px-4 pb-3 pt-2">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center min-w-[90px]">
            <div className={[
              'w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300',
              step.done
                ? 'bg-blue-600 text-white shadow-sm'
                : step.active
                ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]'
                : 'bg-slate-100 text-slate-400 border border-slate-200',
            ].join(' ')}>
              {step.done ? '✓' : step.icon}
            </div>
            <span className={[
              'text-[10px] mt-1.5 text-center leading-tight font-medium',
              step.done   ? 'text-blue-600' :
              step.active ? 'text-slate-900' :
                            'text-slate-400',
            ].join(' ')}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={[
              'flex-1 h-0.5 mb-5 min-w-[24px] transition-all duration-500',
              step.done ? 'bg-blue-600' : 'bg-slate-200',
            ].join(' ')} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
