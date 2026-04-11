import React, { useEffect, useState, useCallback } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Topbar from '../components/layout/Topbar'
import { StatCard, Card, Modal, StatusBadge } from '../components/ui/index.jsx'
import Button from '../components/ui/Button'
import LoanStatusCard from '../components/dashboard/LoanStatusCard'
import SchemeModal from '../components/dashboard/SchemeModal'
import ApplicationDetailsModal from '../components/admin/ApplicationDetailsModal'
import loanService, { formatINR } from '../services/loanService'
import useAuthStore from '../store/useAuthStore'

const AGENT_CARDS = [
  { key: 'loan_agent',    label: 'Loan Agent',             desc: 'CredoAI — Advisor & eligibility checker', initials: 'LA', av: 'av-loan' },
  { key: 'doc_collector', label: 'Document Collector',     desc: 'Collects KYC docs & UPI payment',       initials: 'DC', av: 'av-docs' },
  { key: 'chat_agent',    label: 'Chat Agent',              desc: 'Orchestrates the full conversation',    initials: 'CA', av: 'av-master' },
]

function DeleteConfirm({ open, onClose, onConfirm, scheme }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Scheme" maxWidth="max-w-md">
      <div className="text-center py-2">
        <div className="text-5xl mb-4">{scheme?.icon || '💰'}</div>
        <p className="text-slate-700 mb-1 font-medium">Are you sure you want to delete</p>
        <p className="text-lg font-bold text-slate-900 mb-3">{scheme?.name}?</p>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-6">
          This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete Permanently</Button>
        </div>
      </div>
    </Modal>
  )
}

function UserDeleteConfirm({ open, onClose, onConfirm, user }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete User" maxWidth="max-w-md">
      <div className="text-center py-2">
        <div className="text-5xl mb-4">👤</div>
        <p className="text-slate-700 mb-1 font-medium">Delete user</p>
        <p className="text-lg font-bold text-slate-900 mb-1">{user?.name}</p>
        <p className="text-sm text-slate-500 mb-3">{user?.email}</p>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-6">
          This is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete User</Button>
        </div>
      </div>
    </Modal>
  )
}

function AppDeleteConfirm({ open, onClose, onConfirm, app }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Application" maxWidth="max-w-md">
      <div className="text-center py-2">
        <div className="text-5xl mb-4">🗑️</div>
        <p className="text-slate-700 mb-1 font-medium">Delete rejected application</p>
        <p className="text-lg font-bold text-slate-900 mb-1">{app?.user_name}</p>
        <p className="text-sm text-slate-500 mb-1">{app?.user_email}</p>
        <p className="text-sm text-slate-500 mb-3">{app?.loan_type} loan - {formatINR(app?.requested_amount)}</p>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-6">
          This is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete Forever</Button>
        </div>
      </div>
    </Modal>
  )
}

function SchemeCard({ scheme, onEdit, onToggle, onDelete }) {
  return (
    <div className={[
      'bg-white border rounded-xl p-5 transition-all duration-200',
      scheme.is_active ? 'border-slate-100 shadow-card' : 'border-dashed border-slate-200 opacity-60',
    ].join(' ')}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${scheme.is_active ? 'bg-blue-50' : 'bg-slate-100'}`}>
            {scheme.icon}
          </div>
          <div>
            <h3 className="font-head text-sm font-bold text-slate-900 leading-tight">{scheme.name}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{scheme.product_code}</p>
          </div>
        </div>
        <span className={['text-[10px] font-bold px-2 py-1 rounded-full', scheme.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'].join(' ')}>
          {scheme.is_active ? '● Active' : '○ Inactive'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        {[
          { label: 'Provider', value: scheme.loan_provider_bank || 'N/A' },
          { label: 'Amount', value: scheme.max_amount >= 10000000 ? `₹${(scheme.max_amount/10000000).toFixed(1)}Cr` : `₹${(scheme.max_amount/100000).toFixed(0)}L` },
          { label: 'Interest', value: `${scheme.interest_rate || scheme.min_rate || '—'}%` },
          { label: 'Tenure', value: `${scheme.min_tenure_months}–${scheme.max_tenure_months}mo` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-lg p-2.5">
            <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="xl" variant="secondary" className="flex-1 justify-center" onClick={() => onEdit(scheme)}>✏️ Edit</Button>
        <Button size="xs" variant={scheme.is_active ? 'ghost' : 'secondary'} className="flex-1 justify-center" onClick={() => onToggle(scheme)}>
          {scheme.is_active ? '⏸ Deactivate' : '▶ Activate'}
        </Button>
        <Button size="xs" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(scheme)}>🗑</Button>
      </div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuthStore()
  const [tab, setTab]         = useState('applications')
  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState(null)
  const [apps, setApps]       = useState([])
  const [stats, setStats]     = useState({})
  const [users, setUsers]     = useState([])
  const [selectedApp, setSelectedApp] = useState(null)
  const [schemes, setSchemes] = useState([])
  const [schemeModal, setSchemeModal]   = useState({ open: false, scheme: null })
  const [deleteModal, setDeleteModal]   = useState({ open: false, scheme: null })
  const [schemeFilter, setSchemeFilter] = useState('all')
  const [userDeleteModal, setUserDeleteModal] = useState({ open: false, user: null })
  const [appDeleteModal, setAppDeleteModal] = useState({ open: false, app: null })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [appsRes, statsRes, usersRes, schemesRes] = await Promise.allSettled([
        loanService.getAllApplications(),
        loanService.getAdminStats(),
        loanService.getAllUsers(),
        loanService.adminListSchemes(),
      ])
      if (appsRes.status    === 'fulfilled') setApps(appsRes.value.data.applications || [])
      if (statsRes.status   === 'fulfilled') setStats(statsRes.value.data || {})
      if (usersRes.status   === 'fulfilled') setUsers(usersRes.value.data.users || [])
      if (schemesRes.status === 'fulfilled') setSchemes(schemesRes.value.data.schemes || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleAppStatus = async (id, status, reason) => {
    try {
      await loanService.updateApplicationStatus(id, status, reason)
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status, reason } : a))
      showToast(`Application ${status}`)
      setSelectedApp(null)
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
    }
  }

  const handleSaveScheme = async (data) => {
    if (schemeModal.scheme) {
      const res = await loanService.adminUpdateScheme(schemeModal.scheme.id, data)
      setSchemes((prev) => prev.map((s) => s.id === schemeModal.scheme.id ? res.data.scheme : s))
      showToast(`"${res.data.scheme.name}" updated`)
    } else {
      const res = await loanService.adminCreateScheme(data)
      setSchemes((prev) => [...prev, res.data.scheme])
      showToast(`"${res.data.scheme.name}" created`)
    }
  }

  const handleToggleScheme = async (scheme) => {
    try {
      const res = await loanService.adminToggleScheme(scheme.id)
      setSchemes((prev) => prev.map((s) => s.id === scheme.id ? res.data.scheme : s))
      showToast(`"${scheme.name}" ${res.data.scheme.is_active ? 'activated' : 'deactivated'}`)
    } catch (_) {
      setSchemes((prev) => prev.map((s) => s.id === scheme.id ? { ...s, is_active: !s.is_active } : s))
    }
  }

  const handleDeleteScheme = async () => {
    const scheme = deleteModal.scheme
    if (!scheme) return
    try { await loanService.adminDeleteScheme(scheme.id) } catch (_) {}
    setSchemes((prev) => prev.filter((s) => s.id !== scheme.id))
    setDeleteModal({ open: false, scheme: null })
    showToast(`"${scheme.name}" deleted`)
  }

  const handleDeleteUser = async () => {
    const u = userDeleteModal.user
    if (!u) return
    try {
      await loanService.adminDeleteUser(u.id)
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      setUserDeleteModal({ open: false, user: null })
      showToast(`User "${u.name}" deleted`)
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
      setUserDeleteModal({ open: false, user: null })
    }
  }

  const handleDeleteApplication = async () => {
    const app = appDeleteModal.app
    if (!app) return
    try {
      await loanService.deleteApplication(app.id)
      setApps((prev) => prev.filter((x) => x.id !== app.id))
      setAppDeleteModal({ open: false, app: null })
      showToast(`Application for ${app.user_name} deleted`)
    } catch (e) {
      showToast(e.response?.data?.detail || e.message, 'error')
      setAppDeleteModal({ open: false, app: null })
    }
  }

  const filteredSchemes = schemes.filter((s) =>
    schemeFilter === 'all' ? true : schemeFilter === 'active' ? s.is_active : !s.is_active
  )

  if (user?.role !== 'ADMIN') {
    return (
      <AppLayout>
        <Topbar title="Admin Panel" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="text-5xl mb-3">🔒</div>
            <p className="font-semibold">Admin access required</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const TABS = [
    { id: 'applications', label: `Applications (${apps.length})` },
    { id: 'schemes',      label: `Loan Schemes (${schemes.length})` },
    { id: 'agents',       label: 'AI Agents (3)' },
    { id: 'users',        label: `Users (${users.length})` },
  ]

  return (
    <AppLayout>
      <Topbar
        title="Admin Panel"
        actions={
          tab === 'schemes' && (
            <Button variant="primary" size="sm" onClick={() => setSchemeModal({ open: true, scheme: null })}>
              + Add Loan Scheme
            </Button>
          )
        }
      />

      {toast && (
        <div className={['fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in',
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'].join(' ')}>
          {toast.type !== 'error' && '✓ '}{toast.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon="📂" label="Total Applications" value={stats.total_applications ?? apps.length} />
          <StatCard icon="✅" label="Approved"  value={stats.approved   ?? 0} />
          <StatCard icon="❌" label="Rejected"  value={stats.rejected   ?? 0} />
          <StatCard icon="👤" label="Users"     value={stats.total_users ?? users.length} />
          <StatCard icon="📦" label="Schemes"   value={stats.total_schemes ?? schemes.length} />
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={['px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'applications' && (
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">📋</div><p>No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['User Name','Email','Loan Type','Amount','Payment','Status','Docs','Actions','Delete'].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{app.user_name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{app.user_email}</td>
                        <td className="px-4 py-3 capitalize font-medium">{app.loan_type}</td>
                        <td className="px-4 py-3 font-semibold">{formatINR(app.requested_amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${app.payment_completed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                            {app.payment_completed ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{app.document_count}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="xs" variant="ghost" onClick={() => setSelectedApp(app)}>View Details</Button>
                        </td>
                        <td className="px-4 py-3">
                          {app.status === 'rejected' ? (
                            <Button size="xs" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setAppDeleteModal({ open: true, app })}>🗑 Delete</Button>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'schemes' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex gap-2">
                {[
                  { id: 'all',      label: `All (${schemes.length})` },
                  { id: 'active',   label: `Active (${schemes.filter(s=>s.is_active).length})` },
                  { id: 'inactive', label: `Inactive (${schemes.filter(s=>!s.is_active).length})` },
                ].map((f) => (
                  <button key={f.id} onClick={() => setSchemeFilter(f.id)}
                    className={['px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all',
                      schemeFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'].join(' ')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setSchemeModal({ open: true, scheme: null })}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center text-2xl">+</div>
                <span className="text-sm font-medium">Add New Scheme</span>
              </button>
              {filteredSchemes.map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme}
                  onEdit={(s) => setSchemeModal({ open: true, scheme: s })}
                  onToggle={handleToggleScheme}
                  onDelete={(s) => setDeleteModal({ open: true, scheme: s })}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'agents' && (
          <div>
            <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
              🤖 <strong>3-Agent System</strong> — Loan Agent (CredoAI), Document Collector, Chat Orchestrator
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {AGENT_CARDS.map((a) => (
                <Card key={a.key} className="flex items-center gap-4 p-5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold font-head flex-shrink-0 ${a.av}`}>
                    {a.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{a.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['#','Name','Email','Role','Verified','Joined','Actions'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">No users found</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">#{u.id}</td>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${u.is_verified ? 'text-green-600' : 'text-slate-400'}`}>
                          {u.is_verified ? '✓ Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="xl" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setUserDeleteModal({ open: true, user: u })}>🗑</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Detail" maxWidth="max-w-2xl">
        {selectedApp && <LoanStatusCard app={selectedApp} />}
      </Modal>
      <ApplicationDetailsModal 
        open={!!selectedApp} 
        loan={selectedApp} 
        onClose={() => setSelectedApp(null)}
        onStatusChange={(status, reason) => handleAppStatus(selectedApp.id, status, reason)}
      />
      <SchemeModal open={schemeModal.open} scheme={schemeModal.scheme}
        onClose={() => setSchemeModal({ open: false, scheme: null })} onSave={handleSaveScheme} />
      <DeleteConfirm open={deleteModal.open} scheme={deleteModal.scheme}
        onClose={() => setDeleteModal({ open: false, scheme: null })} onConfirm={handleDeleteScheme} />
      <UserDeleteConfirm open={userDeleteModal.open} user={userDeleteModal.user}
        onClose={() => setUserDeleteModal({ open: false, user: null })} onConfirm={handleDeleteUser} />
      <AppDeleteConfirm open={appDeleteModal.open} app={appDeleteModal.app}
        onClose={() => setAppDeleteModal({ open: false, app: null })} onConfirm={handleDeleteApplication} />
    </AppLayout>
  )
}