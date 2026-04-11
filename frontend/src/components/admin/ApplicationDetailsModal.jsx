import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/index'
import Button from '../ui/Button'
import loanService, { formatINR } from '../../services/loanService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ApplicationDetailsModal({ open, loan, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    if (open && loan?.id) {
      loadDetails()
    }
  }, [open, loan?.id])

  const loadDetails = async () => {
    try {
      setLoading(true)
      const res = await loanService.getApplicationDetails(loan.id)
      setDetails(res.data)
    } catch (error) {
      console.error('Failed to load details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    try {
      setRejecting(true)
      await loanService.updateApplicationStatus(loan.id, 'rejected', rejectReason)
      setShowRejectDialog(false)
      setRejectReason('')
      onStatusChange('rejected', rejectReason)
      onClose()
    } catch (error) {
      console.error('Failed to reject application:', error)
      alert('Failed to reject application')
    } finally {
      setRejecting(false)
    }
  }

  const handleApprove = async () => {
    try {
      setRejecting(true)
      await loanService.updateApplicationStatus(loan.id, 'approved', '')
      onStatusChange('approved')
      onClose()
    } catch (error) {
      console.error('Failed to approve application:', error)
      alert('Failed to approve application')
    } finally {
      setRejecting(false)
    }
  }

  if (!loan) return null

  return (
    <>
      <Modal open={open} onClose={onClose} title="Application Details" maxWidth="max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">👤 User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{details.user.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{details.user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{details.user.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Member Since</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {new Date(details.user.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">📋 Loan Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Loan Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{details.loan.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Amount Requested</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatINR(details.loan.requested_amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                  <div className="mt-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      details.loan.status === 'approved' ? 'bg-green-50 text-green-700' :
                      details.loan.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {details.loan.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Applied On</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {new Date(details.loan.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              {details.loan.reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-700">⚠️ Rejection Reason:</p>
                  <p className="mt-1 text-sm text-red-600">{details.loan.reason}</p>
                </div>
              )}
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">💳 Payment Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Payment</p>
                  <div className="mt-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      details.payment.completed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {details.payment.completed ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Amount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {details.payment.amount ? formatINR(details.payment.amount / 100) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">📄 Uploaded Documents</h3>
              {details.documents.length === 0 ? (
                <p className="text-sm text-slate-500">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {details.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.type}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.size ? `${(doc.size / 1024).toFixed(0)}KB` : ''} • {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          if (doc.file_path) {
                            const fullUrl = doc.file_path.startsWith('http') 
                              ? doc.file_path 
                              : `${API_BASE_URL}${doc.file_path}`
                            window.open(fullUrl, '_blank')
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Close
              </Button>
              {!['approved', 'rejected'].includes(details.loan.status) && (
                <>
                  <Button variant="success" className="flex-1" onClick={handleApprove} disabled={rejecting}>
                    ✓ Approve
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={() => setShowRejectDialog(true)}>
                    ✗ Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>Failed to load application details</p>
          </div>
        )}
      </Modal>

      <Modal open={showRejectDialog} onClose={() => !rejecting && setShowRejectDialog(false)} 
        title="Reject Application" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-2">
              Reason for Rejection <span className="text-red-600">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              disabled={rejecting}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRejectDialog(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
              {rejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
