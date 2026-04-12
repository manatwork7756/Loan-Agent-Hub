import { useCallback } from 'react'
import useChatStore from '../store/useChatStore'
import useAuthStore from '../store/useAuthStore'

export function useAgent() {
  const {
    sessionId,
    isTyping,
    setTyping,
    addMessage,
    selectedLoan,
  } = useChatStore()

  const { user } = useAuthStore()
  const userName = user?.name || 'User'

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isTyping) return

    addMessage({
      role: 'user',
      content: text
    })

    setTyping(true)

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://credoai-backend.onrender.com'
      
      const res = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          selected_loan: selectedLoan || null,
          username: userName,
        })
      })

      if (!res.ok) {
        throw new Error("Server error")
      }

      const data = await res.json()

      addMessage({
        role: 'assistant',
        content: String(data.response || data.reply || "No response from server") +
                 (data.extra ? "\n\n" + String(data.extra) : ""),
        agent: 'loan_agent'
      })

    } catch (err) {
      console.error("Chatbot error:", err)

      addMessage({
        role: 'assistant',
        content: "⚠️ Chatbot connection error. Please try again.",
        agent: 'loan_agent'
      })
    } finally {
      setTyping(false)
    }

  }, [isTyping, sessionId, addMessage, setTyping, selectedLoan, userName])

  const triggerAgent = useCallback(async (autoText) => {
    await sendMessage(autoText)
  }, [sendMessage])

  return { sendMessage, triggerAgent, isTyping }
}