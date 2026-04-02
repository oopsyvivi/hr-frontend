import { createContext, useContext, useState } from 'react'

const defaultSettings = {
  workStartTime:   '09:00',
  workEndTime:     '18:00',
  gracePeriodMins: 15,
  requiredHours:   8,
  companyName:     'HRMS Company',
  companyEmail:    'hr@company.com',
  companyPhone:    '09-123-4567',
  companyAddress:  'Yangon, Myanmar',
  timezone:        'Asia/Yangon',
}

// Generate default shift days for a month
// Mon-Fri = shift, Sat-Sun = off
function generateDefaultShifts(year, month) {
  const shifts = {}
  const dim = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= dim; d++) {
    const dow = new Date(year, month, d).getDay()
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    shifts[key] = dow !== 0 && dow !== 6 ? 'shift' : 'off'
  }
  return shifts
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('hrms_settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })

  // shiftCalendar: { '2026-03-01': 'shift'|'off'|'holiday' }
  const [shiftCalendar, setShiftCalendar] = useState(() => {
    const saved = localStorage.getItem('hrms_shifts')
    return saved ? JSON.parse(saved) : {}
  })

  function updateSettings(newSettings) {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    localStorage.setItem('hrms_settings', JSON.stringify(merged))
  }

  // Get shift status for a specific date
  function getShiftStatus(dateKey) {
    if (shiftCalendar[dateKey]) return shiftCalendar[dateKey]
    // Default — weekday = shift, weekend = off
    const date = new Date(dateKey)
    const dow  = date.getDay()
    return dow === 0 || dow === 6 ? 'off' : 'shift'
  }

  // Toggle a single day
  function toggleShiftDay(dateKey) {
    const current = getShiftStatus(dateKey)
    const next = current === 'shift' ? 'off'
               : current === 'off'   ? 'holiday'
               : 'shift'
    const updated = { ...shiftCalendar, [dateKey]: next }
    setShiftCalendar(updated)
    localStorage.setItem('hrms_shifts', JSON.stringify(updated))
  }

  // Set a specific status for a day
  function setShiftDay(dateKey, status) {
    const updated = { ...shiftCalendar, [dateKey]: status }
    setShiftCalendar(updated)
    localStorage.setItem('hrms_shifts', JSON.stringify(updated))
  }

  // Bulk set entire month
  function bulkSetMonth(year, month, mode) {
    const dim = new Date(year, month + 1, 0).getDate()
    const updated = { ...shiftCalendar }
    for (let d = 1; d <= dim; d++) {
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dow = new Date(year, month, d).getDay()
      if (mode === 'weekdays') {
        updated[key] = dow === 0 || dow === 6 ? 'off' : 'shift'
      } else if (mode === 'all_shift') {
        updated[key] = 'shift'
      } else if (mode === 'all_off') {
        updated[key] = 'off'
      }
    }
    setShiftCalendar(updated)
    localStorage.setItem('hrms_shifts', JSON.stringify(updated))
  }

  function isLate(clockInTime) {
    if (!clockInTime) return false
    const [sh, sm] = settings.workStartTime.split(':').map(Number)
    const lateAfter = sh * 60 + sm + settings.gracePeriodMins
    const [ch, cm]  = clockInTime.split(':').map(Number)
    return (ch * 60 + cm) > lateAfter
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      shiftCalendar,
      getShiftStatus,
      toggleShiftDay,
      setShiftDay,
      bulkSetMonth,
      isLate,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}