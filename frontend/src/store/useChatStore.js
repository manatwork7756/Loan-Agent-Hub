import { create } from 'zustand'

const AGENT_CONFIG = {
  loan_agent:    { name: 'CredoAI • Loan Advisor',    initials: 'LA', tag: 'tag-loan',    av: 'av-loan' },
  doc_collector: { name: 'Document Collector',       initials: 'DC', tag: 'tag-docs',    av: 'av-docs' },
  master:        { name: 'LoanAI Assistant',          initials: 'AI', tag: 'tag-master',  av: 'av-master' },
}

const PIPELINE_STEPS = [
  {
    id: 'loan_advisor',
    label: 'Loan Advisor',
    icon: '💬',
    phases: ['greeting', 'show_loans', 'loan_details', 'bank_account', 'income_check', 'collateral_check', 'eligibility_result'],
  },
  {
    id: 'doc_upload',
    label: 'Documents',
    icon: '📄',
    phases: ['doc_upload_intro', 'doc_collection'],
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: '💳',
    phases: ['payment_pending'],
  },
  {
    id: 'done',
    label: 'Complete',
    icon: '✅',
    phases: ['completed'],
  },
]

const useChatStore = create((set, get) => ({
  messages: [],
  sessionId: Date.now().toString(),
  phase: 'greeting',
  loanData: {},
  loanApplicationId: null,
  docRecordId: null,
  isTyping: false,
  agentConfig: AGENT_CONFIG,
  pipelineSteps: PIPELINE_STEPS,
  showPaymentModal: false,
  paymentComplete: false,
  selectedLoan: null,

  setSessionId: (id) => set({ sessionId: id }),
  setPhase: (phase) => set({ phase }),
  setLoanData: (data) => set((s) => ({ loanData: { ...s.loanData, ...data } })),
  setLoanApplicationId: (id) => set({ loanApplicationId: id }),
  setDocRecordId: (id) => set({ docRecordId: id }),
  setTyping: (v) => set({ isTyping: v }),
  setShowPaymentModal: (v) => set({ showPaymentModal: v }),
  setPaymentComplete: (v) => set({ paymentComplete: v }),
  setSelectedLoan: (loan) => set({ selectedLoan: loan }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          ...msg,
        },
      ],
    })),

  resetChat: () =>
    set({
      messages: [],
      sessionId: Date.now().toString(),
      phase: 'greeting',
      loanData: {},
      loanApplicationId: null,
      docRecordId: null,
      isTyping: false,
      showPaymentModal: false,
      paymentComplete: false,
      selectedLoan: null,
    }),

  getPipelineStatus: () => {
    const { phase } = get()
    const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.phases.includes(phase))
    return PIPELINE_STEPS.map((step, idx) => ({
      ...step,
      done: idx < currentStepIdx,
      active: idx === currentStepIdx,
    }))
  },

  getAgent: (agentKey) => AGENT_CONFIG[agentKey] || AGENT_CONFIG.loan_agent,
}))

export default useChatStore
