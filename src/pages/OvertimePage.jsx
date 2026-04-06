import { useState, useEffect, useRef } from 'react'
import {
  Clock, TrendingUp, CheckCircle, XCircle, Plus, X,
  AlertCircle, Users, Filter, Search, ChevronLeft,
  ChevronRight, BarChart3, Zap, Calendar, Award,
  ArrowUpRight, Moon, Timer
} from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import API from '../api/axios'

// ── helpers ──────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return mins > 0 ? Math.round(mins / 60 * 10) / 10 : 0
}

function fmtTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const a = h >= 12 ? 'PM' : 'AM'
  const d = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${d}:${String(m).padStart(2,'0')} ${a}`
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Avatar ──────────────────────────────────────────────────
function Avatar({ name = '', size = 'sm' }) {
  const palette = [
    'bg-violet-500','bg-indigo-500','bg-teal-500',
    'bg-amber-500','bg-rose-500','bg-cyan-500'
  ]
  const idx = name.split('').reduce((s,c)=>s+c.charCodeAt(0),0) % palette.length
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-12 h-12 text-base' }
  return (
    <div className={`${palette[idx]} ${sz[size]} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}

// ── Status Chip ──────────────────────────────────────────────
function Chip({ status }) {
  const map = {
    Pending:  { cls: '<bg-amber-200></bg-amber-200>0 text-amber-700 border-amber-200', icon: <Clock size={10}/> },
    Approved: { cls: 'bg-emerald-200 text-emerald-700 border-emerald-200', icon: <CheckCircle size={10}/> },
    Rejected: { cls: 'bg-red-200 text-red-600 border-red-200', icon: <XCircle size={10}/> },
    Cancelled:{ cls: 'bg-gray-200 text-gray-500 border-gray-200', icon: <X size={10}/> },
  }
  const s = map[status] || map.Pending
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.icon}{status}
    </span>
  )
}

// ── Hours Badge ──────────────────────────────────────────────
function HoursBadge({ hours, size = 'sm' }) {
  const color = hours >= 4 ? 'text-violet-600 bg-violet-300 border-violet-100'
              : hours >= 2 ? 'text-indigo-600 bg-indigo-300 border-indigo-100'
              :               'text-gray-600 bg-gray-100 border-gray-100'
  const sz = size === 'lg' ? 'text-2xl px-4 py-1.5' : 'text-sm px-2.5 py-0.5'
  return (
    <span className={`${color} ${sz} border rounded-full font-bold inline-flex items-center gap-1`}>
      <Timer size={size === 'lg' ? 16 : 11}/>{hours}h
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
//  SUBMIT OVERTIME MODAL
// ══════════════════════════════════════════════════════════════
function OvertimeModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    date:      new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime:   '20:00',
    reason:    '',
  })
  const [submitting,     setSubmitting]     = useState(false)
  const [error,  setError]  = useState('')
  const [step,   setStep]   = useState(1)

  const hours = calcHours(form.startTime, form.endTime)

  function validate() {
    if (!form.date)         { setError('Please select a date'); return false }
    if (!form.startTime)    { setError('Please enter start time'); return false }
    if (!form.endTime)      { setError('Please enter end time'); return false }
    if (hours <= 0)         { setError('End time must be after start time'); return false }
    if (hours > 12)         { setError('Overtime cannot exceed 12 hours'); return false }
    if (!form.reason.trim()){ setError('Please provide a reason'); return false }
    return true
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 32px 80px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.08)' }}
      >
        {/* Modal header — gradient strip */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-200 rounded-2xl flex items-center justify-center">
                <Moon size={20} className="text-indigo"/>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-base">Overtime Request</h3>
                <p className="text-violet-500 text-xs mt-0.5">
                  {step === 1 ? 'Enter your overtime details' : 'Review before submitting'}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 bg-white hover:bg-white/20 rounded-xl flex items-center justify-center transition">
              <X size={16} className="text-gray-500"/>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1,2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition
                  ${step >= s ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`h-px w-8 transition ${step > s ? 'bg-gray-300' : 'bg-gray-300'}`}/>}
              </div>
            ))}
            <span className="text-violet-600 text-xs ml-1">
              {step === 1 ? 'Details' : 'Confirm'}
            </span>
          </div>
        </div>

        {/* Step 1 — form */}
        {step === 1 && (
          <div className="p-6 space-y-4">

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input type="date" value={form.date}
                onChange={e => { setForm({...form, date: e.target.value}); setError('') }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-gray-50/50"/>
            </div>

            {/* Time range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Time Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-gray-400 font-medium">FROM</span>
                  <input type="time" value={form.startTime}
                    onChange={e => { setForm({...form, startTime: e.target.value}); setError('') }}
                    className="w-full px-3 pt-7 pb-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-gray-50/50"/>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-gray-400 font-medium">TO</span>
                  <input type="time" value={form.endTime}
                    onChange={e => { setForm({...form, endTime: e.target.value}); setError('') }}
                    className="w-full px-3 pt-7 pb-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-gray-50/50"/>
                </div>
              </div>
            </div>

            {/* Duration preview pill */}
            {hours > 0 && (
              <div className={`rounded-2xl p-4 flex items-center justify-between
                ${hours > 8 ? 'bg-red-50 border border-red-100'
                : hours >= 4 ? 'bg-violet-50 border border-violet-100'
                :              'bg-indigo-50 border border-indigo-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${hours >= 4 ? 'bg-violet-100' : 'bg-indigo-100'}`}>
                    <Timer size={18} className={hours >= 4 ? 'text-violet-600' : 'text-indigo-600'}/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total overtime</p>
                    <p className={`text-xl font-bold ${hours >= 4 ? 'text-violet-600' : 'text-indigo-600'}`}>
                      {hours} hour{hours !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>{fmtTime(form.startTime)}</p>
                  <p>→ {fmtTime(form.endTime)}</p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea value={form.reason}
                onChange={e => { setForm({...form, reason: e.target.value}); setError('') }}
                placeholder="Describe what you worked on during overtime..."
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl text-sm text-gray-800 outline-none transition resize-none
                  ${error && !form.reason.trim()
                    ? 'border-red-300 bg-red-50/30'
                    : 'border-gray-200 focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-gray-50/50'}`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle size={15} className="flex-shrink-0"/>
                {error}
              </div>
            )}

            <button onClick={() => { if (validate()) setStep(2) }}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition active:scale-[0.98] shadow-lg shadow-violet-200">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — confirm */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-4">
                Summary
              </p>
              <div className="space-y-3">
                {[
                  { label:'Date',       value: fmtDate(form.date) },
                  { label:'Start Time', value: fmtTime(form.startTime) },
                  { label:'End Time',   value: fmtTime(form.endTime) },
                  { label:'Duration',   value: `${hours} hour${hours !== 1 ? 's' : ''}` },
                  { label:'Reason',     value: form.reason },
                ].map((r,i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs text-violet-400 w-20 flex-shrink-0 pt-0.5 font-medium">
                      {r.label}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-700">
                Your request will be reviewed by HR/Admin before approval.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium">
                ← Edit
              </button>
              <button
                onClick={() => { onSubmit({ ...form, hours }); onClose() } } 
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition active:scale-[0.98] shadow-lg shadow-violet-200">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Submitting..</>
                  : <>Submit</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  REJECT MODAL
// ══════════════════════════════════════════════════════════════
function RejectModal({ onClose, onConfirm }) {
  const [saving,     setSaving]     = useState(false)
  const [reason, setReason] = useState('')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 32px 80px rgba(239,68,68,0.15), 0 0 0 1px rgba(239,68,68,0.08)' }}
      >
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <XCircle size={20} className="text-white"/>
            </div>
            <div>
              <h3 className="font-semibold text-white">Reject Request</h3>
              <p className="text-red-200 text-xs mt-0.5">Provide a reason for the employee</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <textarea value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition resize-none bg-gray-50/50"
          />
          <div className="flex gap-3">
            <button onClick={() => onConfirm(reason)}
              className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition">
              Confirm Reject
            </button>
            <button onClick={onClose}
              className="px-5 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  EMPLOYEE OVERTIME VIEW
// ══════════════════════════════════════════════════════════════
function EmployeeOvertimeView() {
  const [activeTab,  setActiveTab]  = useState('overview')
  const [myRequests, setMyRequests] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [success,    setSuccess]    = useState('')
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth())
  const [calYear,    setCalYear]    = useState(new Date().getFullYear())
  const [saving ,  setSaving]     = useState(false)

  const employeeId = localStorage.getItem('employeeId')

  useEffect(() => { loadMyRequests() }, [])

  async function loadMyRequests() {
    setLoading(true)
    try {
      const res = await API.get(`/overtime/my/${employeeId}`)
      setMyRequests(res.data)
    } catch {
      // Mock fallback
      setMyRequests([
        { id:1, date:'2026-03-24', startTime:'18:00', endTime:'21:00', hours:3, reason:'Project deadline',    status:'Approved', approvedAt:'2026-03-25' },
        { id:2, date:'2026-03-20', startTime:'19:00', endTime:'22:00', hours:3, reason:'Client presentation', status:'Approved', approvedAt:'2026-03-21' },
        { id:3, date:'2026-03-18', startTime:'18:00', endTime:'20:00', hours:2, reason:'Bug fixing',          status:'Rejected', rejectionReason:'Insufficient justification' },
        { id:4, date:'2026-03-25', startTime:'18:00', endTime:'20:30', hours:2.5, reason:'Sprint review',    status:'Pending' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data) {
    
    try {
      if (employeeId) {
        await API.post(`/overtime/apply/${employeeId}`, data)
      }
      setMyRequests(prev => [{
        id: Date.now(), ...data, status: 'Pending',
        appliedAt: new Date().toISOString()
      }, ...prev])
      setSuccess(`Overtime request submitted — ${data.hours}h on ${fmtDate(data.date)}`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setMyRequests(prev => [{
        id: Date.now(), ...data, status: 'Pending',
        appliedAt: new Date().toISOString()
      }, ...prev])
      setSuccess('Request submitted!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  async function handleCancel(id) {
    
    if (!window.confirm('Cancel this request?')) return
    try {
      await API.put(`/overtime/${id}/cancel`)
    } catch {}
    setMyRequests(prev => prev.map(r => r.id === id ? {...r, status:'Cancelled'} : r))
  }

  // Stats
  const now         = new Date()
  const thisMonth   = myRequests.filter(r => {
    const d = new Date(r.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const approvedHrs = thisMonth.filter(r => r.status === 'Approved').reduce((s,r) => s + (r.hours||0), 0)
  const pendingCnt  = myRequests.filter(r => r.status === 'Pending').length
  const totalHrs    = myRequests.filter(r => r.status === 'Approved').reduce((s,r) => s + (r.hours||0), 0)

  // Calendar helpers
  const daysInMonth    = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay()
  const overtimeDays   = new Set(
    myRequests
      .filter(r => r.status === 'Approved')
      .map(r => r.date)
  )

  return (
    <div className="p-6 space-y-6">

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 text-sm text-emerald-700 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-500 flex-shrink-0"/>
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overtime</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track and manage your overtime hours</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition active:scale-[0.98] shadow-lg shadow-violet-200">
          <Plus size={16}/> Request Overtime
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {[
          { id:'overview', label:'Overview'  },
          { id:'history',  label:`History${pendingCnt > 0 ? ` (${pendingCnt})` : ''}` },
          { id:'calendar', label:'Calendar'  },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition font-medium
              ${activeTab === tab.id
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Hero banner */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-5">

              {/* LEFT */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="text-indigo-600" size={18} />
                </div>

                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Overtime Summary
                  </h2>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-lg font-semibold text-indigo-900 tracking-tight">
                  {approvedHrs}
                  </span>
                  <span className="text-sm text-gray-400">
                  hours approved
                </span>
                </div>
              </div>

              {/* RIGHT */}
              <button className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <MoreHorizontal size={18} className="text-gray-500" />
              </button>

            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 divide-x divide-gray-300">

              {[
                { label: 'Pending', value: pendingCnt, sub: 'requests' },
                { label: 'Total', value: totalHrs, sub: 'hours' },
                { label: 'This month', value: thisMonth.length, sub: 'submissions' },
              ].map((s, i) => (

                <div key={i} className="px-4 flex flex-col">

                  <span className="text-lg font-semibold text-gray-900">
                    {s.value}
                  </span>

                  <span className="text-xs text-gray-500 mt-1">
                    {s.label}
                  </span>

                  <span className="text-xs text-gray-400">
                    {s.sub}
                  </span>

                </div>

              ))}

            </div>
          </div>

          {/* Recent requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Requests</h3>
              <button onClick={() => setActiveTab('history')}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                View all <ArrowUpRight size={12}/>
              </button>
            </div>
            <div className="space-y-3">
              {myRequests.slice(0, 3).map((r, i) => (
                <div key={r.id || i}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
                    ${r.status === 'Approved' ? 'bg-emerald-100' :
                      r.status === 'Rejected' ? 'bg-red-100' :
                      r.status === 'Cancelled'? 'bg-gray-50' : 'bg-amber-100'}`}>
                    <Moon size={18} className={
                      r.status === 'Approved' ? 'text-emerald-500' :
                      r.status === 'Rejected' ? 'text-red-400' :
                      r.status === 'Cancelled'? 'text-gray-400' : 'text-amber-500'
                    }/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{fmtDate(r.date)}</p>
                      <Chip status={r.status}/>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtTime(r.startTime)} → {fmtTime(r.endTime)} · {r.reason}
                    </p>
                    {r.rejectionReason && (
                      <p className="text-xs text-red-400 mt-0.5">Note: {r.rejectionReason}</p>
                    )}
                  </div>
                  <HoursBadge hours={r.hours}/>
                </div>
              ))}
              {myRequests.length === 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Moon size={24} className="text-violet-400"/>
                  </div>
                  <p className="text-gray-600 font-medium">No overtime yet</p>
                  <p className="text-gray-400 text-sm mt-1">Submit your first overtime request</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending alert */}
          {pendingCnt > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock size={16} className="text-amber-600"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {pendingCnt} request{pendingCnt > 1 ? 's' : ''} awaiting approval
                  </p>
                  <p className="text-xs text-amber-500">HR will review soon</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('history')}
                className="text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition font-medium">
                View →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-violet-400"/>
              </div>
              <p className="text-gray-600 font-medium">No overtime requests</p>
              <button onClick={() => setShowModal(true)}
                className="mt-4 px-5 py-2 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 transition">
                Request Now
              </button>
            </div>
          ) : (
            myRequests.map((r, i) => (
              <div key={r.id || i}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${r.status === 'Approved' ? 'bg-emerald-100' :
                        r.status === 'Rejected' ? 'bg-red-100' :
                        r.status === 'Cancelled'? 'bg-gray-100' : 'bg-amber-100'}`}>
                      <Moon size={18} className={
                        r.status === 'Approved' ? 'text-emerald-500' :
                        r.status === 'Rejected' ? 'text-red-400' :
                        r.status === 'Cancelled'? 'text-gray-400' : 'text-amber-500'
                      }/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{fmtDate(r.date)}</p>
                        <Chip status={r.status}/>
                        <HoursBadge hours={r.hours}/>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {fmtTime(r.startTime)} → {fmtTime(r.endTime)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {r.reason}
                      </p>
                      {r.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1">
                          Rejected: {r.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  {r.status === 'Pending' && (
                    <button onClick={() => handleCancel(r.id)} disabled={saving}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-red-100 flex-shrink-0">
                      {saving
                        ? <><div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"/> </>
                        : <> Cancel</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1) }
              else setCalMonth(m=>m-1)
            }} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronLeft size={18} className="text-gray-500"/>
            </button>
            <h3 className="font-semibold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</h3>
            <button onClick={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1) }
              else setCalMonth(m=>m+1)
            }} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronRight size={18} className="text-gray-500"/>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {Array.from({length: firstDayOfWeek}, (_,i) => (
              <div key={`e${i}`} className="border-r border-b border-gray-50 min-h-16"/>
            ))}
            {Array.from({length: daysInMonth}, (_,i) => {
              const day     = i + 1
              const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const req     = myRequests.find(r => r.date === dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              return (
                <div key={day}
                  className={`border-r border-b border-gray-100 min-h-16 p-2 transition
                    ${req?.status === 'Approved' ? 'bg-violet-50' :
                      req?.status === 'Pending'  ? 'bg-amber-50'  : 'bg-white hover:bg-gray-50'}`}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mb-1
                    ${isToday ? 'bg-violet-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {req && (
                    <div className={`text-xs rounded-lg px-1.5 py-0.5 font-medium
                      ${req.status === 'Approved' ? 'bg-violet-200 text-violet-800' :
                        req.status === 'Pending'  ? 'bg-amber-200 text-amber-800'   :
                                                    'bg-gray-200 text-gray-600'}`}>
                      {req.hours}h OT
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 px-5 py-3 bg-gray-50 border-t border-gray-100">
            {[
              { label:'Approved OT', c:'bg-violet-200' },
              { label:'Pending',     c:'bg-amber-200'  },
            ].map((l,i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={`w-3 h-3 rounded-sm ${l.c}`}/>
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <OvertimeModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  HR / ADMIN OVERTIME VIEW
// ══════════════════════════════════════════════════════════════

// Mock monthly data
const MOCK_MONTHLY = [
  { employeeId:22, employeeName:'Cat',           department:'Engineering', totalHours:8,  approvedCount:3, pendingCount:0 },
  { employeeId:2,  employeeName:'Aung Kyaw Zin', department:'Engineering', totalHours:12, approvedCount:4, pendingCount:1 },
  { employeeId:3,  employeeName:'Eaindray',      department:'Engineering', totalHours:6,  approvedCount:2, pendingCount:0 },
  { employeeId:6,  employeeName:'Kelvin',        department:'Design',      totalHours:4,  approvedCount:2, pendingCount:0 },
  { employeeId:10, employeeName:'Anna',          department:'Operations',  totalHours:0,  approvedCount:0, pendingCount:0 },
]

function HROvertimeView() {
  const [activeTab,    setActiveTab]    = useState('requests')
  const [requests,     setRequests]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [selMonth,     setSelMonth]     = useState(new Date().getMonth())
  const [selYear,      setSelYear]      = useState(new Date().getFullYear())
  const [monthlyData,  setMonthlyData]  = useState([])

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadMonthly() }, [selMonth, selYear])

  async function loadData() {
    setLoading(true)
    try {
      const res = await API.get('/overtime/all')
      setRequests(res.data)
    } catch {
      setRequests([
        { id:1, employeeName:'Cat',           department:'Engineering', date:'2026-03-25', startTime:'18:00', endTime:'20:30', hours:2.5, reason:'Sprint review',      status:'Pending'  },
        { id:2, employeeName:'Aung Kyaw Zin', department:'Engineering', date:'2026-03-24', startTime:'18:00', endTime:'21:00', hours:3,   reason:'Project deadline',   status:'Pending'  },
        { id:3, employeeName:'Eaindray',      department:'Engineering', date:'2026-03-22', startTime:'19:00', endTime:'22:00', hours:3,   reason:'Client demo prep',   status:'Approved' },
        { id:4, employeeName:'Kelvin',        department:'Design',      date:'2026-03-20', startTime:'18:00', endTime:'20:00', hours:2,   reason:'Design revisions',   status:'Approved' },
        { id:5, employeeName:'Anna',          department:'Operations',  date:'2026-03-18', startTime:'18:00', endTime:'19:30', hours:1.5, reason:'Report compilation', status:'Rejected', rejectionReason:'Insufficient justification' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadMonthly() {
    try {
      const res = await API.get(`/overtime/monthly?year=${selYear}&month=${selMonth+1}`)
      setMonthlyData(res.data)
    } catch {
      setMonthlyData(MOCK_MONTHLY)
    }
  }

  async function handleApprove(id) {
    const adminId = localStorage.getItem('userId') || 1
    try { await API.put(`/overtime/${id}/approve/${adminId}`) } catch {}
    setRequests(prev => prev.map(r => r.id === id ? {...r, status:'Approved'} : r))
  }

  async function handleReject(id, reason) {
    const adminId = localStorage.getItem('userId') || 1
    try { await API.put(`/overtime/${id}/reject/${adminId}`, { reason }) } catch {}
    setRequests(prev => prev.map(r => r.id === id ? {...r, status:'Rejected', rejectionReason: reason} : r))
    setRejectTarget(null)
  }

  const filtered = requests.filter(r => {
    const ms = (r.employeeName||'').toLowerCase().includes(search.toLowerCase())
    const mf = statusFilter === 'All' || r.status === statusFilter
    return ms && mf
  })

  const pendingCnt  = requests.filter(r => r.status === 'Pending').length
  const approvedCnt = requests.filter(r => r.status === 'Approved').length
  const totalHrs    = requests.filter(r => r.status === 'Approved').reduce((s,r) => s + (r.hours||0), 0)
  const pendingHrs  = requests.filter(r => r.status === 'Pending').reduce((s,r) => s + (r.hours||0), 0)

  return (
    <div className="p-6 space-y-5">

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {[
          { id:'requests', label:`Requests${pendingCnt > 0 ? ` (${pendingCnt})` : ''}` },
          { id:'monthly',  label:'Monthly Report' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition font-medium
              ${activeTab === tab.id
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <div className="space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Pending',        value: pendingCnt,  icon: Clock,      bg:'bg-white',  text:'text-amber-600',  ib:'bg-amber-300'  },
              { label:'Approved',       value: approvedCnt, icon: CheckCircle,bg:'bg-white',text:'text-emerald-600',ib:'bg-emerald-300'},
              { label:'Approved Hours', value: `${totalHrs}h`, icon: Timer,   bg:'bg-white', text:'text-violet-600', ib:'bg-violet-300' },
              { label:'Pending Hours',  value: `${pendingHrs}h`,icon: Zap,    bg:'bg-white', text:'text-indigo-600', ib:'bg-indigo-300' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col">
                <span className={`text-3xl font-bold ${s.text}`}>{s.value}</span>
                <span className="text-sm text-gray-500 mt-0.5">{s.label}</span>
                </div>
		            <div className={`${s.ib} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon size={18} className={s.text}/>
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
              </select>
            </div>
          </div>

          {/* Request cards */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-gray-400"/>
              </div>
              <p className="text-gray-600 font-medium">No overtime requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req, i) => (
                <div key={req.id || i}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar name={req.employeeName || 'Unknown'} size="md"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{req.employeeName}</p>
                          <Chip status={req.status}/>
                          <HoursBadge hours={req.hours}/>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{req.department}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={11}/>
                            {fmtDate(req.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11}/>
                            {fmtTime(req.startTime)} → {fmtTime(req.endTime)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          Reason: {req.reason}
                        </p>
                        {req.rejectionReason && (
                          <p className="text-xs text-red-400 mt-1">
                            Note: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleApprove(req.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold shadow-sm shadow-emerald-200">
                          <CheckCircle size={13}/> Approve
                        </button>
                        <button onClick={() => setRejectTarget(req.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition font-semibold">
                          <XCircle size={13}/> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MONTHLY REPORT TAB ── */}
      {activeTab === 'monthly' && (
        <div className="space-y-5">

          {/* Month selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <button onClick={() => {
              if (selMonth === 0) { setSelMonth(11); setSelYear(y=>y-1) }
              else setSelMonth(m=>m-1)
            }} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronLeft size={18} className="text-gray-500"/>
            </button>
            <p className="flex-1 text-center font-semibold text-gray-900">
              {MONTH_NAMES[selMonth]} {selYear}
            </p>
            <button onClick={() => {
              if (selMonth === 11) { setSelMonth(0); setSelYear(y=>y+1) }
              else setSelMonth(m=>m+1)
            }} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronRight size={18} className="text-gray-500"/>
            </button>
          </div>

          {/* Monthly summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total OT Hours',
                value: `${monthlyData.reduce((s,r)=>s+(r.totalHours||0),0)}h`,
                icon: Timer, bg:'bg-white', text:'text-violet-600', ib:'bg-violet-300'
              },
              {
                label: 'Employees with OT',
                value: monthlyData.filter(r=>(r.totalHours||0)>0).length,
                icon: Users, bg:'bg-white', text:'text-indigo-600', ib:'bg-indigo-300'
              },
              {
                label: 'Avg Hours/Employee',
                value: monthlyData.length > 0
                  ? `${(monthlyData.reduce((s,r)=>s+(r.totalHours||0),0)/monthlyData.length).toFixed(1)}h`
                  : '0h',
                icon: BarChart3, bg:'bg-white', text:'text-teal-600', ib:'bg-teal-300'
              },
            ].map((s,i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col">
                <span className={`text-2xl font-bold ${s.text}`}>{s.value}</span>
                <span className="text-sm text-gray-500 mt-0.5">{s.label}</span>
                </div>
                <div className={`${s.ib} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon size={18} className={s.text}/>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Employee','Department','Approved Hours','Sessions','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyData.map((emp, i) => (
                  <tr key={i} className="hover:bg-violet-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.employeeName}/>
                        <span className="text-sm font-medium text-gray-900">{emp.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{emp.department}</td>
                    <td className="px-5 py-3.5">
                      <HoursBadge hours={emp.totalHours || 0}/>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-gray-700">
                        {emp.approvedCount || 0}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">sessions</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {(emp.pendingCount||0) > 0 ? (
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
                          {emp.pendingCount} pending
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {monthlyData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No overtime data for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          onClose={() => setRejectTarget(null)}
          onConfirm={reason => handleReject(rejectTarget, reason)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function OvertimePage() {
  const role = localStorage.getItem('role') || 'EMPLOYEE'
  const isHR = role === 'ADMIN' || role === 'HR'

  return (
    <div>
      <div className="px-6 pt-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overtime</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isHR ? 'Review and manage overtime requests' : 'Submit and track your overtime'}
          </p>
        </div>
        {isHR && (
          <div className="flex items-center gap-2 text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-xl border border-violet-100">
            <Users size={14}/> HR / Admin View
          </div>
        )}
      </div>
      {isHR ? <HROvertimeView /> : <EmployeeOvertimeView />}
    </div>
  )
}