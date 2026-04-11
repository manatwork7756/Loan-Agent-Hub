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
  const userName = user?.name || 'friend'

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isTyping) return

    addMessage({
      role: 'user',
      content: text
    })

    setTyping(true)

    try {
      const res = await fetch("http://127.0.0.1:8000/chatbot/", {
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

      const data = await res.json()

      addMessage({
        role: 'assistant',
        content: data.reply + (data.extra ? "\n\n" + data.extra : ""),
        agent: 'loan_agent'
      })

    } catch (err) {
      console.error("Chatbot error:", err)

      addMessage({
        role: 'assistant',
        content: "⚠️ Chatbot connection error",
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