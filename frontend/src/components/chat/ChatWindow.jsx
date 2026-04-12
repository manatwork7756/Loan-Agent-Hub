import React, { useEffect, useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import AgentPipeline from './AgentPipeline'
import PaymentModal from './PaymentModal'
import FileUploadButton from './FileUploadButton'
import useChatStore from '../../store/useChatStore'
import useAuthStore from '../../store/useAuthStore'
import { useAgent } from '../../hooks/useAgent'

const AGENT_CONFIG = {
  loan_agent:    { label: 'CredoAI • Loan Advisor', av: 'av-loan',   initials: 'LA' },
  doc_collector: { label: 'Document Collector',    av: 'av-docs',   initials: 'DC' },
  master:        { label: 'LoanAI',                av: 'av-master', initials: 'AI' },
}

function TypingIndicator() {
  const { messages } = useChatStore()
  const lastAgent = messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.agent || 'loan_agent'
  const agent = AGENT_CONFIG[lastAgent] || AGENT_CONFIG.loan_agent

  return (
    <div className="flex gap-3 animate-fade-up">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold font-head flex-shrink-0 mt-1 ${agent.av}`}>
        {agent.initials}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-slate-400">{agent.label}</span>
        <div className="bg-white border border-slate-100 shadow-card rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex gap-1 items-center">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomePrompt({ onSend }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl mb-5 shadow-lg">
        🤖
      </div>
      <h2 className="font-head text-xl font-bold text-slate-900 mb-2">
        Meet CredoAI, your Loan Advisor
      </h2>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
        Our AI loan agent will guide you through finding the perfect loan, checking eligibility,
        and completing your application — all in one conversation.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
        {[
          { icon: '🏠', label: 'Home Loan', text: 'I want to buy a house, need a home loan' },
          { icon: '👤', label: 'Personal Loan', text: 'I need a personal loan of 5 lakhs' },
          { icon: '🚗', label: 'Car Loan', text: 'I want to buy a car, need a car loan' },
          { icon: '💼', label: 'Business Loan', text: 'Need funds to expand my business' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => onSend(item.text)}
            className="flex items-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 text-left shadow-sm"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function DocCollectionHelper() {
  const { phase, loanApplicationId } = useChatStore()
  const { sendMessage } = useAgent()

  if (phase !== 'doc_collection') return null

  const handleUploaded = (docType, fileName) => {
    sendMessage(`I have uploaded my ${docType.replace(/_/g, ' ')}: ${fileName}`)
  }

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mx-6 mb-3">
      <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1">
        <span>📎</span> Quick File Upload
      </p>
      <div className="flex flex-wrap gap-2">
        <FileUploadButton
          docType="aadhaar_image"
          label="Aadhaar Card"
          onUploaded={handleUploaded}
        />
        <FileUploadButton
          docType="collateral_document"
          label="Collateral Doc"
          onUploaded={handleUploaded}
        />
      </div>
      <p className="text-[10px] text-amber-600 mt-2">
        Accepted: JPG, PNG, PDF · Max 5MB
      </p>
    </div>
  )
}

export default function ChatWindow() {
  const bottomRef = useRef(null)
  const { messages, isTyping, phase, selectedLoan, addMessage, setTyping, sessionId } = useChatStore()
  const { sendMessage, triggerAgent } = useAgent()
  const { user } = useAuthStore()
  const userName = user?.name || 'User'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (messages.length === 0) {
      console.log('🔄 Initializing chat with selectedLoan:', selectedLoan?.name || 'none')
      initializeChat()
    }
  }, [selectedLoan?.id])

  const initializeChat = async () => {
    console.log('📞 Calling initializeChat...')
    console.log('   selectedLoan:', selectedLoan?.name || 'none')
    console.log('   userName:', userName)
    
    setTyping(true)
    try {
      const requestBody = {
        message: "",
        session_id: sessionId,
        selected_loan: selectedLoan || null,
        username: userName,
      }
      
      console.log('📤 Sending request to backend:', JSON.stringify(requestBody, null, 2))
      
      // Use the chat service API
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://credoai-backend.onrender.com'
      const res = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      
      console.log('📥 Backend response:', data)
      console.log('   Response type:', typeof data)
      console.log('   Keys:', Object.keys(data))

      // Handle response content - the backend returns either 'response' or 'reply'
      const responseContent = data.response || data.reply || "No response received"

      addMessage({
        role: 'assistant',
        content: String(responseContent) + (data.extra ? "\n\n" + String(data.extra) : ""),
        agent: 'loan_agent'
      })
      
      console.log('✅ Message added to chat')
    } catch (err) {
      console.error("❌ Chat init error:", err)
      addMessage({
        role: 'assistant',
        content: "⚠️ Error initializing chat. Please try again: " + err.message,
        agent: 'loan_agent'
      })
    } finally {
      setTyping(false)
    }
  }

  const handlePaymentSuccess = useCallback(() => {
    sendMessage('I have completed the PayPal payment for the document processing fee.')
  }, [sendMessage])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-slate-100">
        <AgentPipeline />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.length === 0 && !isTyping && !selectedLoan ? (
          <WelcomePrompt onSend={sendMessage} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <DocCollectionHelper />

      <ChatInput onSend={sendMessage} disabled={isTyping} />

      <PaymentModal onPaymentSuccess={handlePaymentSuccess} />
    </div>
  )
}
