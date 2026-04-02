import { useState, useEffect } from 'react'
import {
  Calendar, Clock, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Plus, X,
  FileText, TrendingUp, Users, Filter, Search,
  Sun, Sunset, CalendarDays, BarChart3, Settings
} from 'lucide-react'
import API from '../api/axios'

// ── Helpers ──
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

function toDateKey(date) {
  return date.toISOString().split('T')[0]
}

function getDayCount(startDate, endDate, isHalfDay) {
  if (isHalfDay) return 0.5
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end   = new Date(endDate)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Avatar ──
function Avatar({ name = '', size = 'sm' }) {
  const colors = ['bg-indigo-500','bg-violet-500','bg-amber-500','bg-pink-500','bg-teal-500','bg-cyan-500']
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={`${colors[idx]} ${sz[size]} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}

// ── Status Badge ──
function StatusBadge({ status }) {
  const styles = {
    Pending:  'bg-amber-300  text-amber-700  border-amber-200',
    Approved: 'bg-green-300  text-green-700  border-green-200',
    Rejected: 'bg-red-300    text-red-600    border-red-200',
    Cancelled:'bg-gray-300   text-gray-500   border-gray-200',
  }
  const icons = {
    Pending:  <Clock size={11}/>,
    Approved: <CheckCircle size={11}/>,
    Rejected: <XCircle size={11}/>,
    Cancelled:<X size={11}/>,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.Pending}`}>
      {icons[status]} {status}
    </span>
  )
}

// ── Leave Balance Card ──
function LeaveBalanceCard({ leaveType, used, total, color }) {
  const remaining = total - used
  const percent   = Math.min((used / total) * 100, 100)
  const colorMap  = {
    indigo: { bg: 'bg-white', border: 'border-gray', text: 'text-indigo-600', bar: 'bg-indigo-500', light: 'bg-indigo-300' },
    amber:  { bg: 'bg-white',  border: 'border-gray',  text: 'text-amber-600',  bar: 'bg-amber-500',  light: 'bg-amber-300'  },
    green:  { bg: 'bg-white',  border: 'border-gray',  text: 'text-green-600',  bar: 'bg-green-500',  light: 'bg-green-300'  },
    rose:   { bg: 'bg-white',   border: 'border-gray',   text: 'text-rose-600',   bar: 'bg-rose-500',   light: 'bg-rose-300'   },
    violet: { bg: 'bg-white', border: 'border-gray', text: 'text-violet-600', bar: 'bg-violet-500', light: 'bg-violet-300' },
    teal:   { bg: 'bg-white',   border: 'border-gray',   text: 'text-teal-600',   bar: 'bg-teal-500',   light: 'bg-teal-300'   },
  }
  const c = colorMap[color] || colorMap.indigo

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5 relative overflow-hidden cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{leaveType}</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className={`text-3xl font-bold ${c.text}`}>{remaining}</span>
            <span className="text-sm text-gray-400">/ {total} days</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">remaining this year</p>
        </div>
        <div className={`${c.light} w-10 h-10 rounded-xl flex items-center justify-center`}>
          <CalendarDays size={18} className={c.text}/>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`${c.bar} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{used} used</span>
        <span>{percent.toFixed(0)}%</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// APPLY LEAVE MODAL
// ══════════════════════════════════════
function ApplyLeaveModal({ leaveTypes, balances, onClose, onSubmit }) {
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({
    leaveTypeId:  leaveTypes[0]?.id || '',
    leaveTypeName: leaveTypes[0]?.name || '',
    dayType:      'full',    // full | half
    halfPeriod:   'morning', // morning | afternoon
    startDate:    '',
    endDate:      '',
    reason:       '',
  })
  const [error, setError] = useState('')
  const [step,  setStep]  = useState(1) // 1=details, 2=confirm

  const selectedType = leaveTypes.find(lt => lt.id === parseInt(form.leaveTypeId))
  const balance      = balances[form.leaveTypeId] || { used: 0, total: selectedType?.daysPerYear || 0 }
  const remaining    = balance.total - balance.used
  const daysCount    = getDayCount(form.startDate, form.endDate, form.dayType === 'half')

  function handleTypeChange(id) {
    const lt = leaveTypes.find(lt => lt.id === parseInt(id))
    setForm({ ...form, leaveTypeId: id, leaveTypeName: lt?.name || '' })
  }

  function validate() {
    if (!form.startDate) { setError('Please select start date'); return false }
    if (form.dayType === 'full' && !form.endDate) { setError('Please select end date'); return false }
    if (!form.reason.trim()) { setError('Please provide a reason'); return false }
    if (daysCount > remaining) { setError(`Not enough balance! You have ${remaining} days remaining`); return false }
    if (daysCount <= 0) { setError('Invalid date range'); return false }
    return true
  }

  function handleNext() {
    if (!validate()) return
    setStep(2)
  }

  function handleSubmit() {
    setSaving(true)
    onSubmit({
      leaveTypeId:  parseInt(form.leaveTypeId),
      leaveTypeName: form.leaveTypeName,
      dayType:      form.dayType,
      halfPeriod:   form.dayType === 'half' ? form.halfPeriod : null,
      startDate:    form.startDate,
      endDate:      form.dayType === 'half' ? form.startDate : form.endDate,
      daysCount,
      reason:       form.reason,
    })
    onClose()
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Apply for Leave
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
              <div className="grid grid-cols-2 gap-2">
                {leaveTypes.map(lt => {
                  const bal = balances[lt.id] || { used: 0, total: lt.daysPerYear }
                  const rem = bal.total - bal.used
                  return (
                    <button key={lt.id}
                      onClick={() => handleTypeChange(lt.id)}
                      className={`p-3 rounded-xl border-2 text-left transition
                        ${parseInt(form.leaveTypeId) === lt.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 hover:border-indigo-200 bg-white'}`}>
                      <p className={`text-sm font-semibold ${parseInt(form.leaveTypeId) === lt.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {lt.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {rem} days remaining
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Day Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Duration</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setForm({ ...form, dayType: 'full' })}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 transition
                    ${form.dayType === 'full'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-100 hover:border-indigo-200'}`}>
                  <CalendarDays size={16} className={form.dayType === 'full' ? 'text-indigo-600' : 'text-gray-400'}/>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${form.dayType === 'full' ? 'text-indigo-700' : 'text-gray-700'}`}>
                      Full Day
                    </p>
                    <p className="text-xs text-gray-400">09:00 – 18:00</p>
                  </div>
                </button>
                <button
                  onClick={() => setForm({ ...form, dayType: 'half', endDate: '' })}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 transition
                    ${form.dayType === 'half'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-100 hover:border-indigo-200'}`}>
                  <Clock size={16} className={form.dayType === 'half' ? 'text-indigo-600' : 'text-gray-400'}/>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${form.dayType === 'half' ? 'text-indigo-700' : 'text-gray-700'}`}>
                      Half Day
                    </p>
                    <p className="text-xs text-gray-400">= 0.5 day</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Half day period selection */}
            {form.dayType === 'half' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Which Half?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm({ ...form, halfPeriod: 'morning' })}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2 transition
                      ${form.halfPeriod === 'morning'
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-100 hover:border-amber-200'}`}>
                    <Sun size={16} className={form.halfPeriod === 'morning' ? 'text-amber-500' : 'text-gray-400'}/>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${form.halfPeriod === 'morning' ? 'text-amber-700' : 'text-gray-700'}`}>
                        Morning
                      </p>
                      <p className="text-xs text-gray-400">09:00 – 13:00</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setForm({ ...form, halfPeriod: 'afternoon' })}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2 transition
                      ${form.halfPeriod === 'afternoon'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 hover:border-orange-200'}`}>
                    <Sunset size={16} className={form.halfPeriod === 'afternoon' ? 'text-orange-500' : 'text-gray-400'}/>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${form.halfPeriod === 'afternoon' ? 'text-orange-700' : 'text-gray-700'}`}>
                        Afternoon
                      </p>
                      <p className="text-xs text-gray-400">13:00 – 18:00</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className={`grid ${form.dayType === 'full' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {form.dayType === 'half' ? 'Date' : 'Start Date'}
                </label>
                <input type="date" value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.dayType === 'half' ? e.target.value : form.endDate })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
              {form.dayType === 'full' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input type="date" value={form.endDate}
                    min={form.startDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
                </div>
              )}
            </div>

            {/* Days count preview */}
            {daysCount > 0 && (
              <div className={`rounded-xl p-3 flex items-center justify-between
                ${daysCount > remaining ? 'bg-red-50 border border-red-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                <span className="text-sm text-gray-600">Total leave days</span>
                <div className="text-right">
                  <span className={`text-lg font-bold ${daysCount > remaining ? 'text-red-500' : 'text-indigo-600'}`}>
                    {daysCount} {daysCount === 1 ? 'day' : 'days'}
                  </span>
                  {daysCount > remaining && (
                    <p className="text-xs text-red-500">Exceeds balance!</p>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea value={form.reason}
                onChange={e => { setForm({ ...form, reason: e.target.value }); setError('') }}
                placeholder="Please describe your reason for leave..."
                rows={3}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition resize-none
                  ${error && !form.reason ? 'border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={15}/> {error}
              </div>
            )}

            <button onClick={handleNext}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition active:scale-[0.98]">
              Review Application →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <h4 className="font-semibold text-indigo-900 mb-4">Leave Summary</h4>
              <div className="space-y-3">
                {[
                  { label: 'Leave Type',  value: form.leaveTypeName },
                  { label: 'Duration',    value: form.dayType === 'half'
                    ? `Half Day (${form.halfPeriod === 'morning' ? 'Morning 09:00–13:00' : 'Afternoon 13:00–18:00'})`
                    : 'Full Day' },
                  { label: 'Date',        value: form.dayType === 'half'
                    ? formatDate(form.startDate)
                    : `${formatDate(form.startDate)} → ${formatDate(form.endDate)}` },
                  { label: 'Total Days',  value: `${daysCount} ${daysCount === 1 ? 'day' : 'days'}` },
                  { label: 'Reason',      value: form.reason },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs text-indigo-400 w-24 flex-shrink-0 pt-0.5">{item.label}</span>
                    <span className="text-sm text-indigo-900 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
              Your request will be reviewed by HR. You will be notified once approved or rejected.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                Edit
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium">
                  {saving
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Saving...</>
                                : <> Submit Request</>
                              }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// EMPLOYEE LEAVE VIEW
// ══════════════════════════════════════
function EmployeeLeaveView() {
  const [activeTab,   setActiveTab]   = useState('overview')
  const [leaveTypes,  setLeaveTypes]  = useState([])
  const [myLeaves,    setMyLeaves]    = useState([])
  const [balances,    setBalances]    = useState({})
  const [loading,     setLoading]     = useState(true)
  const [showApply,   setShowApply]   = useState(false)
  const [success,     setSuccess]     = useState('')
  const [cancelling,  setCancelling]     = useState(false)

  const employeeId = localStorage.getItem('employeeId')

  const BALANCE_COLORS = ['indigo','amber','green','rose','violet','teal']

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
  setLoading(true)
  try {
    const [ltRes, myRes, balRes] = await Promise.all([
      API.get('/leave-types'),
      API.get(`/leave/my/${employeeId}`),
      API.get(`/leave/balance/${employeeId}`),
    ])

    setLeaveTypes(ltRes.data)
    setMyLeaves(myRes.data)

    // balRes.data = { "1": 11, "2": 6, "3": 7 }
    // Convert to { leaveTypeId: { used, total } }
    const bal = {}
    ltRes.data.forEach(lt => {
      const remaining = balRes.data[lt.id] ?? lt.daysPerYear
      bal[lt.id] = {
        used:  lt.daysPerYear - remaining,
        total: lt.daysPerYear
      }
    })
    setBalances(bal)
  } catch (err) {
    console.error('Failed:', err)
  } finally {
    setLoading(false)
  }
}
  async function handleSubmitLeave(formData) {
    
    try {
      if (employeeId) {
        await API.post(`/leave/apply/${employeeId}`, formData)
      }
      // Optimistic update
      setMyLeaves(prev => [{
        id: Date.now(),
        ...formData,
        status: 'Pending',
        appliedAt: new Date().toISOString(),
      }, ...prev])

      setSuccess(`Leave request submitted! ${formData.daysCount} day(s) of ${formData.leaveTypeName}`)
      setTimeout(() => setSuccess(''), 4000)
      loadData()
    } catch (err) {
      console.error('Failed to apply leave:', err)
      setSuccess('Request submitted (pending sync)')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  async function handleCancel(leaveId) {
    setCancelling(true)
    if (!window.confirm('Cancel this leave request?')) return
    try {
      await API.put(`/leave/${leaveId}/cancel`)
      setMyLeaves(prev => prev.map(l =>
        l.id === leaveId ? { ...l, status: 'Cancelled' } : l
      ))
    } catch (err) {
      setMyLeaves(prev => prev.map(l =>
        l.id === leaveId ? { ...l, status: 'Cancelled' } : l
      ))
    }
  }

  const totalUsed      = Object.values(balances).reduce((s, b) => s + b.used, 0)
  const totalAvailable = Object.values(balances).reduce((s, b) => s + b.total, 0)
  const pendingCount   = myLeaves.filter(l => l.status === 'Pending').length

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="p-6 space-y-5">

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16}/> {success}
        </div>
      )}

      {/* Header with Apply button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Leave</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalAvailable - totalUsed} days remaining across all leave types
          </p>
        </div>
        <button onClick={() => setShowApply(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition active:scale-[0.98] shadow-sm">
          <Plus size={16}/> Apply Leave
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id:'overview', label:'Overview'         },
          { id:'history',  label:`History${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition font-medium
              ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Summary strip */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2 py-5">
            
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              
              {[
                { label: 'Total Allowed', value: totalAvailable, sub: 'days / year' },
                { label: 'Used', value: totalUsed, sub: 'days taken' },
                { label: 'Remaining', value: totalAvailable - totalUsed, sub: 'days left' },
              ].map((item, i) => (

                <div key={i} className="px-4 flex flex-col">
                  
                  {/* LABEL (top small like screenshot) */}
                  <span className="text-xs text-gray-400 font-medium">
                    {item.label}
                  </span>

                  {/* VALUE (main focus) */}
                  <span className="text-2xl font-semibold text-gray-900 mt-1">
                    {item.value}
                  </span>

                  {/* SUBTEXT */}
                  <span className="text-xs text-gray-400 mt-1">
                    {item.sub}
                  </span>

                </div>

              ))}
              
            </div>
          </div>

          {/* Leave balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map((lt, i) => (
              <LeaveBalanceCard
                key={lt.id}
                leaveType={lt.name}
                used={balances[lt.id]?.used || 0}
                total={balances[lt.id]?.total || lt.daysPerYear}
                color={BALANCE_COLORS[i % BALANCE_COLORS.length]}
              />
            ))}
          </div>

          {/* Pending requests alert */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-600"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {pendingCount} leave request{pendingCount > 1 ? 's' : ''} pending approval
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">HR will review your request soon</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('history')}
                className="text-xs text-amber-700 bg-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-300 transition font-medium">
                View →
              </button>
            </div>
          )}

          {/* Quick apply buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Quick Apply</h3>
            <div className="flex flex-wrap gap-2">
              {leaveTypes.map((lt, i) => {
                const bal = balances[lt.id] || { used: 0, total: lt.daysPerYear }
                const rem = bal.total - bal.used
                return (
                  <button key={lt.id}
                    onClick={() => setShowApply(true)}
                    disabled={rem <= 0}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition border
                      ${rem > 0
                        ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                        : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}>
                    <CalendarDays size={13}/>
                    {lt.name}
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${rem > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                      {rem}d
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {myLeaves.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-indigo-400"/>
              </div>
              <p className="text-gray-600 font-medium">No leave requests yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Apply Leave" to submit your first request</p>
              <button onClick={() => setShowApply(true)}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition">
                Apply Now
              </button>
            </div>
          ) : (
            myLeaves.map((leave, i) => (
              <div key={leave.id || i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${leave.status === 'Approved' ? 'bg-green-100' :
                        leave.status === 'Rejected' ? 'bg-red-100' :
                        leave.status === 'Cancelled' ? 'bg-gray-100' : 'bg-amber-100'}`}>
                      <CalendarDays size={18} className={
                        leave.status === 'Approved' ? 'text-green-600' :
                        leave.status === 'Rejected' ? 'text-red-500' :
                        leave.status === 'Cancelled' ? 'text-gray-400' : 'text-amber-600'
                      }/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">
                          {leave.leaveTypeName}
                        </p>
                        <StatusBadge status={leave.status}/>
                      </div>
                      <p className="text-xs text-gray-500">
                        {leave.dayType === 'half'
                          ? `Half Day (${leave.halfPeriod}) · ${formatDate(leave.startDate)}`
                          : `${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}`
                        }
                        {' · '}<span className="font-medium text-indigo-600">{leave.daysCount} day(s)</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Reason: {leave.reason}
                      </p>
                      {leave.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">
                          HR Note: {leave.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {leave.status === 'Pending' && (
                    <button onClick={() => handleCancel(leave.id)} disabled={cancelling}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-red-200">
                      {cancelling
                        ? <><div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"/>Cancel</>
                        : <>Cancel</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApply && (
        <ApplyLeaveModal
          leaveTypes={leaveTypes}
          balances={balances}
          onClose={() => setShowApply(false)}
          onSubmit={handleSubmitLeave}
        />
      )}
    </div>
  )
}
//Hr leave Overview
  function TeamOverview({ leaveTypes }) {
    const [teamData, setTeamData] = useState([])
    const [loading,  setLoading]  = useState(true)
    const [search,   setSearch]   = useState('')

    useEffect(() => { loadTeamBalance() }, [])

    async function loadTeamBalance() {
      setLoading(true)
      try {
        const res = await API.get('/leave/team-balance')
        setTeamData(res.data)
      } catch (err) {
        console.error('Failed:', err)
        setTeamData([])
      } finally {
        setLoading(false)
      }
    }

    const filtered = teamData.filter(e =>
      e.employeeName.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"/>
      </div>
    )

    return (
      <div className="space-y-4">
        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-xs shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
            <Search size={16} className="text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"/>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Leave Balance Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().getFullYear()} — All employees remaining balance
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  {leaveTypes.map(lt => (
                    <th key={lt.id} className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-28">
                      {lt.name}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Left
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((emp, i) => (
                  <tr key={i} className="hover:bg-indigo-50 transition">
                    <td className="px-5 py-3.5 sticky left-0 bg-white">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.employeeName}/>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.employeeName}</p>
                          <p className="text-xs text-gray-400">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    {leaveTypes.map(lt => {
                      const bal = emp.balances?.find(b => b.leaveTypeId === lt.id)
                      const rem = bal?.remaining ?? lt.daysPerYear
                      const tot = bal?.total     ?? lt.daysPerYear
                      return (
                        <td key={lt.id} className="px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-semibold
                              ${rem === 0 ? 'text-red-500' : rem <= 2 ? 'text-amber-500' : 'text-gray-700'}`}>
                              {rem}
                            </span>
                            <span className="text-xs text-gray-300">/{tot}</span>
                            {/* Mini progress bar */}
                            <div className="w-12 bg-gray-100 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full
                                  ${rem === 0 ? 'bg-red-400' : rem <= 2 ? 'bg-amber-400' : 'bg-green-400'}`}
                                style={{ width: `${(rem / tot) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-bold
                        ${emp.totalRemaining <= 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                        {emp.totalRemaining}
                      </span>
                      <p className="text-xs text-gray-300">days</p>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={leaveTypes.length + 2} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
// ══════════════════════════════════════
// HR/ADMIN LEAVE VIEW
// ══════════════════════════════════════
function HRLeaveView() {
  const [activeTab,    setActiveTab]    = useState('requests')
  const [requests,     setRequests]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter,   setTypeFilter]   = useState('All')
  const [leaveTypes,   setLeaveTypes]   = useState([])
  const [rejectModal,  setRejectModal]  = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ltRes, reqRes] = await Promise.all([
        API.get('/leave-types'),
        API.get('/leave/all'),
      ])
      setLeaveTypes(ltRes.data)
      setRequests(reqRes.data)
    } catch (err) {
      console.error('Failed to load leave requests:', err)
      // Mock data for display
      setLeaveTypes([
        { id:1, name:'Annual Leave',  daysPerYear:14 },
        { id:2, name:'Sick Leave',    daysPerYear:7  },
        { id:3, name:'Casual Leave',  daysPerYear:7  },
      ])
      setRequests([
        { id:1, employeeName:'Cat',          leaveTypeName:'Annual Leave',  dayType:'full', startDate:'2026-03-25', endDate:'2026-03-26', daysCount:2, reason:'Personal trip',    status:'Pending',  appliedAt:'2026-03-24' },
        { id:2, employeeName:'Aung Kyaw Zin',leaveTypeName:'Sick Leave',    dayType:'full', startDate:'2026-03-22', endDate:'2026-03-22', daysCount:1, reason:'Fever and cold',   status:'Approved', appliedAt:'2026-03-21' },
        { id:3, employeeName:'Eaindray',     leaveTypeName:'Casual Leave',  dayType:'half', startDate:'2026-03-20', endDate:'2026-03-20', daysCount:0.5, reason:'Doctor appointment', status:'Approved', appliedAt:'2026-03-19' },
        { id:4, employeeName:'Kelvin',       leaveTypeName:'Annual Leave',  dayType:'full', startDate:'2026-04-01', endDate:'2026-04-03', daysCount:3, reason:'Family vacation',  status:'Pending',  appliedAt:'2026-03-25' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(reqId) {
    const adminId = localStorage.getItem('userId') || 1
    try {
      await API.put(`/leave/${reqId}/approve/${adminId}`)
    } catch (err) {
      console.error('Approve failed:', err)
    }
    setRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: 'Approved' } : r
    ))
  }

  async function handleReject(reqId) {
    const adminId = localStorage.getItem('userId') || 1
    try {
      await API.put(`/leave/${reqId}/reject/${adminId}`, { reason: rejectReason })
    } catch (err) {
      console.error('Reject failed:', err)
    }
    setRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: 'Rejected', rejectionReason: rejectReason } : r
    ))
    setRejectModal(null)
    setRejectReason('')
  }

  const filtered = requests.filter(r => {
    const ms = (r.employeeName || '').toLowerCase().includes(search.toLowerCase())
    const mf = statusFilter === 'All' || r.status === statusFilter
    const mt = typeFilter   === 'All' || r.leaveTypeName === typeFilter
    return ms && mf && mt
  })

  const pendingCount  = requests.filter(r => r.status === 'Pending').length
  const approvedCount = requests.filter(r => r.status === 'Approved').length

  // Monthly stats
  const totalDaysApproved = requests
    .filter(r => r.status === 'Approved')
    .reduce((s, r) => s + (r.daysCount || 0), 0)

  return (
    <div className="p-6 space-y-5">

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id:'requests', label:`Leave Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { id:'overview', label:'Team Overview' },
          { id:'settings', label:'Leave Settings' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition font-medium
              ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LEAVE REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <div className="space-y-5">

                    {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Pending',       v:pendingCount,   bg:'bg-white', text:'text-amber-600', ib:'bg-amber-300'  },
              { label:'Approved',      v:approvedCount,  bg:'bg-white', text:'text-green-600', ib:'bg-green-300'  },
              { label:'Total Requests',v:requests.length,bg:'bg-white',text:'text-indigo-600',ib:'bg-indigo-300' },
              { label:'Days Approved', v:totalDaysApproved,bg:'bg-white',text:'text-violet-600',ib:'bg-violet-300'},
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col">
                <span className={`text-3xl font-bold ${s.text}`}>{s.v}</span>
                <span className="text-sm text-gray-600 mt-0.5">{s.label}</span>
                </div>
                <div className={`${s.ib} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                  <CalendarDays size={18} className={s.text}/>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
              <Search size={16} className="text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"/>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
              <Filter size={14} className="text-gray-400"/>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none">
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
              <CalendarDays size={14} className="text-gray-400"/>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none">
                <option value="All">All Types</option>
                {leaveTypes.map(lt => (
                  <option key={lt.id} value={lt.name}>{lt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Request cards */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-gray-400"/>
              </div>
              <p className="text-gray-600 font-medium">No leave requests found</p>
            </div>
          ) : (
            filtered.map((req, i) => (
              <div key={req.id || i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar name={req.employeeName || 'Unknown'} size="md"/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{req.employeeName}</p>
                        <StatusBadge status={req.status}/>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                          {req.leaveTypeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12}/>
                          {req.dayType === 'half'
                            ? `Half Day · ${formatDate(req.startDate)}`
                            : `${formatDate(req.startDate)} → ${formatDate(req.endDate)}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12}/>
                          <span className="font-medium text-indigo-600">
                            {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Reason: {req.reason}
                      </p>

                      {req.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">
                          Rejected: {req.rejectionReason}
                        </p>
                      )}

                      <p className="text-xs text-gray-300 mt-1">
                        Applied: {formatDate(req.appliedAt)}
                      </p>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium">
                        <CheckCircle size={13}/> Approve
                      </button>
                      <button onClick={() => setRejectModal(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition font-medium">
                        <XCircle size={13}/> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TEAM OVERVIEW TAB ── */}
        {activeTab === 'overview' && (<TeamOverview leaveTypes={leaveTypes} />)}

      {/* ── LEAVE SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings size={15} className="text-indigo-600"/>
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-800">Leave Type Settings</p>
              <p className="text-xs text-indigo-500 mt-0.5">
                Configure leave types and days per year from the Leave Types page.
                These settings apply to all employees automatically.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Current Leave Policies</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {leaveTypes.map((lt, i) => (
                <div key={lt.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <CalendarDays size={16} className="text-indigo-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{lt.name}</p>
                      <p className="text-xs text-gray-400">{lt.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-600">{lt.daysPerYear}</span>
                    <p className="text-xs text-gray-400">days/year</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Reject Leave Request</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => handleReject(rejectModal)}
                className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium">
                Confirm Reject
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="px-4 py-2.5 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════
export default function LeavePage() {
  const role = localStorage.getItem('role') || 'EMPLOYEE'
  const isHR = role === 'ADMIN' || role === 'HR'

  return (
    <div>
      <div className="px-6 pt-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Leave</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isHR ? 'Manage employee leave requests' : 'Apply and track your leave'}
          </p>
        </div>
        {isHR && (
          <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100">
            <Users size={14}/> HR / Admin View
          </div>
        )}
      </div>
      {isHR ? <HRLeaveView /> : <EmployeeLeaveView />}
    </div>
  )
}