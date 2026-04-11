import api from './api'

const documentService = {
  getRequiredDocuments: (loanId) =>
    api.get(`/documents/required/${loanId}`),

  uploadDocument: (loanId, documentName, file, onProgress) => {
    const form = new FormData()
    form.append('document_name', documentName)
    form.append('file', file)

    return api.post(`/documents/upload/${loanId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
  },

  deleteDocument: (loanId, documentName) =>
    api.delete(`/documents/${loanId}/${encodeURIComponent(documentName)}`),

  createRazorpayOrder: (loanApplicationId) =>
    api.post('/payment/create-razorpay-order', { loan_application_id: loanApplicationId }),

  verifyRazorpayPayment: (loanApplicationId, razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    api.post('/payment/verify-razorpay', {
      loan_application_id: loanApplicationId,
      razorpay_order_id:   razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature:  razorpaySignature,
    }),

  submitApplication: (loanId) =>
    api.post(`/documents/submit/${loanId}`),

  getPaymentStatus: (loanId) =>
    api.get(`/payment/status/${loanId}`),
}

export default documentService
