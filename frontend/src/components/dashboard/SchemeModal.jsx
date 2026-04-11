import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/index.jsx'
import Button from '../ui/Button'
import Input from '../ui/Input'

const LOAN_TYPES = [
  { value: 'personal',  label: '👤 Personal Loan' },
  { value: 'home',      label: '🏠 Home Loan' },
  { value: 'car',       label: '🚗 Car Loan' },
  { value: 'education', label: '🎓 Education Loan' },
  { value: 'business',  label: '💼 Business Loan' },
  { value: 'gold',      label: '💰 Gold Loan' },
]

const ICONS = ['👤','🏠','🚗','🎓','💼','💰','🏦','📊','💳','🔑','🏗️','🌱']

const EMPTY = {
  name: '', loan_type: 'personal', icon: '💰',
  loan_provider_bank: '',
  min_amount: 50000, max_amount: 2500000,
  interest_rate: 10.5,
  min_tenure_months: 12, max_tenure_months: 60,
  residual_income: 25000, min_credit_score: 650, max_credit_score: 900,
  processing_fee_pct: 1.0,
  description: '', loan_conditions: [''],
  features: [''], documents_needed: [''],
  is_active: true, sort_order: 0,
}

export default function SchemeModal({ open, onClose, onSave, scheme }) {
  const [form, setForm]       = useState(EMPTY)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [tab, setTab]         = useState('basic')

  const isEdit = !!scheme

  useEffect(() => {
    if (open) {
      setTab('basic')
      setErrors({})
      setForm(scheme
        ? {
            ...EMPTY, ...scheme,
            loan_conditions:  Array.isArray(scheme.loan_conditions)  ? [...scheme.loan_conditions, '']  : [''],
            features:         Array.isArray(scheme.features)         ? [...scheme.features, '']         : [''],
            documents_needed: Array.isArray(scheme.documents_needed) ? [...scheme.documents_needed, ''] : [''],
          }
        : { ...EMPTY }
      )
    }
  }, [open, scheme])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))
  const setInt = (k) => (e) => setForm((f) => ({ ...f, [k]: parseInt(e.target.value) || 0 }))

  const updateListItem = (key, idx, val) => {
    setForm((f) => {
      const arr = [...(f[key] || [])]
      arr[idx] = val
      return { ...f, [key]: arr }
    })
  }
  const addListItem = (key) =>
    setForm((f) => ({ ...f, [key]: [...(f[key] || []), ''] }))

  const removeListItem = (key, idx) =>
    setForm((f) => ({ ...f, [key]: (f[key] || []).filter((_, i) => i !== idx) }))

  const validate = () => {
    const e = {}
    if (!form.name?.trim())        e.name      = 'Name is required'
    if (!form.loan_type)           e.loan_type = 'Select loan type'
    if (form.min_amount <= 0)      e.min_amount = 'Must be > 0'
    if (form.max_amount <= form.min_amount) e.max_amount = 'Must be > min amount'
    if (form.interest_rate <= 0)   e.interest_rate  = 'Must be > 0'
    if (form.min_tenure_months < 1)    e.min_tenure_months = 'Min 1 month'
    if (form.max_tenure_months < form.min_tenure_months) e.max_tenure_months = 'Must be ≥ min tenure'
    if (form.min_credit_score < 300 || form.min_credit_score > 900) e.min_credit_score = 'Must be between 300 and 900'
    if (form.max_credit_score < form.min_credit_score) e.max_credit_score = 'Must be ≥ min credit score'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        loan_conditions:  form.loan_conditions.filter((s) => s.trim()),
        features:         form.features.filter((s) => s.trim()),
        documents_needed: form.documents_needed.filter((s) => s.trim()),
      }
      await onSave(payload)
      onClose()
    } catch (e) {
      setErrors({ _global: e.response?.data?.detail || e.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { id: 'basic',   label: 'Basic Info' },
    { id: 'rates',   label: 'Rates & Limits' },
    { id: 'content', label: 'Features & Docs' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Scheme — ${scheme?.name}` : 'Add New Loan Scheme'}
      maxWidth="max-w-2xl"
    >
      <div className="flex gap-1 border-b border-slate-100 mb-5 -mt-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {errors._global && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg mb-4">
          {errors._global}
        </div>
      )}

      {tab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheme Name" required
              placeholder="e.g. Personal Loan Standard"
              value={form.name} onChange={set('name')}
              error={errors.name}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Loan Type <span className="text-red-500">*</span></label>
              <select
                value={form.loan_type}
                onChange={set('loan_type')}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {LOAN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.loan_type && <p className="text-xs text-red-600">{errors.loan_type}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  className={[
                    'w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all',
                    form.icon === ic
                      ? 'border-blue-500 bg-blue-50 scale-110'
                      : 'border-slate-200 hover:border-slate-300 bg-white',
                  ].join(' ')}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Loan Provider / Bank Name"
            placeholder="e.g. HDFC Bank, ICICI Bank"
            value={form.loan_provider_bank || ''} onChange={set('loan_provider_bank')}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Loan Conditions</p>
              <button
                type="button" onClick={() => addListItem('loan_conditions')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                + Add condition
              </button>
            </div>
            <div className="space-y-2">
              {(form.loan_conditions || ['']).map((cond, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-amber-500 text-sm flex-shrink-0">•</span>
                  <input
                    type="text"
                    value={cond}
                    onChange={(e) => updateListItem('loan_conditions', i, e.target.value)}
                    placeholder={`Condition ${i + 1}, e.g. Age 21-65 years`}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                  />
                  {(form.loan_conditions || []).length > 1 && (
                    <button
                      type="button" onClick={() => removeListItem('loan_conditions', i)}
                      className="text-slate-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
                    >×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={set('description')}
              placeholder="Brief description of this loan scheme..."
              className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  form.is_active
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500',
                ].join(' ')}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${form.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                {form.is_active ? 'Active — Visible to users' : 'Inactive — Hidden from users'}
              </button>
            </div>
            <Input
              label="Sort Order"
              type="number" min="0"
              value={form.sort_order} onChange={setInt('sort_order')}
              hint="Lower number appears first"
            />
          </div>
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Loan Amount Range (₹)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Amount" type="number" required
                value={form.min_amount} onChange={setNum('min_amount')}
                error={errors.min_amount}
                hint="e.g. 50000"
              />
              <Input
                label="Maximum Amount" type="number" required
                value={form.max_amount} onChange={setNum('max_amount')}
                error={errors.max_amount}
                hint="e.g. 2500000"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Interest Rate (% p.a.)</p>
            <Input
              label="Interest Rate" type="number" step="0.01" required
              value={form.interest_rate} onChange={setNum('interest_rate')}
              error={errors.interest_rate}
              hint="e.g. 10.50"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tenure Range (months)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Tenure" type="number" required
                value={form.min_tenure_months} onChange={setInt('min_tenure_months')}
                error={errors.min_tenure_months}
                hint="e.g. 12"
              />
              <Input
                label="Maximum Tenure" type="number" required
                value={form.max_tenure_months} onChange={setInt('max_tenure_months')}
                error={errors.max_tenure_months}
                hint="e.g. 60"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Credit Score Range</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Credit Score" type="number" required
                value={form.min_credit_score} onChange={setInt('min_credit_score')}
                hint="e.g. 650"
              />
              <Input
                label="Maximum Credit Score" type="number" required
                value={form.max_credit_score} onChange={setInt('max_credit_score')}
                hint="e.g. 900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Residual Income (₹)</p>
              <div className="relative group cursor-help">
                <button className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">i</button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-normal">
                  Residual Income is the final income left after paying all ongoing EMIs and insurance premiums.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                </div>
              </div>
            </div>
            <Input
              label="Minimum Residual Income" type="number"
              value={form.residual_income} onChange={setNum('residual_income')}
              hint="e.g. 25000"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Processing Fee</p>
            <Input
              label="Processing Fee (%)" type="number" step="0.01"
              value={form.processing_fee_pct} onChange={setNum('processing_fee_pct')}
              hint="e.g. 1.50"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Preview</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Interest Rate', value: `${form.interest_rate}% p.a.` },
                { label: 'Amount Range',  value: `₹${(form.min_amount/100000).toFixed(1)}L – ₹${form.max_amount >= 10000000 ? (form.max_amount/10000000).toFixed(1)+'Cr' : (form.max_amount/100000).toFixed(0)+'L'}` },
                { label: 'Credit Score',  value: `${form.min_credit_score}–${form.max_credit_score}` },
              ].map((f) => (
                <div key={f.label} className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className="text-sm font-bold text-slate-800">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-6">
          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Features</p>
              <button
                type="button" onClick={() => addListItem('features')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                + Add feature
              </button>
            </div>
            <div className="space-y-2">
              {(form.features || ['']).map((feat, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => updateListItem('features', i, e.target.value)}
                    placeholder={`Feature ${i + 1}, e.g. No collateral required`}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                  />
                  {(form.features || []).length > 1 && (
                    <button
                      type="button" onClick={() => removeListItem('features', i)}
                      className="text-slate-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
                    >×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents Needed</p>
              <button
                type="button" onClick={() => addListItem('documents_needed')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                + Add document
              </button>
            </div>
            <div className="space-y-2">
              {(form.documents_needed || ['']).map((doc, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-slate-400 text-sm flex-shrink-0">📄</span>
                  <input
                    type="text"
                    value={doc}
                    onChange={(e) => updateListItem('documents_needed', i, e.target.value)}
                    placeholder={`Document ${i + 1}, e.g. Aadhaar Card`}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                  />
                  {(form.documents_needed || []).length > 1 && (
                    <button
                      type="button" onClick={() => removeListItem('documents_needed', i)}
                      className="text-slate-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
                    >×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
        <div className="flex gap-2">
          {tab !== 'basic'    && <Button variant="ghost" size="sm" onClick={() => setTab(tab === 'content' ? 'rates' : 'basic')}>← Back</Button>}
          {tab !== 'content'  && <Button variant="secondary" size="sm" onClick={() => setTab(tab === 'basic' ? 'rates' : 'content')}>Next →</Button>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Create Scheme'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
