import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import { Modal } from '../../components/ui/index.jsx'
import Button from '../../components/ui/Button'

const NAV_ITEMS = [
  { path: '/',          icon: '⬛', label: 'Overview' },
  { path: '/chat',      icon: '💬', label: 'AI Assistant' },
  { path: '/explore',   icon: '🔍', label: 'Explore Loans' },
  { path: '/emi',       icon: '📊', label: 'EMI Calculator' },
  { path: '/credit',    icon: '⭐', label: 'Credit Score' },
  { path: '/dashboard', icon: '📋', label: 'My Applications' },
]

const ADMIN_ITEMS = [
  { path: '/admin', icon: '🔧', label: 'Admin Panel' },
]

function LogoutConfirm({ open, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title="Logout" maxWidth="max-w-md">
      <div className="text-center py-2">
        <div className="text-5xl mb-4">👋</div>
        <p className="text-slate-700 mb-3 font-medium">Are you sure you want to logout?</p>
        <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2 mb-6">
          You will need to log in again to access your account.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Logout</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const { phase } = useChatStore()
  const [logoutModal, setLogoutModal] = useState({ open: false })

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const inProgress = phase !== 'greeting' && phase !== 'completed'
  const allItems = [...NAV_ITEMS, ...(user?.role === 'ADMIN' ? ADMIN_ITEMS : [])]

  const handleLogoutConfirm = () => {
    setLogoutModal({ open: false })
    logout()
  }

  return (
    <aside className="w-[260px] bg-[#0F172A] flex flex-col flex-shrink-0 h-full">
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.07]">
        <div className="font-head text-xl font-extrabold text-white tracking-tight">
          Credo<span className="text-blue-400">AI</span>
        </div>
        <div className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest">
          Intelligent Loan System
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {allItems.map((item) => {
          const active = pathname === item.path
          const showBadge = item.path === '/chat' && inProgress
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left',
                active
                  ? 'bg-blue-500/20 text-white font-medium'
                  : 'text-white/55 hover:text-white/90 hover:bg-white/[0.05]',
              ].join(' ')}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/[0.07] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold font-head flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user?.name || 'Guest'}</p>
          <p className="text-xs text-white/35 truncate">{user?.role || 'User'}</p>
        </div>
        <button
          onClick={() => setLogoutModal({ open: true })}
          className="text-white/30 hover:text-white/70 text-base transition-colors p-1"
          title="Logout"
        >
          ⏻
        </button>
      </div>

      <LogoutConfirm open={logoutModal.open} onClose={() => setLogoutModal({ open: false })} onConfirm={handleLogoutConfirm} />
    </aside>
  )
}