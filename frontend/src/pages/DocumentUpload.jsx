import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Topbar    from '../components/layout/Topbar'
import Button    from '../components/ui/Button'
import documentService from '../services/documentService'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('rzp-script')) { resolve(true); return }
    const script  = document.createElement('script')
    script.id     = 'rzp-script'
    script.src    = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}


function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
        <span>Upload Progress</span>
        <span className={pct === 100 ? 'text-green-600 font-bold' : ''}>
          {done} / {total} documents
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-500"
          style={{
            width:      `${pct}%`,
            background: pct === 100 ? '#16a34a' : '#3b82f6',
          }}
        />
      </div>
    </div>
  )
}


function DocumentRow({ doc, index, onUpload, onRemove, uploading }) {
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(0)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProgress(0)
    await onUpload(doc.name, file, (p) => setProgress(p))
    setProgress(0)
    e.target.value = ''
  }

  const isUploading = uploading === doc.name

  return (
    <div
      className={[
        'flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200',
        doc.uploaded
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm',
      ].join(' ')}
    >
      <div
        className={[
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all',
          doc.uploaded ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500',
        ].join(' ')}
      >
        {doc.uploaded ? '✓' : index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className={['text-sm font-semibold truncate', doc.uploaded ? 'text-green-800' : 'text-slate-800'].join(' ')}>
          {doc.name}
        </p>
        {doc.uploaded && doc.file_name && (
          <p className="text-xs text-green-600 truncate mt-0.5">
            📎 {doc.file_name}
          </p>
        )}
        {isUploading && progress > 0 && (
          <div className="mt-1.5 w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {doc.uploaded ? (
          <>
            {doc.file_url && (
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${doc.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline font-medium px-2 py-1"
              >
                View
              </a>
            )}
            <button
              onClick={() => onRemove(doc.name)}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
              title="Remove and re-upload"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                isUploading
                  ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95',
              ].join(' ')}
            >
              {isUploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>⬆ Upload</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}


function PaymentModal({ open, loanId, onSuccess, onClose }) {
  const [step, setStep]       = useState('idle')
  const [error, setError]     = useState('')
  const [rzpReady, setRzpReady] = useState(false)

  useEffect(() => {
    if (open) {
      loadRazorpayScript().then(setRzpReady)
      setStep('idle')
      setError('')
    }
  }, [open])

  const handlePay = async () => {
    setStep('loading')
    setError('')
    try {
      const { data } = await documentService.createRazorpayOrder(loanId)

      if (!rzpReady || !window.Razorpay) {
        setError('Razorpay could not load. Check your internet connection.')
        setStep('error')
        return
      }

      const options = {
        key:         data.key_id,
        amount:      data.amount,
        currency:    data.currency,
        name:        'CredoAI',
        description: 'Document Processing Fee',
        order_id:    data.order_id,
        prefill: {
          name:    '',
          email:   '',
          contact: '',
        },
        theme: { color: '#3b82f6' },
        method: {
          upi:         true,
          card:        true,
          netbanking:  true,
          wallet:      false,
        },
        handler: async (response) => {
          setStep('loading')
          try {
            await documentService.verifyRazorpayPayment(
              loanId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
            await documentService.submitApplication(loanId)
            setStep('done')
            setTimeout(() => onSuccess(), 1500)
          } catch (err) {
            setError(err?.response?.data?.detail || 'Payment verification failed. Contact support.')
            setStep('error')
          }
        },
        modal: {
          ondismiss: () => {
            if (step === 'paying') setStep('idle')
          },
        },
      }

      setStep('paying')
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed. Please try again.')
        setStep('error')
      })
      rzp.open()

    } catch (err) {
      const msg = err?.response?.data?.detail || 'Could not create payment order. Please try again.'
      setError(msg)
      setStep('error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Document Processing Fee</h2>
              <p className="text-blue-100 text-sm mt-0.5">One-time fee to submit your application</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl p-1">✕</button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center gap-3 bg-blue-50 rounded-xl px-6 py-5 mb-6">
            <span className="text-4xl">💳</span>
            <div>
              <p className="text-3xl font-extrabold text-blue-700">₹199</p>
              <p className="text-xs text-slate-500 mt-0.5">One-time fee • Non-refundable</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {[
              'Document verification & processing',
              'Application forwarded to loan officer',
              'Status updates via dashboard',
              'Support for faster disbursal',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-green-500 font-bold">✓</span>
                {item}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6 justify-center">
            {['UPI', 'Credit Card', 'Debit Card', 'Net Banking'].map((m) => (
              <span key={m} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">
                {m}
              </span>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              ⚠ {error}
            </div>
          )}

          {step === 'done' ? (
            <div className="text-center py-2">
              <div className="text-5xl mb-2">🎉</div>
              <p className="font-bold text-green-700 text-lg">Payment Successful!</p>
              <p className="text-sm text-slate-500">Submitting your application…</p>
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={step === 'loading' || step === 'paying'}
              className={[
                'w-full py-3.5 rounded-xl font-bold text-white text-base transition-all active:scale-95',
                step === 'loading' || step === 'paying'
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200',
              ].join(' ')}
            >
              {step === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing…
                </span>
              ) : step === 'paying' ? (
                'Complete payment in Razorpay…'
              ) : (
                'Pay ₹199 via Razorpay'
              )}
            </button>
          )}

          <p className="text-center text-xs text-slate-400 mt-3">
            Secured by Razorpay • 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  )
}


export default function DocumentUpload() {
  const { loanId }   = useParams()
  const navigate     = useNavigate()

  const [docData,     setDocData]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState('')
  const [toast,       setToast]       = useState(null)
  const [showPayment, setShowPayment] = useState(false)

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await documentService.getRequiredDocuments(loanId)
      setDocData(data)
    } catch (err) {
      showToast('error', err?.response?.data?.detail || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [loanId, showToast])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleUpload = async (docName, file, onProgress) => {
    setUploading(docName)
    try {
      await documentService.uploadDocument(loanId, docName, file, onProgress)
      showToast('success', `"${docName}" uploaded ✓`)
      await fetchDocs()
    } catch (err) {
      showToast('error', err?.response?.data?.detail || `Failed to upload "${docName}"`)
    } finally {
      setUploading('')
    }
  }

  const handleRemove = async (docName) => {
    try {
      await documentService.deleteDocument(loanId, docName)
      showToast('success', `"${docName}" removed`)
      await fetchDocs()
    } catch (err) {
      showToast('error', err?.response?.data?.detail || `Failed to remove "${docName}"`)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    showToast('success', 'Application submitted successfully! 🎉')
    // Notify Dashboard to refresh
    window.dispatchEvent(new Event('documentSubmitted'))
        fetchDocs()
    setTimeout(() => navigate('/dashboard'), 2500)
  }

  const uploadedCount = docData?.documents?.filter((d) => d.uploaded).length ?? 0
  const totalCount    = docData?.documents?.length ?? 0
  const allUploaded   = docData?.all_uploaded ?? false
  const paymentDone   = docData?.payment_done ?? false

  const loanTypeLabel = docData?.loan_type
    ? docData.loan_type.charAt(0).toUpperCase() + docData.loan_type.slice(1) + ' Loan'
    : 'Loan Application'

  return (
    <AppLayout>
      <Topbar
        title="Upload Documents"
        actions={
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ← Back to Applications
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">

        {toast && (
          <div
            className={[
              'fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all',
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white',
            ].join(' ')}
          >
            {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div
                className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full mx-auto mb-3"
                style={{ animation: 'spin 0.7s linear infinite', borderWidth: 3 }}
              />
              <p className="text-slate-400 text-sm">Loading required documents…</p>
            </div>
          </div>
        ) : !docData ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">😕</div>
            <p className="font-semibold">Could not load loan details</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              ← Back to Applications
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-widest font-semibold mb-1">
                    {loanTypeLabel}
                  </p>
                  <p className="text-2xl font-extrabold">
                    {docData.loan_amount
                      ? `₹${Number(docData.loan_amount).toLocaleString('en-IN')}`
                      : 'Amount —'}
                  </p>
                  {docData.loan_purpose && (
                    <p className="text-blue-200 text-sm mt-1">{docData.loan_purpose}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs uppercase tracking-widest font-semibold mb-1">
                    Status
                  </p>
                  <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                    {docData.loan_status || 'initiated'}
                  </span>
                </div>
              </div>
            </div>

            {paymentDone && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-bold text-green-800">Application Submitted!</p>
                  <p className="text-sm text-green-600">
                    Your documents and payment have been received. Our team will review and contact you soon.
                  </p>
                </div>
              </div>
            )}

            <ProgressBar done={uploadedCount} total={totalCount} />

            {!paymentDone && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <span className="text-lg">ℹ</span>
                <p className="text-sm text-amber-800">
                  Upload all {totalCount} required documents below. Accepted formats: PDF, JPG, PNG (max 10 MB each).
                  Once all are uploaded, pay ₹199 to submit your application.
                </p>
              </div>
            )}

            <div className="space-y-3 mb-8">
              {docData.documents.map((doc, i) => (
                <DocumentRow
                  key={doc.name}
                  doc={doc}
                  index={i}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                  uploading={uploading}
                />
              ))}
            </div>

            {!paymentDone && (
              <div
                className={[
                  'rounded-2xl border-2 p-6 text-center transition-all',
                  allUploaded
                    ? 'bg-green-50 border-green-300'
                    : 'bg-slate-50 border-slate-200 opacity-60',
                ].join(' ')}
              >
                {allUploaded ? (
                  <>
                    <div className="text-4xl mb-2">🎯</div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">All documents uploaded!</h3>
                    <p className="text-slate-500 text-sm mb-5">
                      Pay the one-time processing fee of <strong className="text-slate-800">₹199</strong> to submit your application.
                    </p>
                    <button
                      onClick={() => setShowPayment(true)}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl text-base shadow-lg shadow-green-200 active:scale-95 transition-all"
                    >
                      💳 Pay ₹199 & Submit Application
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📤</div>
                    <p className="text-slate-500 text-sm">
                      Upload <strong>{totalCount - uploadedCount}</strong> more document
                      {totalCount - uploadedCount !== 1 ? 's' : ''} to unlock submission
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        loanId={loanId}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    </AppLayout>
  )
}
