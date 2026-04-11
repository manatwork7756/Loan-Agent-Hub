import api from './api'

const loanService = {
  getActiveProducts:       ()        => api.get('/loan/products'),

  getUserApplications:     ()        => api.get('/loan/user'),
  getLoanStatus:           (id)      => api.get(`/loan/status/${id}`),
  applyLoan:               (data)    => api.post('/loan/apply', data),
  calculateEMI: (principal, annualRate, tenureMonths) =>
    api.post('/loan/emi', { principal, annual_rate: annualRate, tenure_months: tenureMonths }),
  getCreditScore: (monthlyIncome, loanAmount, existingEmi = 0) =>
    api.get('/loan/credit-score', {
      params: { monthly_income: monthlyIncome, loan_amount: loanAmount, existing_emi: existingEmi },
    }),

  getAllApplications:       ()        => api.get('/admin/applications'),
  getApplicationDetails:    (id)      => api.get(`/admin/applications/${id}/details`),
  updateApplicationStatus: (id, status, reason) =>
    api.put(`/admin/applications/${id}`, { status, reason }),
  deleteApplication:        (id)      => api.delete(`/admin/applications/${id}`),
  getAdminStats:           ()        => api.get('/admin/stats'),
  getAllUsers:              ()        => api.get('/admin/users'),
  adminDeleteUser:          (id)      => api.delete(`/admin/users/${id}`),

  adminListSchemes:        ()        => api.get('/admin/schemes'),
  adminGetScheme:          (id)      => api.get(`/admin/schemes/${id}`),
  adminCreateScheme:       (data)    => api.post('/admin/schemes', data),
  adminUpdateScheme:       (id, data)=> api.put(`/admin/schemes/${id}`, data),
  adminToggleScheme:       (id)      => api.patch(`/admin/schemes/${id}/toggle`),
  adminDeleteScheme:       (id)      => api.delete(`/admin/schemes/${id}`),
}

export function calcEMI(principal, annualRate, months) {
  if (!principal || !months || !annualRate) return 0
  const r = annualRate / 12 / 100
  if (r === 0) return Math.round(principal / months)
  return Math.round(
    (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  )
}

export function formatINR(n) {
  if (!n && n !== 0) return '—'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default loanService
