import api from './api'

const OPENROUTER_KEY   = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini'
const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions'

function buildFallbackPrompt(phase, loanData, userName) {
  const base = `You are CredoAI, a friendly professional Indian loan advisor.
Always reply with ONLY valid JSON: {"text":"...","action":"...","data":{}}.
Address user as ${userName}. Be warm and conversational like a real bank agent. Use Rs. and Indian context.`
  const d = JSON.stringify(loanData)

  const prompts = {
    greeting: `${base}
Greet warmly, introduce yourself as CredoAI an AI Loan Advisor. Make small talk. Ask what kind of loan they're looking for.
When ready set action="show_loans".`,

    show_loans: `${base}
Show available loan products in a friendly way. Available loans:
- Personal Loan: 10.5%–18%, up to Rs.25 lakh, 12–60 months, min income Rs.25k/month
- Home Loan: 8.4%–12.5%, up to Rs.2 crore, 5–30 years, min income Rs.40k/month
- Car Loan: 9.25%–14%, up to Rs.50 lakh, 1–7 years, min income Rs.30k/month
- Education Loan: 7.8%–13%, up to Rs.40 lakh, 1–15 years, no min income
- Business Loan: 12%–19.5%, up to Rs.75 lakh, 1–6 years, min income Rs.50k/month
- Gold Loan: 7.5%–12%, up to Rs.30 lakh, 3–36 months, no min income
Ask which one interests them. Set action="loan_selected" with data={loan_type:"...",product_name:"..."}.`,

    loan_details: `${base}
Current data: ${d}.
Explain the selected loan in detail. Cover interest rate range, maximum amount, tenure, EMI example.
Ask if they want to check their eligibility. Set action="check_eligibility" when they agree.`,

    bank_account: `${base}
Ask if they have a bank account for loan disbursement. Ask the bank name and account type (savings/current).
Set action="got_bank_info" with data={has_account:true/false,bank_name:"...",account_type:"..."}.`,

    income_check: `${base}
Ask their monthly income and whether they are salaried, self-employed, or a business owner.
Set action="income_verified" with data={monthly_income:number,employment_type:"...",income_eligible:true/false}.`,

    collateral_check: `${base}
Current data: ${d}.
For secured loans (home/car/gold) ask about the collateral asset and estimated value.
For unsecured loans (personal/education/business) say no collateral needed.
Set action="collateral_done" with data={collateral_required:bool,collateral_type:"...",collateral_value:number_or_null}.`,

    eligibility_result: `${base}
Data: ${d}.
Based on their income and the selected loan, assess eligibility.
If eligible: congratulate them warmly, state the estimated amount they qualify for, ask if they want to apply.
Set action="proceed_to_docs" if they want to apply.
If not eligible: explain kindly what the gap is. Set action="not_eligible".`,

    doc_upload_intro: `${base}
Tell the user we need some documents to process the application. List what we need:
PAN card number, bank account number, IFSC code, Aadhaar number, Aadhaar card image, and collateral document (if secured loan).
Mention there is a one-time document processing fee of Rs.199 payable via UPI before submission.
Ask if they agree to proceed. Set action="confirmed_doc_upload" if yes, action="declined_doc_upload" if no.`,

    doc_collection: `${base}
Data already collected: ${d}.
You are the Document Collector. Collect one document at a time in this order if not yet collected:
1. PAN number (format: ABCDE1234F — 5 letters, 4 digits, 1 letter)
2. Bank account number (9–18 digits, numbers only)
3. IFSC code (format: SBIN0001234 — 4 letters, 0, 6 alphanumeric chars)
4. Aadhaar number (exactly 12 digits)
5. Aadhaar card image (ask to upload the file)
6. Collateral document (only if collateral_required=true)
Validate each entry strictly. When a valid entry is provided set action="doc_collected" with data={field_name:"value",doc_type:"text"}.
When ALL required documents are collected set action="ready_for_payment".`,

    payment_pending: `${base}
All documents collected! Tell the user the final step is paying Rs.199 document processing fee via UPI.
The payment QR code and UPI options are shown on screen. Ask them to complete the payment.
Set action="payment_done" after they confirm payment.`,

    completed: `${base}
Data: ${d}. The loan application has been submitted successfully.
Congratulate warmly. Tell them: their application is under review, they'll receive updates via SMS and email within 2–3 business days.
Offer to help with anything else.`,
  }
  return prompts[phase] || prompts.greeting
}

function parseResponse(raw) {
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const s = clean.indexOf('{')
    const e = clean.lastIndexOf('}')
    if (s >= 0 && e > s) return JSON.parse(clean.slice(s, e + 1))
  } catch (_) {}
  return { text: raw, action: null, data: {} }
}

async function callOpenRouterDirect(msg, phase, loanData, history, userName) {
  if (!OPENROUTER_KEY) throw new Error('VITE_OPENROUTER_API_KEY not set in frontend/.env.local')
  const messages = [
    { role: 'system', content: buildFallbackPrompt(phase, loanData, userName) },
    ...history.slice(-10),
    { role: 'user', content: msg },
  ]
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer':  window.location.origin,
      'X-Title':       'CredoAI',
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, max_tokens: 1024, messages }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return parseResponse(data.choices?.[0]?.message?.content || '')
}

async function callBackend(sessionId, message, phase, loanData, loanApplicationId) {
  const res = await api.post('/chat/message', {
    session_id:          sessionId,
    message,
    phase,
    loan_data:           loanData,
    loan_application_id: loanApplicationId,
  })
  return res.data
}

const chatService = {
  startSession: () => api.post('/chat/start'),
  getHistory:   (sessionId) => api.get(`/chat/history?session_id=${sessionId}`),
  getDocStatus: (loanApplicationId) => api.get(`/chat/doc-status/${loanApplicationId}`),

  uploadDocument: async (loanApplicationId, docType, file) => {
    const form = new FormData()
    form.append('loan_application_id', loanApplicationId)
    form.append('doc_type', docType)
    form.append('file', file)
    const res = await api.post('/chat/upload-document', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  createPaymentOrder: (loanApplicationId) =>
    api.post('/payment/create-order', { loan_application_id: loanApplicationId }),

  verifyPayment: (data) =>
    api.post('/payment/verify', data),

  verifyRazorpayPayment: (data) =>
    api.post('/payment/verify-razorpay', data),

  sendMessage: async ({ sessionId, message, phase, loanData, loanApplicationId, history, userName }) => {
    try {
      if (sessionId) {
        return await callBackend(sessionId, message, phase, loanData, loanApplicationId)
      }
    } catch (backendErr) {
      console.warn('Backend unavailable, using direct OpenRouter:', backendErr.message)
      try {
        return await callOpenRouterDirect(message, phase, loanData, history || [], userName || 'friend')
      } catch (openRouterErr) {
        console.error('OpenRouter fallback also failed:', openRouterErr.message)
        return {
          text: `Hello ${userName || 'friend'}! I'm CredoAI, your loan advisor. I apologize, but I'm currently experiencing some technical difficulties with the AI service. Please try again in a few moments, or contact our support team for assistance.`,
          action: null,
          data: {},
          agent: 'loan_agent',
          phase: phase
        }
      }
    }
    try {
      return await callOpenRouterDirect(message, phase, loanData, history || [], userName || 'friend')
    } catch (openRouterErr) {
      console.error('Direct OpenRouter call failed:', openRouterErr.message)
      return {
        text: `Hello ${userName || 'friend'}! I'm CredoAI, your loan advisor. I apologize, but I'm currently experiencing some technical difficulties with the AI service. Please try again in a few moments, or contact our support team for assistance.`,
        action: null,
        data: {},
        agent: 'loan_agent',
        phase: phase
      }
    }
  },
}

export default chatService
