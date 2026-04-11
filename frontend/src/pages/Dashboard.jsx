import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Topbar from '../components/layout/Topbar'
import { StatCard, Card, Modal } from '../components/ui/index.jsx'
import Button from '../components/ui/Button'
import LoanTable from '../components/dashboard/LoanTable'
import LoanStatusCard from '../components/dashboard/LoanStatusCard'
import useLoanStore from '../store/useLoanStore'
import loanService from '../services/loanService'

export default function Dashboard() {
  const navigate = useNavigate()
  const { applications, setApplications, loading, setLoading } = useLoanStore()
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadApplications = async () => {
    setLoading(true)
    try {
      const { data } = await loanService.getUserApplications()
      setApplications(data.applications || [])
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [refreshKey])

  useEffect(() => {
    const handleDocumentSubmitted = () => {
      setRefreshKey((prev) => prev + 1)
    }
    
    window.addEventListener('documentSubmitted', handleDocumentSubmitted)
    return () => window.removeEventListener('documentSubmitted', handleDocumentSubmitted)
  }, [])

  const approved = applications.filter((a) => ['approved', 'locked'].includes(a.status)).length
  const pending  = applications.filter((a) => !['approved', 'locked', 'rejected'].includes(a.status)).length
  const rejected = applications.filter((a) => a.status === 'rejected').length

  return (
    <AppLayout>
      <Topbar
        title="My Applications"
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/chat')}>
            + New Application
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="📂" label="Total Applications" value={applications.length} />
          <StatCard icon="✅" label="Approved"  value={approved}  />
          <StatCard icon="⏳" label="In Progress" value={pending} />
          <StatCard icon="❌" label="Rejected"  value={rejected} />
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-head text-sm font-bold text-slate-900">Loan Applications</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full"
                style={{ animation: 'spin 0.7s linear infinite', borderWidth: 3 }} />
            </div>
          ) : (
            <LoanTable
applications={applications}
onView={(app) => {
const loanId = app.loan_id || app.id || app._id
if (loanId) {
navigate(`/dashboard/${loanId}/documents`)
} else {
setSelected(app)
}
}}
/>
          )}
        </Card>

        {applications.length > 0 && (
          <Card className="bg-blue-50 border-blue-100">
            <div className="flex items-start gap-4">
              <div className="text-2xl">📋</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Keep your documents ready</h4>
                <p className="text-sm text-blue-700">
                  For faster disbursal, have your Aadhaar, PAN, latest bank statement, and salary slips handy. Upload them in your active application.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Application Detail" maxWidth="max-w-2xl">
        {selected && <LoanStatusCard app={selected} />}
      </Modal>
    </AppLayout>
  )
}
