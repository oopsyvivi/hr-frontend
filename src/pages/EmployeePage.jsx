import {
  Search, Plus, Filter, MoreVertical, Eye, Edit2, Trash2,
  Mail, Phone, Building2, Briefcase, Calendar, ChevronLeft,
  X, Save, User, ArrowUpDown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import API from '../api/axios'

// Generate consistent color from name
// Same name always gets same color
function getAvatarColor(name) {
  const colors = [
    'bg-indigo-500',
    'bg-violet-500', 
    'bg-amber-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-orange-500',
  ]
  // Add up all character codes in the name
  const index = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  
  // Use remainder to pick a color
  return colors[index % colors.length]
}
function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const color    = getAvatarColor(name || '')
  const sizes    = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }
  return (
    <div className={`${color} ${sizes[size]} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}

// ── Status Badge ──
function StatusBadge({ status }) {
  const styles = {
    'Active':   'bg-green-300 text-green-700',
    'On Leave': 'bg-amber-300 text-amber-700',
    'Inactive': 'bg-red-300 text-red-600',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ── Add / Edit Employee Form ──
function EmployeeForm({ employee, onSave, onCancel, departments = [] }) {
  const isEdit = !!employee
  const [form, setForm] = useState(employee || {
    code: '',
    fullName: '', email: '', phone: '',
    position: '', department: '', hireDate: '',
    status: 'Active', role: 'EMPLOYEE', salary: '',
  })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: '' })
  }

  function validate() {
    const e = {}
    if (!form.fullName)   e.fullName   = 'Full name is required'
    if (!form.email)      e.email      = 'Email is required'
    if (!form.position)   e.position   = 'Position is required'
    if (!form.department) e.department = 'Department is required'
    if (!form.hireDate)   e.hireDate   = 'Hire date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
        onSave({
      ...form,
      id: employee?.id || Date.now(),
      
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

      {/* Form Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <ChevronLeft size={18} className="text-gray-500"/>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Update employee information' : 'Fill in the details to add a new employee'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            <X size={16}/> Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">
            <Save size={16}/> {isEdit ? 'Update' : 'Save Employee'}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input name="fullName" value={form.fullName} onChange={handleChange}
              placeholder="e.g. Aung Kyaw Zin"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 outline-none transition
                ${errors.fullName ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Employee Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Code</label>
            <input name="code" value={form.code} onChange={handleChange}
              placeholder="Auto-generated by system"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-gray-50"
              readOnly
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="employee@hrms.com"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 outline-none transition
                ${errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              placeholder="09-xxx-xxxx"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Position <span className="text-red-500">*</span>
            </label>
            <input name="position" value={form.position} onChange={handleChange}
              placeholder="e.g. Senior Developer"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 outline-none transition
                ${errors.position ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
            />
            {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select name="department" value={form.department} onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 outline-none transition bg-white
                ${errors.department ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
            >
              <option value="">Select department</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hire Date <span className="text-red-500">*</span>
            </label>
            <input name="hireDate" type="date" value={form.hireDate} onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 outline-none transition
                ${errors.hireDate ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
            />
            {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>}
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Salary (MMK)</label>
            <input name="salary" type="number" value={form.salary} onChange={handleChange}
              placeholder="e.g. 1000000"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">System Role</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Employee Profile View ──
function EmployeeProfile({ employee, onBack, onEdit }) {
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [leaveBalance,      setLeaveBalance]      = useState([])
  const [leaveTypes,        setLeaveTypes]        = useState([])
  const [loading,           setLoading]           = useState(true)

  useEffect(() => {
    loadProfileData()
  }, [employee.id])

  async function loadProfileData() {
    setLoading(true)
    try {
      const now   = new Date()
      const year  = now.getFullYear()
      const month = now.getMonth() + 1

      const [attRes, ltRes, balRes] = await Promise.all([
        // Attendance this month
        API.get(`/attendance/my/${employee.id}?year=${year}&month=${month}`)
          .catch(() => ({ data: [] })),
        // Leave types
        API.get('/leave-types')
          .catch(() => ({ data: [] })),
        // Leave balance
        API.get(`/leave/balance/${employee.id}`)
          .catch(() => ({ data: {} })),
      ])

      // Calculate attendance summary
      const records = attRes.data
      const present  = records.filter(r => r.status === 'Present').length
      const late     = records.filter(r => r.status === 'Late').length
      const absent   = records.filter(r => r.status === 'Absent').length
      const leave    = records.filter(r => r.status === 'Leave').length
      setAttendanceSummary({ present, late, absent, leave })

      // Build leave balance list
      const types = ltRes.data
      setLeaveTypes(types)
      const balData = balRes.data
      const balList = types.map(lt => ({
        name:      lt.name,
        total:     lt.daysPerYear,
        remaining: balData[lt.id] ?? lt.daysPerYear,
        used:      lt.daysPerYear - (balData[lt.id] ?? lt.daysPerYear),
      }))
      setLeaveBalance(balList)

    } catch (err) {
      console.error('Failed to load profile data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <button onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
            <ChevronLeft size={16}/> Back to Employees
          </button>
          <button onClick={() => onEdit(employee)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">
            <Edit2 size={15}/> Edit Employee
          </button>
        </div>

        <div className="flex items-center gap-5">
          <Avatar name={employee.fullName}  size="lg"/>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{employee.fullName}</h2>
            <p className="text-gray-500 mt-0.5">{employee.position}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={employee.status}/>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {employee.code}
              </span>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {employee.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            {[
              { icon: Mail,      label: 'Email',      value: employee.email      },
              { icon: Phone,     label: 'Phone',      value: employee.phone      },
              { icon: Building2, label: 'Department', value: employee.department },
              { icon: Briefcase, label: 'Position',   value: employee.position   },
              { icon: Calendar,  label: 'Hire Date',  value: employee.hireDate   },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-indigo-600"/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800">{item.value || '—'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Employment Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Employment Details
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Employee Code', value: employee.code    },
              { label: 'Department',    value: employee.department },
              { label: 'Salary',        value: `MMK${employee.salary?.toLocaleString() || '—'}` },
              { label: 'System Role',   value: employee.role    },
              { label: 'Status',        value: employee.status  },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance summary placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Attendance This Month
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Present', value: attendanceSummary?.present || 0, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Absent',  value: attendanceSummary?.absent  || 0,  color: 'text-red-500',   bg: 'bg-red-50'   },
              { label: 'Late',   value: attendanceSummary?.late   || 0,  color: 'text-amber-600', bg: 'bg-amber-50' },
              { label:'Leave',   value: attendanceSummary?.leave  ||0, color:'text-blue-600',  bg:'bg-blue-50'  },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave balance placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Leave Balance
          </h3>
          {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
          </div>
          ) : leaveBalance.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No leave types configured</p>
          ) : (
          <div className="space-y-3">
            {leaveBalance.map((item, i) => {
              const pct = Math.min((item.used / item.total) * 100, 100)
              const barColors = ['bg-indigo-500','bg-amber-500','bg-green-500','bg-rose-500','bg-violet-500']
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-medium">{item.name}</span>
                    <span>
                      <span className="font-semibold text-gray-700">{item.remaining}</span>
                      <span className="text-gray-400"> / {item.total} days remaining</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`${barColors[i % barColors.length]} h-1.5 rounded-full transition-all`}
                      style={{ width: `${pct}% `}}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

function MyProfileView({employeeId}) {
  const [employee, setEmployee] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    loadMyProfile()
  }, [employeeId])

  async function loadMyProfile() {
    if (!employeeId) { setLoading(false); return }
    try {
      const res = await API.get(`/employees/${employeeId}`)
      setEmployee(res.data)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!employeeId || !employee) return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="font-semibold text-amber-800">Profile not linked</p>
        <p className="text-sm text-amber-600 mt-1">
          Your account is not linked to an employee record.
          Please contact HR to set up your profile.
        </p>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
        <p className="text-sm text-gray-400 mt-0.5">Your personal employment details</p>
      </div>
      {/* Reuse EmployeeProfile but without edit/back buttons */}
      <EmployeeProfileReadOnly employee={employee}/>
    </div>
  )
}
function EmployeeProfileReadOnly({ employee }) {
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [leaveBalance,      setLeaveBalance]      = useState([])
  const [loading,           setLoading]           = useState(true)

  useEffect(() => {
    loadData()
  }, [employee.id])

  async function loadData() {
    setLoading(true)
    try {
      const now   = new Date()
      const year  = now.getFullYear()
      const month = now.getMonth() + 1

      const [attRes, ltRes, balRes] = await Promise.all([
        API.get(`/attendance/my/${employee.id}?year=${year}&month=${month}`)
          .catch(() => ({ data: [] })),
        API.get('/leave-types')
          .catch(() => ({ data: [] })),
        API.get(`/leave/balance/${employee.id}`)
          .catch(() => ({ data: {} })),
      ])

      const records = attRes.data
      setAttendanceSummary({
        present: records.filter(r => r.status === 'Present').length,
        late:    records.filter(r => r.status === 'Late').length,
        absent:  records.filter(r => r.status === 'Absent').length,
        leave:   records.filter(r => r.status === 'Leave').length,
      })

      const types  = ltRes.data
      const balData= balRes.data
      setLeaveBalance(types.map(lt => ({
        name:      lt.name,
        total:     lt.daysPerYear,
        remaining: balData[lt.id] ?? lt.daysPerYear,
        used:      lt.daysPerYear - (balData[lt.id] ?? lt.daysPerYear),
      })))

    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const colors   = ['bg-indigo-500','bg-violet-500','bg-amber-500','bg-pink-500','bg-teal-500']
  const colorIdx = employee.fullName.split('').reduce((s,c)=>s+c.charCodeAt(0),0) % colors.length
  const initials = employee.fullName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className="space-y-5">

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className={`${colors[colorIdx]} w-16 h-16 rounded-2xl flex items-center justify-center`}>
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{employee.fullName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{employee.position}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100 font-medium">
                {employee.department}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {employee.status}
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
                {employee.code}
              </span>
            </div>
          </div>
        </div>
      </div>
        {/* Info — no salary shown to employee */}
      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            {[
              { icon: Mail,      label: 'Email',      value: employee.email      },
              { icon: Phone,     label: 'Phone',      value: employee.phone      },
              { icon: Building2, label: 'Department', value: employee.department },
              { icon: Briefcase, label: 'Position',   value: employee.position   },
              { icon: Calendar,  label: 'Hire Date',  value: employee.hireDate   },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-indigo-600"/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800">{item.value || '—'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Employment Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Employment Details
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Employee Code', value: employee.code    },
              { label: 'Department',    value: employee.department },
              { label: 'Salary',        value: `MMK${employee.salary?.toLocaleString() || '—'}` },
              { label: 'System Role',   value: employee.role    },
              { label: 'Status',        value: employee.status  },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
</div>
      {/* Attendance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Attendance This Month</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label:'Present', value: attendanceSummary?.present||0, color:'text-green-600', bg:'bg-green-50' },
              { label:'Late',    value: attendanceSummary?.late   ||0, color:'text-amber-600', bg:'bg-amber-50' },
              { label:'Absent',  value: attendanceSummary?.absent ||0, color:'text-red-500',   bg:'bg-red-50'   },
              { label:'Leave',   value: attendanceSummary?.leave  ||0, color:'text-blue-600',  bg:'bg-blue-50'  },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave balance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Leave Balance</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <div className="space-y-3">
            {leaveBalance.map((item, i) => {
              const pct = Math.min((item.used / item.total) * 100, 100)
              const bars = ['bg-indigo-500','bg-amber-500','bg-green-500','bg-rose-500']
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-medium">{item.name}</span>
                    <span>
                      <span className="font-semibold text-gray-700">{item.remaining}</span>
                      <span className="text-gray-400"> / {item.total} remaining</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${bars[i%bars.length]} h-1.5 rounded-full`}
                      style={{ width:`${pct}% `}}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
export default function EmployeePage() {
  const role       = localStorage.getItem('role')       || 'EMPLOYEE'
  const employeeId = localStorage.getItem('employeeId')
  const isHR       = role === 'ADMIN' || role === 'HR'

  // Employee sees only their own profile
  if (!isHR) {
    return <MyProfileView employeeId={employeeId}/>
  }

  // HR/Admin sees full employee list
  return <HREmployeeView />
}
// ── Employee List ──
function HREmployeeView() {
  const [employees,   setEmployees]   = useState([])
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [view, setView]             = useState('list')  // list | add | edit | profile
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortField, setSortField]   = useState('fullName')
  const [sortDir, setSortDir]       = useState('asc')
  const [openMenu, setOpenMenu]     = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10


  // ── Load data from API ──
  useEffect(() => {
    loadEmployees()
    loadDepartments()
  }, [])

  async function loadEmployees() {
    try {
      const res = await API.get('/employees')
      setEmployees(res.data)
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadDepartments() {
    try {
      const res = await API.get('/departments')
      setDepartments(res.data)
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }

  // ── Filter + Sort ──
  const filtered = employees
    .filter(e => {
      const matchSearch = e.fullName.toLowerCase().includes(search.toLowerCase()) ||
                          e.email.toLowerCase().includes(search.toLowerCase()) ||
                          e.code.toLowerCase().includes(search.toLowerCase())
      const matchDept   = deptFilter === 'All' || e.department === deptFilter
      const matchStatus = statusFilter === 'All' || e.status === statusFilter
      return matchSearch && matchDept && matchStatus
    })
    .sort((a, b) => {
      const valA = a[sortField]?.toString().toLowerCase()
      const valB = b[sortField]?.toString().toLowerCase()
      return sortDir === 'asc'
        ? valA?.localeCompare(valB)
        : valB?.localeCompare(valA)
    })
    // ── Pagination ──
    const totalPages  = Math.ceil(filtered.length / itemsPerPage)
    const startIndex  = (currentPage - 1) * itemsPerPage
    const endIndex    = startIndex + itemsPerPage
    const paginated   = filtered.slice(startIndex, endIndex)

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setCurrentPage(1)  // ← reset to page 1 when sorting
  }

  async function handleSave(formData) {
    try {
      if (view === 'edit') {
        await API.put(`/employees/${formData.id}`, formData)
      } else {
        await API.post('/employees', formData)
      }
      await loadEmployees()
      setView('list')
      setSelectedEmp(null)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await API.delete(`/employees/${id}`)
        await loadEmployees()
        setOpenMenu(null)
      } catch (err) {
        alert('Failed to delete employee')
      }
    }
  }

  function handleEdit(emp) {
    setSelectedEmp(emp)
    setView('edit')
  }

  function handleView(emp) {
    setSelectedEmp(emp)
    setView('profile')
    setOpenMenu(null)
  }

  // ── Profile View ──
  if (view === 'profile') {
    return (
      <div className="p-6">
        <EmployeeProfile
          employee={selectedEmp}
          onBack={() => { setView('list'); setSelectedEmp(null) }}
          onEdit={handleEdit}
        />
      </div>
    )
  }

  // ── Add / Edit Form ──
  if (view === 'add' || view === 'edit') {
    return (
      <div className="p-6">
        <EmployeeForm
          employee={view === 'edit' ? selectedEmp : null}
          onSave={handleSave}
          onCancel={() => { setView('list'); setSelectedEmp(null) }}
          departments={departments}
        />
      </div>
    )
  }

  // ── List View ──
 // ── List View ──
if (loading) {
  return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-400 text-sm">Loading employees...</p>
      </div>
    </div>
  )
}

return (
  <div className="p-6 space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-400 mt-0.5">{employees.length} total employees</p>
        </div>
        <button
          onClick={() => setView('add')}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          <Plus size={16}/> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <Search size={16} className="text-gray-400 flex-shrink-0"/>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by name, email or code..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-gray-400 hover:text-gray-600"/>
              </button>
            )}
          </div>

          {/* Department filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            
            <Filter size={16} className="text-gray-400" />

            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="
                bg-transparent
                text-sm text-gray-700
                outline-none
                cursor-pointer
                pr-2
              "
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer pr-2"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>

        {/* Results count */}
        <div className="mt-3 text-xs text-gray-400">
          Showing {filtered.length} of {employees.length} employees
          {(search || deptFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => { setSearch(''); setDeptFilter('All'); setStatusFilter('All') }}
              className="ml-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  { label: 'Employee',   field: 'fullName'    },
                  { label: 'Department', field: 'department'  },
                  { label: 'Position',   field: 'position'    },
                  { label: 'Hire Date',  field: 'hireDate'    },
                  { label: 'Status',     field: 'status'      },
                ].map(col => (
                  <th key={col.field}
                    className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition"
                    onClick={() => handleSort(col.field)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown size={12} className={sortField === col.field ? 'text-indigo-600' : 'text-gray-300'}/>
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(emp => (
                <tr key={emp.id} className="hover:bg-indigo-50 transition cursor-pointer"
                  onClick={() => handleView(emp)}>

                  {/* Employee */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.fullName}  size="sm"/>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{emp.fullName}</div>
                        <div className="text-xs text-gray-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600">{emp.department}</span>
                  </td>

                  {/* Position */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600">{emp.position}</span>
                  </td>

                  {/* Hire Date */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-500">{emp.hireDate}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={emp.status}/>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleView(emp)}
                        className="p-1.5 hover:bg-indigo-100 rounded-lg transition text-gray-400 hover:text-indigo-600">
                        <Eye size={15}/>
                      </button>
                      <button onClick={() => handleEdit(emp)}
                        className="p-1.5 hover:bg-amber-100 rounded-lg transition text-gray-400 hover:text-amber-600">
                        <Edit2 size={15}/>
                      </button>
                      <button onClick={() => handleDelete(emp.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition text-gray-400 hover:text-red-500">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <User size={24} className="text-gray-400"/>
                    </div>
                    <p className="text-gray-500 font-medium">No employees found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                    <button
                      onClick={() => { setSearch(''); setDeptFilter('All'); setStatusFilter('All') }}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">

          {/* Left — showing info */}
          <p className="text-xs text-gray-400">
            Showing {startIndex + 1}–{Math.min(endIndex, filtered.length)} of {filtered.length} employees
          </p>

          {/* Right — page buttons */}
          <div className="flex items-center gap-1">

            {/* Previous button */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs rounded-lg transition
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:bg-gray-100 enabled:text-gray-500
                enabled:hover:bg-indigo-50 enabled:hover:text-indigo-600"
            >
              ← Prev
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              )
              .reduce((acc, page, idx, arr) => {
                // Add dots if there is a gap between page numbers
                if (idx > 0 && page - arr[idx - 1] > 1) {
                  acc.push('...')
                }
                acc.push(page)
                return acc
              }, [])
              .map((page, idx) =>
                page === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 text-xs rounded-lg transition font-medium
                      ${currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                  >
                    {page}
                  </button>
                )
              )
            }

            {/* Next button */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-xs rounded-lg transition
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:bg-gray-100 enabled:text-gray-500
                enabled:hover:bg-indigo-50 enabled:hover:text-indigo-600"
            >
              Next →
            </button>

          </div>
        </div>
      )}
      </div>
    </div>
  )
}