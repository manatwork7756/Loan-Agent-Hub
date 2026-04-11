import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Topbar from '../components/layout/Topbar'
import ChatWindow from '../components/chat/ChatWindow'
import Button from '../components/ui/Button'
import useChatStore from '../store/useChatStore'

const PHASE_LABELS = {
  greeting:           '💬 Getting Started',
  show_loans:         '💰 Exploring Loans',
  loan_details:       '📋 Loan Details',
  bank_account:       '🏦 Bank Info',
  income_check:       '💼 Income Check',
  collateral_check:   '🏠 Collateral',
  eligibility_result: '✅ Eligibility',
  doc_upload_intro:   '📄 Documents',
  doc_collection:     '📎 Collecting Docs',
  payment_pending:    '💳 Payment',
  completed:          '🎉 Completed',
}

export default function Chat() {
  const location = useLocation()
  const selectedLoan = location.state?.selectedLoan || null
  const { resetChat, phase, paymentComplete, setSelectedLoan } = useChatStore()

  useEffect(() => {
    if (selectedLoan) {
      setSelectedLoan(selectedLoan)
    }
  }, [selectedLoan, setSelectedLoan])

  return (
    <AppLayout>
      <Topbar
        title="AI Loan Assistant"
        subtitle={PHASE_LABELS[phase] || ''}
        actions={
          <div className="flex items-center gap-2">
            {paymentComplete && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                ✓ Payment Done
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={resetChat}>
              ↺ New Chat
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </AppLayout>
  )
}
