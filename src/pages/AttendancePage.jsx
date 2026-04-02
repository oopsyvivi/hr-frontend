import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Clock, AlertCircle,
  CheckCircle, XCircle, X, Send, Users, Download,
  Filter, Search, Calendar
} from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { Save, CheckSquare } from 'lucide-react'
import API from '../api/axios'


function ShiftCalendarAdmin() {
  const { getShiftStatus, toggleShiftDay, bulkSetMonth } = useSettings()
  const [calYear,    setCalYear]    = useState(today.getFullYear())
  const [calMonth,   setCalMonth]   = useState(today.getMonth())
  const [saved,      setSaved]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [localChanges, setLocalChanges] = useState({}) // track unsaved changes

  const daysInMonth    = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay()

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function getDateKey(d) {
    return `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  // Get status — check local changes first, then context
  function getDayStatus(day) {
    const key = getDateKey(day)
    if (localChanges[key]) return localChanges[key]
    return getShiftStatus(key)
  }

   // Toggle locally first (instant UI feedback)
  function handleToggleDay(day) {
    const key = getDateKey(day)
    const current = getDayStatus(day)
    const next = current === 'shift' ? 'off'
               : current === 'off'   ? 'holiday'
               :                       'shift'
    setLocalChanges(prev => ({ ...prev, [key]: next }))
    toggleShiftDay(key) // also update localStorage
  }

  // Bulk set locally
  function handleBulkSet(mode) {
    const changes = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const key = getDateKey(d)
      const dow = new Date(calYear, calMonth, d).getDay()
      if (mode === 'weekdays') {
        changes[key] = dow === 0 || dow === 6 ? 'off' : 'shift'
      } else if (mode === 'all_shift') {
        changes[key] = 'shift'
      } else {
        changes[key] = 'off'
      }
    }
      setLocalChanges(prev => ({ ...prev, ...changes }))
        bulkSetMonth(calYear, calMonth, mode) // also update localStorage
    }
  // Save to database
  async function handleSave() {
    setSaving(true)
    try {
      const userId = localStorage.getItem('userId') || 1

      // Collect all days to save
      const allDays = {}
      for (let d = 1; d <= daysInMonth; d++) {
        const key = getDateKey(d)
        allDays[key] = getDayStatus(d)
      }

      // Save each day to backend
      const promises = Object.entries(allDays).map(([dateStr, status]) =>
        API.post(`/shifts/${userId}`, {
          shiftDate: dateStr,
          status:    status,
          note:      status === 'holiday' ? 'Holiday' : null
        }).catch(err => console.error('Failed to save shift:', dateStr, err))
      )

      await Promise.all(promises)
      setLocalChanges({}) // clear local changes after save
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save schedule:', err)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Count shifts in current month
  const shiftCount   = Array.from({length:daysInMonth},(_,i)=>i+1).filter(d => getShiftStatus(getDateKey(d)) === 'shift').length
  const offCount     = Array.from({length:daysInMonth},(_,i)=>i+1).filter(d => getShiftStatus(getDateKey(d)) === 'off').length
  const holidayCount = Array.from({length:daysInMonth},(_,i)=>i+1).filter(d => getShiftStatus(getDateKey(d)) === 'holiday').length

  return (
    <div className="space-y-4">

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16}/> Shift schedule saved! Employees can see the updated calendar.
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Shift Calendar</h3>
        <p className="text-sm text-gray-400 mb-4">
          Click any day to cycle: <span className="text-green-600 font-medium">Shift</span> → <span className="text-gray-500 font-medium">Off</span> → <span className="text-red-500 font-medium">Holiday</span> → Shift
        </p>

        {/* How to use */}
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { label:'Shift day',  color:'bg-green-500',  text:'text-green-700',  bg:'bg-green-100',  desc:'Working day' },
            { label:'Off day',    color:'bg-gray-400',   text:'text-gray-600',   bg:'bg-gray-100',   desc:'Weekend/Rest' },
            { label:'Holiday',    color:'bg-red-400',    text:'text-red-600',    bg:'bg-red-100',    desc:'Public holiday' },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} border border-white rounded-xl px-3 py-2 flex items-center gap-2`}>
              <div className={`w-3 h-3 rounded-full ${item.color}`}/>
              <div>
                <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>
                <span className="text-xs text-gray-400 ml-1">— {item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Month stats */}
        <div className="flex gap-3">
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium border border-green-100">
            {shiftCount} shift days
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium border border-gray-100">
            {offCount} off days
          </span>
          {holidayCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium border border-red-100">
              {holidayCount} holidays
            </span>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Nav + bulk actions */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronLeft size={18} className="text-gray-500"/>
            </button>
            <h3 className="font-semibold text-gray-900 min-w-36 text-center">
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronRight size={18} className="text-gray-500"/>
            </button>
          </div>

          {/* Bulk action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => bulkSetMonth(calYear, calMonth, 'weekdays')}
              className="text-xs px-3 py-1.5 bg-indigo-200 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition font-medium">
              Set Mon–Fri
            </button>
            <button
              onClick={() => bulkSetMonth(calYear, calMonth, 'all_shift')}
              className="text-xs px-3 py-1.5 bg-green-200 text-green-600 border border-green-100 rounded-xl hover:bg-green-100 transition font-medium">
              All Shift
            </button>
            <button
              onClick={() => bulkSetMonth(calYear, calMonth, 'all_off')}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100 transition font-medium">
              All Off
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells */}
          {Array.from({length: firstDayOfWeek}, (_, i) => (
            <div key={`e${i}`} className="border-r border-b border-gray-50 min-h-20"/>
          ))}

          {/* Day cells */}
          {Array.from({length: daysInMonth}, (_, i) => {
            const day    = i + 1
            const key    = getDateKey(day)
            const status = getShiftStatus(key)
            const isToday = key === toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
            const isPast  = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

            const cellBg =
              status === 'shift'   ? 'bg-white  hover:bg-green-100'  :
              status === 'holiday' ? 'bg-white    hover:bg-red-100'    :
                                     'bg-gray-50   hover:bg-gray-100'

            const badgeStyle =
              status === 'shift'   ? 'bg-green-500  text-white'  :
              status === 'holiday' ? 'bg-red-400    text-white'  :
                                     'bg-gray-300   text-gray-600'

            const badgeLabel =
              status === 'shift'   ? 'Shift'   :
              status === 'holiday' ? 'Holiday' : 'Off'

            return (
              <div key={day}
                onClick={() => toggleShiftDay(key)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`${cellBg} border-r border-b border-gray-100 min-h-20 p-2 cursor-pointer transition-all relative group`}
              >
                {/* Day number */}
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1.5
                  ${isToday ? 'bg-indigo-600 text-white' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                  {day}
                </div>

                {/* Status badge */}
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${badgeStyle}`}>
                  {badgeLabel}
                </div>

                {/* Click hint on hover */}
                {hoveredDay === day && (
                  <div className="absolute bottom-1.5 right-1.5 text-xs text-gray-400 opacity-70">
                    click to change
                  </div>
                )}

                {/* Past day overlay */}
                {isPast && (
                  <div className="absolute inset-0 bg-white/40 pointer-events-none rounded"/>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-xs text-gray-400">
            {Object.keys(localChanges).length > 0
              ? `${Object.keys(localChanges).length} changes pending — click Save`
              : 'Changes are applied immediately to employee calendar'}
          </p>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Saving...</>
              : <><Save size={15}/> Save Schedule</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
function WorkScheduleSettings() {
  const [tab, setTab] = useState('shift')  // shift | timing

  return (
    <div className="space-y-4">

      {/* Sub tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id:'shift',  label:'Shift Calendar' },
          { id:'timing', label:'Work Timing'    },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-lg transition font-medium
              ${tab === t.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shift'  && <ShiftCalendarAdmin />}
      {tab === 'timing' && <WorkTimingSettings />}
    </div>
  )
}
function WorkTimingSettings() {
  const { settings, updateSettings } = useSettings()
  const [form,    setForm]    = useState({ ...settings })
  const [saved,   setSaved]   = useState(false)
  const [saving,setSaving]= useState(false)


  async function handleSave() {
    setSaving(true)
    try {
      // Save to localStorage
      updateSettings(form)

      // Also save to backend
      await API.post('/settings/work-schedule', {
        workStartTime:   form.workStartTime,
        workEndTime:     form.workEndTime,
        gracePeriodMins: parseInt(form.gracePeriodMins),
        requiredHours:   parseInt(form.requiredHours),
        workDays:        form.workDays.join(','),
      })
      setSaved(true)
      setTimeout(()=> setSaved(false),2500)
      }catch(err){
        console.error('Save failed:',err)
        //Still saved to localstroage
        setSaved(true)
        setTimeout(()=> setSaved(false),2500)
      }finally {
      setSaving(false)
    }
  }
  useEffect(() => {
  async function loadSettings() {
    try {
      const res = await API.get('/settings/work-schedule')
      const ws  = res.data
      const loaded = {
        ...settings,
        workStartTime:   ws.workStartTime,
        workEndTime:     ws.workEndTime,
        gracePeriodMins: ws.gracePeriodMins,
        requiredHours:   ws.requiredHours,
        workDays: ws.workDays
          ? ws.workDays.split(',').map(Number)
          : settings.workDays,
      }
      setForm(loaded)
      updateSettings(loaded) // sync to localStorage too
    } catch {
      // Use localStorage values
    }
  }
  loadSettings()
  }, [])

    // Calculate late time preview
  const [sh, sm]  = form.workStartTime.split(':').map(Number)
  const lateMins  = sh * 60 + sm + parseInt(form.gracePeriodMins || 0)
  const lateH     = Math.floor(lateMins / 60)
  const lateM     = lateMins % 60
  const lateTime  = `${String(lateH).padStart(2,'0')}:${String(lateM).padStart(2,'0')}`

  return (
    <div className="space-y-5">

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16}/> Work schedule saved! Attendance calculation updated.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Work Schedule Settings</h3>
        <p className="text-sm text-gray-400 mb-6">
          These settings control how attendance status is calculated.
        </p>

         <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Work Start Time
              </label>
              <input type="time" value={form.workStartTime}
                onChange={e => setForm({ ...form, workStartTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              <p className="text-xs text-gray-400 mt-1">Official start of work day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Work End Time
              </label>
              <input type="time" value={form.workEndTime}
                onChange={e => setForm({ ...form, workEndTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              <p className="text-xs text-gray-400 mt-1">Official end of work day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Grace Period (minutes)
              </label>
              <input type="number" min="0" max="60"
                value={form.gracePeriodMins}
                onChange={e => setForm({ ...form, gracePeriodMins: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              <p className="text-xs text-gray-400 mt-1">
                Employee marked LATE after{' '}
                <span className="font-semibold text-indigo-600">{lateTime}</span>
                {' '}({form.workStartTime} + {form.gracePeriodMins} min)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Required Hours Per Day
              </label>
              <input type="number" min="1" max="24"
                value={form.requiredHours}
                onChange={e => setForm({ ...form, requiredHours: parseInt(e.target.value) || 8 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              <p className="text-xs text-gray-400 mt-1">Below this = incomplete attendance</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-indigo-800 mb-3">
              How attendance is calculated:
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-400 mb-1">On Time</p>
                <p className="text-green-600 font-semibold">
                  Before {form.workStartTime}
                </p>
                <p className="text-gray-400 mt-1">→ Present</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-400 mb-1">Grace Period</p>
                <p className="text-amber-600 font-semibold">
                  {form.workStartTime} – {lateTime}
                </p>
                <p className="text-gray-400 mt-1">→ Present</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-400 mb-1">Late</p>
                <p className="text-red-500 font-semibold">After {lateTime}</p>
                <p className="text-gray-400 mt-1">→ Late</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50">
          {saving
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Saving...</>
            : <><Save size={15}/> Save Work Schedule</>
          }
        </button>
      </div>
    </div>
  )
}
// ── Helpers ──
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTimeShort(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${ampm}`
}

function calcDuration(clockIn, clockOut) {
  if (!clockIn || !clockOut) return null
  const [h1, m1] = clockIn.split(':').map(Number)
  const [h2, m2] = clockOut.split(':').map(Number)
  const total = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (total <= 0) return null
  return `${Math.floor(total / 60)}h ${total % 60}m`
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const today = new Date()
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Mock shift days (admin defined) ──
function generateShiftDays(year, month) {
  const days = {}
  const dim = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= dim; d++) {
    const dow = new Date(year, month, d).getDay()
    days[toDateKey(year, month, d)] = dow !== 0 && dow !== 6
  }
  // Override holidays
  days[toDateKey(year, month, 3)]  = false
  days[toDateKey(year, month, 17)] = false
  return days
}

// ── Mock attendance ──
function generateAttendance(year, month) {
  const records = {}
  const dim = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= dim; d++) {
    const key  = toDateKey(year, month, d)
    const date = new Date(year, month, d)
    const dow  = date.getDay()
    if (date > today) continue
    if (dow === 0 || dow === 6) continue
    if (d === 3 || d === 17) continue
    if (d === 5 || d === 12)      { records[key] = { status: 'Absent',     clockIn: null,  clockOut: null    }; continue }
    if (d === 8)                  { records[key] = { status: 'Leave',      clockIn: null,  clockOut: null    }; continue }
    if (d === 15)                 { records[key] = { status: 'Incomplete', clockIn: '09:02', clockOut: null  }; continue }
    if (d % 7 === 3)              { records[key] = { status: 'Late',       clockIn: '09:48', clockOut: '18:10'}; continue }
    const m = Math.floor(Math.random() * 9)
    records[key] = { status: 'Present', clockIn: `08:5${d%9}`, clockOut: `18:0${d%6}` }
  }
  return records
}

// ── Avatar ──
function Avatar({ name, size = 'sm' }) {
  const colors = ['bg-indigo-500','bg-violet-500','bg-amber-500','bg-pink-500','bg-green-500','bg-teal-500']
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }
  return (
    <div className={`${colors[idx]} ${sz[size]} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}

// ── Day Detail Modal ──
function DayDetailModal({ day, record, shiftDay, dateKey, onClose, onApplyForgot }) {
  const dateLabel = new Date(dateKey).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const canForgot = record && (record.status === 'Incomplete' || record.status === 'Absent')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{dateLabel}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${shiftDay ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {shiftDay ? 'Shift Day' : 'No Shift'}
              </span>
              {record?.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${record.status === 'Present'    ? 'bg-green-100  text-green-700'  : ''}
                  ${record.status === 'Late'       ? 'bg-amber-100  text-amber-700'  : ''}
                  ${record.status === 'Absent'     ? 'bg-red-100    text-red-600'    : ''}
                  ${record.status === 'Leave'      ? 'bg-blue-100   text-blue-600'   : ''}
                  ${record.status === 'Incomplete' ? 'bg-orange-100 text-orange-600' : ''}
                `}>{record.status}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={16} className="text-gray-400"/>
          </button>
        </div>

        <div className="p-5 space-y-3">
          {!shiftDay && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={22} className="text-gray-400"/>
              </div>
              <p className="text-gray-500 font-medium">Non-working day</p>
              <p className="text-gray-400 text-xs mt-1">Weekend or public holiday</p>
            </div>
          )}

          {shiftDay && !record && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock size={22} className="text-gray-400"/>
              </div>
              <p className="text-gray-500 font-medium">No record</p>
              <p className="text-gray-400 text-xs mt-1">Future date or not yet recorded</p>
            </div>
          )}

          {shiftDay && record && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Check In</p>
                  <p className={`text-xl font-bold ${record.clockIn ? 'text-green-600' : 'text-gray-300'}`}>
                    {formatTimeShort(record.clockIn) || '—'}
                  </p>
                  {record.clockIn && (
                    <p className={`text-xs mt-1 ${record.status === 'Late' ? 'text-amber-500' : 'text-green-500'}`}>
                      {record.status === 'Late' ? 'Late arrival' : 'On time'}
                    </p>
                  )}
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Check Out</p>
                  <p className={`text-xl font-bold ${record.clockOut ? 'text-red-500' : 'text-gray-300'}`}>
                    {formatTimeShort(record.clockOut) || '—'}
                  </p>
                  {!record.clockOut && record.clockIn && (
                    <p className="text-xs text-orange-500 mt-1">Missing</p>
                  )}
                </div>
              </div>

              {record.clockIn && record.clockOut && (
                <div className="bg-indigo-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total work hours</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {calcDuration(record.clockIn, record.clockOut)}
                  </span>
                </div>
              )}

              {record.status === 'Incomplete' && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2">
                  <AlertCircle size={15} className="text-orange-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-orange-700">Check out missing. Submit a forgot attendance request.</p>
                </div>
              )}

              {record.status === 'Absent' && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
                  <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-red-700">No attendance recorded. If incorrect, submit a request.</p>
                </div>
              )}
            </>
          )}
        </div>

        {canForgot && (
          <div className="px-5 pb-5">
            <button onClick={() => { onClose(); onApplyForgot(dateKey, record) }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-medium">
              <AlertCircle size={15}/> Apply Forgot Attendance Request
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Forgot Request Modal ──
function ForgotRequestModal({ dateKey, record, onClose, onSubmit }) {
  const [form, setForm] = useState({
    date:     dateKey,
    type:     !record?.clockIn ? 'Both' : 'Check Out',
    clockIn:  record?.clockIn  || '',
    clockOut: record?.clockOut || '',
    reason:   '',
  })
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!form.reason.trim()) { setError('Reason is required'); return }
    if ((form.type === 'Check In'  || form.type === 'Both') && !form.clockIn)  { setError('Enter check in time');  return }
    if ((form.type === 'Check Out' || form.type === 'Both') && !form.clockOut) { setError('Enter check out time'); return }
    onSubmit(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Forgot Attendance Request</h3>
            <p className="text-xs text-gray-400 mt-0.5">Submit for HR approval</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={16} className="text-gray-400"/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input value={form.date} readOnly
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What is missing?</label>
            <div className="grid grid-cols-3 gap-2">
              {['Check In','Check Out','Both'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={`py-2 text-xs rounded-xl border transition font-medium
                    ${form.type === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(form.type === 'Check In' || form.type === 'Both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Check In Time</label>
                <input type="time" value={form.clockIn}
                  onChange={e => { setForm({ ...form, clockIn: e.target.value }); setError('') }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
            )}
            {(form.type === 'Check Out' || form.type === 'Both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Check Out Time</label>
                <input type="time" value={form.clockOut}
                  onChange={e => { setForm({ ...form, clockOut: e.target.value }); setError('') }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea value={form.reason}
              onChange={e => { setForm({ ...form, reason: e.target.value }); setError('') }}
              placeholder="e.g. Internet connection failed, forgot to tap, device not working..."
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition resize-none
                ${error ? 'border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            Your request will be sent to HR for approval. You will be notified after review.
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium">
            <Send size={15}/> Submit Request
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
// ── Pre-generate attendance data ONCE (outside component) ──
const ATTENDANCE_DATA = generateAttendance(
  today.getFullYear(),
  today.getMonth()
)
// ── Attendance Calendar Component ──
function AttendanceCalendar() {
  const { getShiftStatus } = useSettings()   // ← add this
  const [calYear,   setCalYear]   = useState(today.getFullYear())
  const [calMonth,  setCalMonth]  = useState(today.getMonth())
  const [selected,  setSelected]  = useState(null)
  const [showForgot,setShowForgot]= useState(false)
  const [forgotData,setForgotData]= useState(null)
  const [requests,  setRequests]  = useState([])
  const [success,   setSuccess]   = useState(false)
  const [attendance, setAttendance] = useState({})   // ← real data
  const [loading,    setLoading]    = useState(false)

    const employeeId = localStorage.getItem('employeeId')

  // Load attendance when month changes
  useEffect(() => {
    loadAttendance()
  }, [calYear, calMonth])

  async function loadAttendance() {
    if (!employeeId) return
    setLoading(true)
    try {
      const res = await API.get(
        `/attendance/my/${employeeId}?year=${calYear}&month=${calMonth + 1}`
      )
      // Convert array to map: { '2026-03-01': { clockIn, clockOut, status } }
      const map = {}
      res.data.forEach(record => {
        map[record.workDate] = {
          status:   record.status,
          clockIn:  record.clockIn   ? record.clockIn.substring(0, 5)   : null,
          clockOut: record.clockOut  ? record.clockOut.substring(0, 5)  : null,
        }
      })
      setAttendance(map)
    } catch (err) {
      console.error('Failed to load attendance:', err)
      // Fall back to mock data
      setAttendance(ATTENDANCE_DATA)
    } finally {
      setLoading(false)
    }
  }

  // Submit forgot request to API

  async function handleSubmitForgot(formData) {
  const empId = localStorage.getItem('employeeId')
  console.log('Submitting forgot request, employeeId:', empId)
  console.log('Form data:', formData)

  if (!empId) {
    alert('Employee ID not found! Please login again.')
    return
  }

  try {
    const res = await API.post(`/attendance/forgot/${empId}`, {
      requestDate:       formData.date,
      missingType:       formData.type,
      requestedClockIn:  formData.clockIn  || null,
      requestedClockOut: formData.clockOut || null,
      reason:            formData.reason,
    })
    console.log('Success:', res.data)
    setRequests(prev => [
      ...prev,
      { ...formData, status: 'Pending', submittedAt: new Date().toLocaleString() }
    ])
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  } catch (err) {
    console.error('Failed:', err.response?.data || err.message)
    alert('Failed to submit: ' + (err.response?.data || err.message))
  }
}

  function getShiftForDay(day) {
    const key = toDateKey(calYear, calMonth, day)
    const result = getShiftStatus(key)
    if (day === 23) console.log('Day 23 shift status:', result)  // ← add this
    return result
  }
  const daysInMonth    = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay()

  const allRecords = Object.values(attendance)
  const stats = {
    present:    allRecords.filter(r => r.status === 'Present').length,
    late:       allRecords.filter(r => r.status === 'Late').length,
    absent:     allRecords.filter(r => r.status === 'Absent').length,
    leave:      allRecords.filter(r => r.status === 'Leave').length,
    incomplete: allRecords.filter(r => r.status === 'Incomplete').length,
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  function handleDayClick(day) {
    const key = toDateKey(calYear, calMonth, day)
    setSelected({ day, key, record: attendance[key], shiftDay: getShiftStatus(key) })
  }

  function handleApplyForgot(dateKey, record) {
    setForgotData({ dateKey, record })
    setShowForgot(true)
  }

  //function handleSubmitForgot(formData) {
  //  setRequests(prev => [
  //    ...prev,
  //    { ...formData, status: 'Pending', submittedAt: new Date().toLocaleString() }
  //  ])
  //  setSuccess(true)
  //  setTimeout(() => setSuccess(false), 3000)
  //}

  return (
    <div className="space-y-4">

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16}/> Request submitted! HR will review it soon.
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-3">
        {[
          { label: 'Present',    value: stats.present,    icon: Users,       color: 'emerald' },
          { label: 'Late',       value: stats.late,       icon: Clock,       color: 'amber' },
          { label: 'Absent',     value: stats.absent,     icon: XCircle,     color: 'rose' },
          { label: 'Leave',      value: stats.leave,      icon: Calendar,    color: 'sky' },
          { label: 'Incomplete', value: stats.incomplete, icon: AlertCircle, color: 'orange' },
        ].map((s, i) => {
          const Icon = s.icon;

          return (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">

                {/* LEFT */}
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">
                    {s.value}
                  </h3>
                </div>

                {/* RIGHT ICON */}
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center
                  ${s.color === 'emerald' && 'bg-emerald-300 text-emerald-600'}
                  ${s.color === 'amber' && 'bg-amber-300 text-amber-600'}
                  ${s.color === 'rose' && 'bg-rose-300 text-rose-600'}
                  ${s.color === 'sky' && 'bg-sky-300 text-sky-600'}
                  ${s.color === 'orange' && 'bg-orange-300 text-orange-600'}
                `}>
                  <Icon size={18} />
                </div>

              </div>
            </div>
          );
        })}
      </div>

{/* Calendar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/60 backdrop-blur">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-95">
            <ChevronLeft size={18} className="text-gray-500"/>
          </button>
          <h3 className="font-semibold text-gray-900 tracking-tight text-lg">{MONTH_NAMES[calMonth]} {calYear}</h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-95">
            <ChevronRight size={18} className="text-gray-500"/>
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-6 py-3 bg-gray-50/70 border-b border-gray-100">
          {[
            { label:'Shift day',  c:'bg-emerald-400'  },
            { label:'No shift',   c:'bg-gray-300'   },
            { label:'Present',    c:'bg-emerald-500'  },
            { label:'Late',       c:'bg-amber-500'  },
            { label:'Absent',     c:'bg-rose-500'    },
            { label:'Leave',      c:'bg-sky-500'   },
            { label:'Incomplete', c:'bg-orange-400' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <div className={`w-3 h-3 rounded-full ${l.c}`}/>
              {l.label}
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2.5">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`e${i}`} className="border-r border-b border-gray-50 min-h-[110px]"/>
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day    = i + 1
            const key    = toDateKey(calYear, calMonth, day)
            const date   = new Date(calYear, calMonth, day)
            const isToday   = key === toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
            const isFuture  = date > today
            const shiftStatus = getShiftForDay(day)  // 'shift' | 'off' | 'holiday'
            const isShift     = shiftStatus === 'shift'
            const isHoliday   = shiftStatus === 'holiday'
            const record    = attendance[key]

            let bg = 'bg-white hover:bg-gray-50'
            if (!isShift && !isFuture) bg = 'bg-gray-50 hover:bg-gray-100'


            return (
              <div key={day}
                onClick={() => handleDayClick(day)}
                className={`${bg} border-r border-b border-gray-100 min-h-[110px] p-2 cursor-pointer transition-all duration-200 hover:shadow-md relative`}>

                {/* Day number */}
                <div className={`w-7 h-7 text-xs font-semibold rounded-full flex items-center justify-center mb-1
                  ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700'}`}>
                  {day}
                </div>

                
                {/* Shift badge */}
                
                  <div className={`text-[10px] font-medium rounded-full px-2 py-0.5 inline-block mb-1
                    ${isShift   ? 'bg-emerald-400 text-white'   :
                      isHoliday ? 'bg-red-400     text-white'   :
                                  'bg-gray-200    text-gray-500'}`}>
                    {isShift ? 'Shift' : isHoliday ? 'Holiday' : 'Off'}
                  </div>
                

                {/* Times */}
                {!isFuture && isShift && record?.clockIn && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="text-emerald-600 font-medium">
                      In: {formatTimeShort(record.clockIn)}
                    </div>
                    {record.clockOut
                      ? <div className="text-rose-500 font-medium">Out: {formatTimeShort(record.clockOut)}</div>
                      : <div className="text-orange-500">Missing</div>
                    }
                    {record.clockOut && (
                      <div className="text-gray-400">
                        {calcDuration(record.clockIn, record.clockOut)}
                      </div>
                    )}
                  </div>
                )}

                {/* Status for no-clockin records */}
                {!isFuture && isShift && record && !record.clockIn && (
                  <div className={`mt-2 text-[11px] font-medium rounded-xl px-2 py-1 text-center
                    ${record.status === 'Absent' ? 'bg-red-200 text-rose-600 border border-rose-100'  : ''}
                    ${record.status === 'Leave'  ? 'bg-sky-200 text-sky-600 border border-sky-100' : ''}
                    `}>{record.status}</div>
                )}

                {/* Orange dot for incomplete */}
                {record?.status === 'Incomplete' && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-400 rounded-full ring-2 ring-white shadow-sm"/>
                )}
                {/* dot for present */}
                {record?.status === 'Present' && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white shadow-sm"/>
                )}
                {/* dot for Late */}
                {record?.status === 'Late' && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white shadow-sm"/>
                )}
                {/* dot for Absent */}
                {record?.status === 'Absent' && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 rounded-full ring-2 ring-white shadow-sm"/>
                )}
                {/* dot for Leave */}
                {record?.status === 'Leave' && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-400 rounded-full ring-2 ring-white shadow-sm"/>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Submitted requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">My Forgot Attendance Requests</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {requests.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.date}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Missing: {r.type} · {r.reason}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{r.submittedAt}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-600 px-2.5 py-0.5 rounded-full font-medium">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {selected && !showForgot && (
        <DayDetailModal
          day={selected.day} record={selected.record}
          shiftDay={selected.shiftDay} dateKey={selected.key}
          onClose={() => setSelected(null)}
          onApplyForgot={handleApplyForgot}
        />
      )}
      {showForgot && forgotData && (
        <ForgotRequestModal
          dateKey={forgotData.dateKey} record={forgotData.record}
          onClose={() => { setShowForgot(false); setForgotData(null) }}
          onSubmit={handleSubmitForgot}
        />
      )}
    </div>
  )
}

// ── Employee View ──
function EmployeeAttendanceView() {
  const {settings, isLate: checkIsLate } = useSettings()
  const [now,         setNow]         = useState(new Date())
  const [checkedIn,   setCheckedIn]   = useState(false)
  const [checkInTime, setCheckInTime] = useState(null)
  const [checkOutTime,setCheckOutTime]= useState(null)
  const [done,        setDone]        = useState(false)
  const [activeTab,   setActiveTab]   = useState('checkin')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

 // Get employee ID from localStorage
  const employeeId = localStorage.getItem('employeeId')

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load today's attendance on page load
  useEffect(() => {
    if (employeeId) loadTodayAttendance()
  }, [])

  async function loadTodayAttendance() {
    try {
      const res = await API.get(`/attendance/today/${employeeId}`)
      if (res.data && res.data.clockIn) {
        setCheckedIn(true)
        setCheckInTime(new Date(`2026-01-01T${res.data.clockIn}`))
        if (res.data.clockOut) {
          setCheckOutTime(new Date(`2026-01-01T${res.data.clockOut}`))
          setDone(true)
        }
      }
    } catch (err) {
      console.log('No attendance today yet')
    }
  }

  async function handleCheckIn() {
    if (!employeeId) { setError('Employee ID not found'); return }
    setLoading(true)
    setError('')
    try {
      const res = await API.post(`/attendance/checkin/${employeeId}`)
      setCheckedIn(true)
      setCheckInTime(new Date())
    } catch (err) {
      setError(err.response?.data || 'Check in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut() {
    if (!employeeId) { setError('Employee ID not found'); return }
    setLoading(true)
    setError('')
    try {
      const res = await API.post(`/attendance/checkout/${employeeId}`)
      setCheckOutTime(new Date())
      setDone(true)
    } catch (err) {
      setError(err.response?.data || 'Check out failed')
    } finally {
      setLoading(false)
    }
  }

  const nowTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const isLate = checkIsLate(nowTimeStr)

  return (
    <div className="p-6 space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id:'checkin', label:'Check In / Out' }, { id:'calendar', label:'My Calendar' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition font-medium
              ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'checkin' && (
        <div className="space-y-5">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {/* Clock banner */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">

              {/* LEFT SIDE */}
              <div>
                <p className="text-xs text-gray-400">
                  {formatDate(now)}
                </p>

                <div className="text-3xl font-semibold text-gray-900 mt-2">
                  {now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                {/* STATUS */}
                <div className="mt-2">
                  {!done && !checkedIn && (
                    <span className={`text-xs px-5 py-1 rounded-full font-medium
                      ${isLate
                        ? 'bg-amber-400 text-white'
                        : 'bg-emerald-400 text-white'
                      }`}>
                      {isLate ? 'Late' : 'On time'}
                    </span>
                  )}

                  {checkedIn && !done && (
                    <span className="text-xs bg-indigo-400 text-white-900 px-3 py-1 rounded-full">
                      Checked in
                    </span>
                  )}

                  {done && (
                    <span className="text-xs bg-gray-400 text-white px-3 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE BUTTON */}
              <div>
                {!checkedIn && !done && (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-900 transition disabled:opacity-50"
                  >
                    Check In
                  </button>
                )}

                {checkedIn && !done && (
                  <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="px-5 py-2 bg-rose-600 text-white text-sm rounded-xl hover:bg-red-900 transition disabled:opacity-50"
                  >
                    Check Out
                  </button>
                )}

                {done && (
                  <div className="px-5 py-2 bg-emerald-600 text-white text-sm rounded-xl">
                    Done
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Time cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Check In',   value: checkInTime  ? checkInTime.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})  : '-- : --', color: checkInTime  ? 'text-gray-900' : 'text-gray-300', sub: checkInTime  ? (isLate?'Late arrival':'On time') : '', sc: isLate?'text-amber-500 font-medium':'text-green-500 font-medium' },
              { label:'Check Out',  value: checkOutTime ? checkOutTime.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '-- : --', color: checkOutTime ? 'text-gray-900' : 'text-gray-300', sub: checkOutTime ? 'Checked out' : '',               sc: 'text-green-500' },
              { label:'Work Hours', value: done && checkInTime && checkOutTime
                  ? calcDuration(`${checkInTime.getHours()}:${String(checkInTime.getMinutes()).padStart(2,'0')}`,`${checkOutTime.getHours()}:${String(checkOutTime.getMinutes()).padStart(2,'0')}`) || '—'
                  : '-- : --', color: done ? 'text-indigo-600' : 'text-gray-300', sub: `Target: ${settings.requiredHours}h 00m`, sc: 'text-gray-400' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                {c.sub && <p className={`text-xs mt-1 ${c.sc}`}>{c.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && <AttendanceCalendar />}
    </div>
  )
}

// ── HR View ──
const mockHR = [
  { id:1, name:'Aung Kyaw Zin',  dept:'Engineering', clockIn:'08:55', clockOut:'18:05', status:'Present'  },
  { id:2, name:'Su Su Lwin',     dept:'HR',          clockIn:'09:00', clockOut:'18:00', status:'Present'  },
  { id:3, name:'Mg Mg Htun',     dept:'Finance',     clockIn:null,    clockOut:null,    status:'Leave'    },
  { id:4, name:'Ni Ni Win',      dept:'Design',      clockIn:'09:45', clockOut:'18:10', status:'Late'     },
  { id:5, name:'Zaw Lin Oo',     dept:'Marketing',   clockIn:'08:50', clockOut:'17:55', status:'Present'  },
  { id:6, name:'Thida Myint',    dept:'Operations',  clockIn:null,    clockOut:null,    status:'Absent'   },
  { id:7, name:'Kyaw Swar Htet', dept:'Engineering', clockIn:'09:55', clockOut:'18:30', status:'Late'     },
  { id:8, name:'Aye Aye Khin',   dept:'Finance',     clockIn:'08:58', clockOut:'18:02', status:'Present'  },
]

const mockForgot = [
  { id:1, name:'Ni Ni Win',  date:'2026-03-18', type:'Check Out', time:'18:00',       reason:'Internet failed',   status:'Pending'  },
  { id:2, name:'Zaw Lin Oo', date:'2026-03-15', type:'Check In',  time:'09:00',       reason:'Device not working',status:'Pending'  },
  { id:3, name:'Mg Mg Htun', date:'2026-03-10', type:'Both',      time:'09:00–18:00', reason:'Power outage',      status:'Approved' },
]

// ── Mock monthly data for all employees ──
const mockMonthlyData = [
  { id:1, name:'Aung Kyaw Zin',  dept:'Engineering', present:18, late:2, absent:1, leave:0,  total:21 },
  { id:2, name:'Su Su Lwin',     dept:'HR',          present:20, late:0, absent:0, leave:1,  total:21 },
  { id:3, name:'Mg Mg Htun',     dept:'Finance',     present:15, late:3, absent:0, leave:3,  total:21 },
  { id:4, name:'Ni Ni Win',      dept:'Design',      present:17, late:4, absent:0, leave:0,  total:21 },
  { id:5, name:'Zaw Lin Oo',     dept:'Marketing',   present:19, late:1, absent:1, leave:0,  total:21 },
  { id:6, name:'Thida Myint',    dept:'Operations',  present:10, late:2, absent:5, leave:4,  total:21 },
  { id:7, name:'Kyaw Swar Htet', dept:'Engineering', present:18, late:3, absent:0, leave:0,  total:21 },
  { id:8, name:'Aye Aye Khin',   dept:'Finance',     present:20, late:1, absent:0, leave:0,  total:21 },
]

// Weekly data — each employee's attendance for 7 days
const weekDays = ['Mon 16','Tue 17','Wed 18','Thu 19','Fri 20','Sat 21','Sun 22']
const mockWeeklyData = [
  { id:1, name:'Aung Kyaw Zin',  dept:'Engineering', days:['Present','Present','Late','Present','Present','Weekend','Weekend'] },
  { id:2, name:'Su Su Lwin',     dept:'HR',          days:['Present','Present','Present','Present','Present','Weekend','Weekend'] },
  { id:3, name:'Mg Mg Htun',     dept:'Finance',     days:['Leave','Leave','Leave','Present','Present','Weekend','Weekend'] },
  { id:4, name:'Ni Ni Win',      dept:'Design',      days:['Present','Late','Present','Late','Present','Weekend','Weekend'] },
  { id:5, name:'Zaw Lin Oo',     dept:'Marketing',   days:['Present','Present','Present','Present','Absent','Weekend','Weekend'] },
  { id:6, name:'Thida Myint',    dept:'Operations',  days:['Absent','Absent','Present','Present','Late','Weekend','Weekend'] },
  { id:7, name:'Kyaw Swar Htet', dept:'Engineering', days:['Present','Present','Present','Late','Present','Weekend','Weekend'] },
  { id:8, name:'Aye Aye Khin',   dept:'Finance',     days:['Present','Present','Late','Present','Present','Weekend','Weekend'] },
]

function HRAttendanceView() {
  const [activeTab,    setActiveTab]    = useState('report')
  const [viewMode,     setViewMode]     = useState('daily')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dailyData,    setDailyData]    = useState([])
  const [weeklyData,   setWeeklyData]   = useState(null)   // ← add
  const [monthlyData,  setMonthlyData]  = useState([])     // ← add
  const [forgotList,   setForgotList]   = useState([])
  const [loading,      setLoading]      = useState(false)
  const [dateFilter,   setDateFilter]   = useState(
    today.toISOString().split('T')[0]
  )

  // Current week number
  const currentWeek = Math.ceil(
    (today - new Date(today.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)
  )
  const [selectedWeek,  setSelectedWeek]  = useState(currentWeek)
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)

  useEffect(() => {
    loadDailyReport()
    loadForgotRequests()
  }, [])

  useEffect(() => { loadDailyReport()  }, [dateFilter])
  useEffect(() => { loadWeeklyReport() }, [selectedWeek, selectedYear])
  useEffect(() => { loadMonthlyReport()}, [selectedMonth, selectedYear])

  async function loadDailyReport() {
    setLoading(true)
    try {
      const res = await API.get(`/attendance/daily?date=${dateFilter}`)
      setDailyData(res.data)
    } catch (err) {
      console.error('Daily report failed:', err)
      setDailyData([])
    } finally {
      setLoading(false)
    }
  }

  async function loadWeeklyReport() {
    setLoading(true)
    try {
      const res = await API.get(
        `/attendance/weekly?year=${selectedYear}&week=${selectedWeek}`
      )
      setWeeklyData(res.data)
    } catch (err) {
      console.error('Weekly report failed:', err)
      setWeeklyData(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadMonthlyReport() {
    setLoading(true)
    try {
      const res = await API.get(
        `/attendance/monthly?year=${selectedYear}&month=${selectedMonth}`
      )
      setMonthlyData(res.data)
    } catch (err) {
      console.error('Monthly report failed:', err)
      setMonthlyData([])
    } finally {
      setLoading(false)
    }
  }

  async function loadForgotRequests() {
    try {
      const res = await API.get('/attendance/forgot')
      setForgotList(res.data)
    } catch (err) {
      setForgotList([])
    }
  }

  async function handleApproveForgot(reqId) {
    const adminId = localStorage.getItem('userId') || 1
    try {
      await API.put(`/attendance/forgot/${reqId}/approve/${adminId}`)
      await loadForgotRequests()
      await loadDailyReport()
    } catch (err) {
      alert('Failed to approve')
    }
  }

  async function handleRejectForgot(reqId) {
    const adminId = localStorage.getItem('userId') || 1
    try {
      await API.put(`/attendance/forgot/${reqId}/reject/${adminId}`)
      await loadForgotRequests()
    } catch (err) {
      alert('Failed to reject')
    }
  }

  const pendingCount = forgotList.filter(r => r.status === 'Pending').length

  const filteredDaily = dailyData.filter(r =>
    r.employeeName.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'All' || r.status === statusFilter)
  )

  const summary = {
    present: dailyData.filter(r => r.status === 'Present').length,
    late:    dailyData.filter(r => r.status === 'Late').length,
    absent:  dailyData.filter(r => r.status === 'Absent').length,
    leave:   dailyData.filter(r => r.status === 'Leave').length,
  }

  function getStatusStyle(status) {
    if (status === 'Present') return 'bg-green-300 text-green-700'
    if (status === 'Late')    return 'bg-amber-300 text-amber-700'
    if (status === 'Absent')  return 'bg-red-300   text-red-600'
    if (status === 'Leave')   return 'bg-blue-300  text-blue-600'
    if (status === 'Incomplete')   return 'bg-orange-300  text-orange-600'
    if (status === 'Weekend') return 'bg-gray-300  text-gray-400'
    if (status === 'Future')  return 'bg-gray-30   text-gray-300'
    return 'bg-gray-100 text-gray-400'
  }

  return (
    <div className="p-6 space-y-5">

      {/* Top tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id:'report',   label:'Attendance Report' },
            { id:'forgot',   label:`Forgot Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { id:'schedule', label:'Schedule Setting'  },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg transition font-medium
                ${activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* View mode switcher */}
        {activeTab === 'report' && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['daily','weekly','monthly'].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium capitalize
                  ${viewMode === v
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── REPORT TAB ── */}
      {activeTab === 'report' && (
        <div className="space-y-5">

          {/* ── DAILY ── */}
          {viewMode === 'daily' && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 gap-5 md:gap-6">
              {[
                { label:'Present Today', v:summary.present, color:'text-green-600', bg:'bg-green-300'},
                { label:'Late Entry',    v:summary.late,    color:'text-amber-600', bg:'bg-amber-300'},
                { label:'Absent',        v:summary.absent,  color:'text-red-600',bg:'bg-red-300'  },
                { label:'On Leave',      v:summary.leave,   color:'text-indigo-600' ,bg:'bg-indigo-300'},
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col">
		                <span className={`text-2xl font-semibold ${s.color}`}>
              		    {s.v}
            	      </span>
		                <span className="text-sm text-gray-500 mt-1">
              		    {s.label}
            	      </span>
		              </div>
		              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
            		    <Users size={20} className={s.color}/>
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
                  <Calendar size={14} className="text-gray-400"/>
                  <input type="date" value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none"/>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
                  <Filter size={14} className="text-gray-400"/>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none">
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">Leave</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition">
                  <Download size={15}/> Export
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400 text-sm">Loading...</p>
                </div>
              )}

              {/* Empty */}
              {!loading && filteredDaily.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-gray-400"/>
                  </div>
                  <p className="text-gray-600 font-medium">No attendance records</p>
                  <p className="text-gray-400 text-sm mt-1">No check-ins recorded for {dateFilter}</p>
                </div>
              )}

              {/* Table */}
              {!loading && filteredDaily.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Employee','Department','Check In','Check Out','Duration','Status'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredDaily.map((r, i) => (
                        <tr key={i} className="hover:bg-indigo-50 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.employeeName}/>
                              <span className="text-sm font-medium text-gray-900">{r.employeeName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-500">{r.department}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">
                            {r.clockIn  ? formatTimeShort(r.clockIn.substring(0,5))  : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">
                            {r.clockOut ? formatTimeShort(r.clockOut.substring(0,5)) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">
                            {r.clockIn && r.clockOut
                              ? calcDuration(r.clockIn.substring(0,5), r.clockOut.substring(0,5))
                              : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${r.status==='Present'?'bg-green-300 text-green-700':''}
                              ${r.status==='Late'   ?'bg-amber-300 text-amber-700':''}
                              ${r.status==='Absent' ?'bg-red-300   text-red-600'  :''}
                              ${r.status==='Leave'  ?'bg-blue-300  text-blue-600' :''}
                              ${r.status==='Incomplete'  ?'bg-orange-300  text-orange-600' :''}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── WEEKLY ── */}
          {viewMode === 'weekly' && (
            <div className="space-y-4">

              {/* Week selector */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
                  className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <ChevronLeft size={18} className="text-gray-500"/>
                </button>
                <div className="flex-1 text-center">
                  <p className="font-semibold text-gray-900">
                    Week {selectedWeek} — {selectedYear}
                  </p>
                  {weeklyData && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {weeklyData.weekStart} to {weeklyData.weekEnd}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedWeek(w => Math.min(52, w + 1))}
                  className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <ChevronRight size={18} className="text-gray-500"/>
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400 text-sm">Loading weekly data...</p>
                </div>
              )}

              {/* Weekly table */}
              {!loading && weeklyData && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Search */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-xs shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
                      <Search size={16} className="text-gray-400"/>
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search employee..."
                        className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"/>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 min-w-48">
                            Employee
                          </th>
                          {weeklyData.data[0]?.days.map((day, i) => (
                            <th key={i} className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-24">
                              <div>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
                              <div className="text-gray-300 font-normal normal-case">
                                {day.date.slice(5)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {weeklyData.data
                          .filter(emp =>
                            emp.employeeName.toLowerCase().includes(search.toLowerCase())
                          )
                          .map((emp, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition">
                              <td className="px-5 py-3.5 sticky left-0 bg-white">
                                <div className="flex items-center gap-3">
                                  <Avatar name={emp.employeeName}/>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                      {emp.employeeName}
                                    </div>
                                    <div className="text-xs text-gray-400">{emp.department}</div>
                                  </div>
                                </div>
                              </td>
                              {emp.days.map((day, j) => (
                                <td key={j} className="px-2 py-3.5 text-center">
                                  <div className="space-y-0.5">
                                    <span className={`${getStatusStyle(day.status)} text-xs px-2 py-0.5 rounded-full font-medium`}>
                                      {day.status === 'Weekend' ? '—'
                                       : day.status === 'Future' ? '—'
                                       : day.status.slice(0,3)}
                                    </span>
                                    {day.clockIn && (
                                      <div className="text-xs text-gray-400">
                                        {formatTimeShort(day.clockIn.substring(0,5))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MONTHLY ── */}
          {viewMode === 'monthly' && (
            <div className="space-y-4">

              {/* Month selector */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
                    else setSelectedMonth(m => m - 1)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <ChevronLeft size={18} className="text-gray-500"/>
                </button>
                <p className="flex-1 text-center font-semibold text-gray-900">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </p>
                <button
                  onClick={() => {
                    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
                    else setSelectedMonth(m => m + 1)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <ChevronRight size={18} className="text-gray-500"/>
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-gray-400 text-sm">Loading monthly data...</p>
                </div>
              )}

              {/* Monthly table */}
              {!loading && monthlyData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Employee','Department','Present','Late','Absent','Leave','Attendance %'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {monthlyData
                        .filter(emp =>
                          emp.employeeName.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((emp, i) => {
                          const rate = Math.round(
                            ((emp.present + emp.late) / emp.workingDays) * 100
                          )
                          return (
                            <tr key={i} className="hover:bg-indigo-50 transition">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar name={emp.employeeName}/>
                                  <span className="text-sm font-medium text-gray-900">
                                    {emp.employeeName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-gray-500">{emp.department}</td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-semibold text-green-600">{emp.present}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-semibold text-amber-600">{emp.late}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-semibold text-red-500">{emp.absent}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-semibold text-blue-600">{emp.leave}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                                    <div
                                      className={`h-1.5 rounded-full transition-all
                                        ${rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                                      style={{ width: `${Math.min(rate, 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-sm font-semibold
                                    ${rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {rate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty state */}
              {!loading && monthlyData.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar size={24} className="text-gray-400"/>
                  </div>
                  <p className="text-gray-600 font-medium">No data for this month</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FORGOT TAB ── */}
      {activeTab === 'forgot' && (
        <div className="space-y-4">
          {forgotList.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500 font-medium">No forgot requests</p>
            </div>
          )}
          {forgotList.map((req, i) => (
            <div key={req.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar name={req.employee?.fullName || req.name || 'Unknown'}/>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {req.employee?.fullName || req.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req.requestDate || req.date} · Missing: {req.missingType || req.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Reason: {req.reason}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Submitted: {req.submittedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === 'Pending' ? (
                    <>
                      <button onClick={() => handleApproveForgot(req.id)}
                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                        Approve
                      </button>
                      <button onClick={() => handleRejectForgot(req.id)}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium">
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                      ${req.status==='Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SCHEDULE TAB ── */}
      {activeTab === 'schedule' && <WorkScheduleSettings />}

    </div>
  )
}


// ── Main Export ──
export default function AttendancePage() {
  const role = localStorage.getItem('role') || 'EMPLOYEE'
  const isHR = role === 'ADMIN' || role === 'HR'

  return (
    <div>
      <div className="px-6 pt-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isHR ? 'Monitor and manage employee attendance' : 'Track your daily attendance'}
          </p>
        </div>
        {isHR && (
          <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100">
            <Users size={14}/> HR / Admin View
          </div>
        )}
      </div>
      {isHR ? <HRAttendanceView /> : <EmployeeAttendanceView />}
    </div>
  )
}