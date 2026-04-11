import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'

import Auth         from './pages/Auth'
import Home         from './pages/Home'
import Chat         from './pages/Chat'
import Explore      from './pages/Explore'
import EMICalculator from './pages/EMICalculator'
import CreditScore  from './pages/CreditScore'
import Dashboard    from './pages/Dashboard'
import Admin        from './pages/Admin'
import DocumentUpload from './pages/DocumentUpload'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />

        <Route path="/"         element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/chat"     element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/explore"  element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/emi"      element={<ProtectedRoute><EMICalculator /></ProtectedRoute>} />
        <Route path="/credit"   element={<ProtectedRoute><CreditScore /></ProtectedRoute>} />
        <Route path="/dashboard"element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin"    element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/dashboard/:loanId/documents" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
