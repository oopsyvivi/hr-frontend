import { useState, useEffect } from 'react'
import { Users, ChevronLeft,CheckCircle, Circle,AlertTriangle,FileText, Moon,ClipboardList,Calendar,Zap,ArrowUpRight,Activity, Wallet,Building2 ,LayoutDashboard, CalendarCheck, Clock, DollarSign , UserPlus, BarChart3,Search,Bell,LogOut,PanelLeftClose,Hand,ArrowUp, ArrowDown, Settings} from "lucide-react";
import EmployeePage from './EmployeePage'
import DepartmentPage from './DepartmentPage'
import AttendancePage from './AttendancePage'
import SettingsPage from './SettingsPage'
import LeavePage from './LeavePage'
import OvertimePage from './OvertimePage'
import PayrollPage from './PayrollPage'
import API from '../api/axios'

// ── Mock data ──
//const stats = [
//  { label: 'Total Employees', value: '124', change: '+4 this month',      up: true,  icon: Users, bg: 'bg-white',  iconBg: 'bg-indigo-100',  text: 'text-indigo-600' },
//  { label: 'Present Today',   value: '98',  change: '79% attendance',     up: true,  icon: CheckCircle, bg: 'bg-white',   iconBg: 'bg-green-100',   text: 'text-green-600'  },
//  { label: 'On Leave',        value: '12',  change: '3 pending approval', up: false, icon: FileText, bg: 'bg-white',   iconBg: 'bg-amber-100',   text: 'text-amber-600'  },
//  { label: 'Open Positions',  value: '7',   change: '2 urgent',           up: false, icon: ClipboardList, bg: 'bg-white',     iconBg: 'bg-red-100',     text: 'text-red-500'    },
//]

//const recentEmployees = [
//  { name: 'Aung Kyaw Zin', position: 'Senior Developer', dept: 'Engineering', status: 'Active',   avatar: 'AK', color: 'bg-indigo-500' },
//  { name: 'Su Su Lwin',    position: 'HR Manager',       dept: 'HR',          status: 'Active',   avatar: 'SL', color: 'bg-violet-500' },
//  { name: 'Mg Mg Htun',    position: 'Accountant',       dept: 'Finance',     status: 'On Leave', avatar: 'MH', color: 'bg-amber-500'  },
//  { name: 'Ni Ni Win',     position: 'UI Designer',      dept: 'Design',      status: 'Active',   avatar: 'NW', color: 'bg-indigo-400' },
//  { name: 'Zaw Lin Oo',    position: 'Marketing Lead',   dept: 'Marketing',   status: 'Active',   avatar: 'ZO', color: 'bg-green-500'  },
//]

//const leaveRequests = [
//  { name: 'Mg Mg Htun', type: 'Annual Leave', days: 3, date: 'Mar 15–17', status: 'Pending'  },
//  { name: 'Ni Ni Win',  type: 'Sick Leave',   days: 1, date: 'Mar 14',    status: 'Approved' },
//  { name: 'Zaw Lin Oo', type: 'Annual Leave', days: 5, date: 'Mar 20–24', status: 'Pending'  },
//]
// ── helpers ──────────────────────────────────────────
function fmtMMK(v) {
  if (!v) return '— MMK'
  return new Intl.NumberFormat('en-US').format(Math.round(v)) + ' MMK'
}

function fmtTime(t) {
  if (!t) return '—'
  const [h, m] = t.substring(0, 5).split(':').map(Number)
  const a = h >= 12 ? 'PM' : 'AM'
  const d = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${d}:${String(m).padStart(2,'0')} ${a}`
}


const attendanceData = [30, 72, 80, 75, 45, 92, 85, 90, 78, 95, 88, 98]
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const role = localStorage.getItem('role') || 'EMPLOYEE'
const isHR = role === 'ADMIN' || role === 'HR'
const menuItems = [

      { id:'dashboard',   icon:LayoutDashboard, label:'Dashboard'   },
      { id:'employees',   icon:Users,           label:'Employees'   },
      // Departments — HR/Admin only
      ...(isHR ? [{ id:'departments', icon:Building2, label:'Departments' }] : []),
      { id:'attendance',  icon:CalendarCheck,   label:'Attendance'  },
      { id:'leave',       icon:FileText,        label:'Leave'       },
      { id:'overtime',    icon:Clock,           label:'Overtime'    },
      { id:'payroll',     icon:Wallet,          label:'Payroll'     },
      ...(isHR ? [{ id:'settings', icon:Settings, label:'Settings' }] : []),

]

// ── Bar Chart ──
function AttendanceChart() {
  const max = Math.max(...attendanceData)
  return (
    <div className="mt-4">
      {/* Bar container with fixed height */}
      <div className="flex items-end gap-3" style={{ height: '96px' }}>
        {attendanceData.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="w-full bg-indigo-500 hover:bg-indigo-700 transition-all cursor-pointer rounded-t-md"
              style={{ height: `${(val / max) * 96}px` }}
              title={`${months[i]}: ${val}%`}
            />
          </div>
        ))}
      </div>
      {/* Month labels */}
      <div className="flex gap-1.5 mt-1">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-gray-400 text-xs">{m.slice(0, 1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Donut Chart ──
function DonutChart({ present, leave, absent }) {
  const total = present + leave + absent
  const circ  = 2 * Math.PI * 40
  const pDash = (present / total) * circ
  const lDash = (leave   / total) * circ
  const aDash = (absent  / total) * circ
  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="12"
          strokeDasharray={`${pDash} ${circ - pDash}`}
          strokeDashoffset={circ / 4} strokeLinecap="round" transform="rotate(-90 50 50)"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
          strokeDasharray={`${lDash} ${circ - lDash}`}
          strokeDashoffset={circ / 4 - pDash} strokeLinecap="round" transform="rotate(-90 50 50)"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
          strokeDasharray={`${aDash} ${circ - aDash}`}
          strokeDashoffset={circ / 4 - pDash - lDash} strokeLinecap="round" transform="rotate(-90 50 50)"/>
        <text x="50" y="46" textAnchor="middle"
          style={{ fontSize: '14px', fontWeight: '700', fill: '#111827' }}>{present}</text>
        <text x="50" y="60" textAnchor="middle"
          style={{ fontSize: '9px', fill: '#6b7280' }}>present</text>
      </svg>
      <div className="flex flex-col gap-2.5">
        {[
          { color: 'bg-indigo-500', label: 'Present',  val: present },
          { color: 'bg-amber-400',  label: 'On Leave', val: leave   },
          { color: 'bg-red-400',    label: 'Absent',   val: absent  },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}/>
            <span className="text-sm text-gray-500">
              {item.label} <span className="font-semibold text-gray-800">{item.val}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sidebar ──
function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const name = localStorage.getItem('fullName') || 'Admin User'
  const role = localStorage.getItem('role')     || 'ADMIN'

  return (
  <div className={`${collapsed ? 'w-16' : 'w-60'} transition-all duration-300 bg-white border-r border-gray-100 flex flex-col h-screen flex-shrink-0`}>

      {/* Logo section */}
      <div className="flex items-center justify-between px-3 py-5 border-b border-gray-100">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <span className="text-xl">☰</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">HR</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 font-bold text-sm truncate">HRMS System</div>
                <div className="text-gray-400 text-xs truncate">Management Portal</div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-300 hover:text-indigo-600 transition-colors text-sm flex-shrink-0 ml-2"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400 cursor-pointer" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {!collapsed && (
          <p className="text-gray-400 text-xs uppercase tracking-widest px-4 mb-2 font-medium">
            Main Menu
          </p>
        )}
        {menuItems.map(item => {
          const Icon = item.icon
          return(
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all
              ${active === item.id
                ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
             <Icon size={18} strokeWidth={1.5} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        )
   })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-100 p-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 text-sm font-medium truncate">{name}</div>
                <div className="text-gray-400 text-xs">{role}</div>
              </div>
              <button
              onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('role')
                  localStorage.removeItem('fullName')
                  localStorage.removeItem('email')
                  window.location.href = '/'
                }}
                title="Logout"
                className="text-gray-300 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-500 cursor-pointer" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Header ──
function Header({ activeMenu }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const label = menuItems.find(m => m.id === activeMenu)?.label || 'Dashboard'
  const name  = localStorage.getItem('fullName') || 'A'

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{label}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          
          <Search className="w-4 h-4 text-gray-900" />
          <input
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-36"
          />
        </div>
        <button className="relative p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/>
        </button>
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition">
          <span className="text-white text-sm font-bold">
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ──
function StatCard({ label, value, change, up, icon:Icon, bg, iconBg, text }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-white shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} w-11 h-11 rounded-xl flex items-center justify-center text-xl`}>
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full
          ${up ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {up ? <ArrowUp className="w-4 h-4 text-green-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
        </span>
      </div>
      <div className={`text-3xl font-bold ${text} mb-1`}>{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{change}</div>
    </div>
  )
}

// ── Dashboard Content ──
function DashboardContent({setActive}) {
  const role       = localStorage.getItem('role')     || 'EMPLOYEE'
  const employeeId = localStorage.getItem('employeeId')
  const isHR       = role === 'ADMIN' || role === 'HR'

  return isHR
    ? <HrDashboard />
    : <EmployeeDashboard employeeId={employeeId} setActive={setActive}/>
}

function HrDashboard() {
  const [time,      setTime]      = useState(new Date())
  const [loading,   setLoading]   = useState(true)
  const [dashData,  setDashData]  = useState(null)
  const name = localStorage.getItem('fullName') || 'Admin'

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load real data
  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const res = await API.get('/dashboard/hr-stats')
      setDashData(res.data)
    } catch (err) {
      console.error('Dashboard load failed:', err)
      // Fallback mock so UI doesn't break
      setDashData({
        totalEmployees:        0,
        presentToday:          0,
        lateToday:             0,
        onLeaveToday:          0,
        attendanceRate:        0,
        pendingLeaveRequests:  0,
        pendingOvertimeRequests: 0,
        recentEmployees:       [],
        recentLeaveRequests:   [],
        monthlyChart:          [],
      })
    } finally {
      setLoading(false)
    }
  }

  const greeting = time.getHours() < 12 ? 'Morning'
                 : time.getHours() < 18 ? 'Afternoon' : 'Evening'

  // Build stats array from real data
  const stats = dashData ? [
    {
      label: 'Total Employees',
      value: dashData.totalEmployees,
      change: 'Active staff',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-300',
    },
    {
      label: 'Present Today',
      value: dashData.presentToday,
      change: `${dashData.attendanceRate}% rate`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-300',
    },
    {
      label: 'On Leave',
      value: dashData.onLeaveToday,
      change: `${dashData.pendingLeaveRequests} pending`,
      icon: CalendarCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-300',
    },
    {
      label: 'Late Today',
      value: dashData.lateToday,
      change: `${dashData.pendingOvertimeRequests} OT pending`,
      icon: Clock,
      color: 'text-red-500',
      bg: 'bg-red-50',
      iconBg: 'bg-red-300',
    },
  ] : []

  // Build employees from real data
  const recentEmployees = (dashData?.recentEmployees || []).map(emp => ({
    name:     emp.fullName,
    position: emp.position,
    dept:     emp.department,
    status:   emp.status,
    avatar:   emp.fullName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase(),
    color:    ['bg-indigo-500','bg-violet-500','bg-amber-500','bg-pink-500','bg-teal-500'][
      emp.fullName?.split('').reduce((s,c)=>s+c.charCodeAt(0),0) % 5
    ],
  }))

  // Build leave requests from real data
  const leaveRequests = (dashData?.recentLeaveRequests || []).map(req => ({
    name:   req.employeeName,
    type:   req.leaveType,
    days:   req.daysCount,
    date:   req.startDate,
    status: req.status,
  }))

  // Monthly chart data
  const monthlyChart = dashData?.monthlyChart || []

  // Today's donut data
  const presentCount = dashData?.presentToday  || 0
  const leaveCount   = dashData?.onLeaveToday  || 0
  const absentCount  = Math.max(0, (dashData?.totalEmployees || 0) - presentCount - leaveCount)

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
 console.log(monthlyChart);
  return (
    <div className="p-6 space-y-6">
    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((s, i) => (
        <div
          key={i}
          className="
            flex items-center justify-between
            rounded-2xl p-5
            bg-white border border-gray-100
            shadow-sm hover:shadow-md
            transition-all duration-300
          "
        >
          {/* LEFT: Text */}
          <div className="flex flex-col">
            <span className={`text-2xl font-semibold ${s.color}`}>
              {s.value}
            </span>

            <span className="text-sm text-gray-500 mt-1">
              {s.label}
            </span>

            <span className="text-xs text-gray-400 mt-1">
              {s.change}
            </span>
          </div>

          {/* RIGHT: Icon */}
          <div
            className={`
              w-11 h-11 rounded-xl flex items-center justify-center
              ${s.iconBg}
            `}
          >
            <s.icon size={20} className={s.color} />
          </div>
        </div>
      ))}
    </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attendance bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Attendance Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly attendance rate %</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full font-medium">
              {time.getFullYear()}
            </span>
          </div>
          <div className="flex items-end gap-2 h-40 w-full bg-white p-4">
            {monthlyChart.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full group">
                {/* 2. The Chart Area */}
                <div className="relative flex-1 w-full flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-300
                      ${i === monthlyChart.length - 1
                        ? 'bg-indigo-600'
                        : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                    /* 3. Use percentage for height so it scales to the container */
                    style={{ height: `${m.rate}%` }}
                    title={`${m.month}: ${m.rate}%`}
                  />
                </div>
                
                {/* 4. Labels */}
                <span className="text-[10px] uppercase font-medium text-gray-400 mt-2">
                  {m.month}
                </span>
              </div>
            ))}

            {monthlyChart.length === 0 && (
              <div className="w-full flex items-center justify-center text-gray-300 text-sm italic">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Today's donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Today's Status</h3>
          <p className="text-xs text-gray-400 mb-4">Real-time headcount</p>
          <DonutChart present={presentCount} leave={leaveCount} absent={absentCount} />
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">{dashData.totalEmployees}</span>
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent employees */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Employees</h3>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View All →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Employee','Department','Status'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No employees yet
                  </td>
                </tr>
              ) : (
                recentEmployees.map((emp, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-indigo-50 transition cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${emp.color} rounded-full flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">{emp.avatar}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                          <div className="text-xs text-gray-400">{emp.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{emp.dept}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${emp.status === 'Active'
                          ? 'bg-green-300 text-green-700'
                          : 'bg-amber-300 text-amber-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Leave requests */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Leave Requests</h3>
            <span className="bg-amber-300 text-amber-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {leaveRequests.filter(l => l.status === 'Pending').length} pending
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {leaveRequests.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No leave requests yet
              </div>
            ) : (
              leaveRequests.map((req, i) => (
                <div key={i} className="px-5 py-3 hover:bg-indigo-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{req.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {req.type} · {req.days} day{req.days > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-400">{req.date}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${req.status === 'Approved'
                        ? 'bg-green-300 text-green-600'
                        : req.status === 'Rejected'
                        ? 'bg-red-300 text-red-500'
                        : 'bg-amber-300 text-amber-600'}`}>
                      {req.status}
                    </span>
                  </div>
                  {req.status === 'Pending' && (
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium">
                        Approve
                      </button>
                      <button className="flex-1 text-xs bg-gray-100 text-gray-600 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function EmployeeDashboard({ employeeId ,setActive}) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now,     setNow]     = useState(new Date())
  const fullName = localStorage.getItem('fullName') || 'Employee'

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (employeeId) loadStats()
    else setLoading(false)
  }, [employeeId])

  async function loadStats() {
    try {
      const res = await API.get(`/dashboard/employee-stats/${employeeId}`)
      setStats(res.data)
    } catch {
      // Fallback mock
      setStats({
        employeeName:  fullName,
        department:    'Engineering',
        position:      'Developer',
        employeeCode:  'EMP-001',
        todayStatus:   'Not checked in',
        todayClockIn:  null,
        todayClockOut: null,
        presentDays:   0,
        lateDays:      0,
        absentDays:    0,
        leaveDays:     0,
        overtimeHoursThisMonth: 0,
        latestNetSalary: null,
        latestPayStatus: null,
        latestPayMonth:  null,
        latestPayYear:   null,
        pendingLeaveRequests: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const greeting = now.getHours() < 12 ? 'Good Morning'
                 : now.getHours() < 18 ? 'Good Afternoon'
                 :                        'Good Evening'

  const firstName = fullName.split(' ')[0]

  const todayStatusConfig = {
    Present:         { icon:CheckCircle, label:'Present',        color:'text-emerald-600', bg:'bg-emerald-50',  border:'border-emerald-100' },
    Late:            { icon:Clock, label:'Late',            color:'text-amber-600',   bg:'bg-amber-50',    border:'border-amber-100'   },
    Leave:           { icon:CalendarCheck, label:'On Leave',       color:'text-blue-600',    bg:'bg-blue-50',     border:'border-blue-100'    },
    Incomplete:      { icon:AlertTriangle, label:'Incomplete',     color:'text-orange-600',  bg:'bg-orange-50',   border:'border-orange-100'  },
    'Not checked in':{ icon:Circle, label:'Not Checked In', color:'text-gray-500',    bg:'bg-gray-50',     border:'border-gray-100'    },
  }
  const todayCfg = todayStatusConfig[stats?.todayStatus] || todayStatusConfig['Not checked in']
  const Icon = todayCfg.icon

  // Attendance % this month
  const totalDays = (stats?.presentDays) + (stats?.lateDays) + (stats?.absentDays) + (stats?.leaveDays)
  const attendPct = totalDays > 0
    ? Math.round(((stats.presentDays + stats.lateDays) / totalDays) * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

return (
  <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

<div className="grid lg:grid-cols-3 gap-5 items-stretch">

  {/* ── LEFT (2/3) ── */}
  <div className="lg:col-span-2 flex flex-col gap-5 h-full">

    {/* HERO */}
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {firstName}
          </h1>
          <p className="text-gray-700 text-sm mt-1">
            {stats?.position} · {stats?.department}
          </p>

          <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 inline-flex items-center gap-3">
            <Icon className={`${todayCfg.color}`} size={18} />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {todayCfg.label}
              </p>
              {stats?.todayClockIn && (
                <p className="text-xs text-gray-400">
                  {fmtTime(stats.todayClockIn)}
                  {stats?.todayClockOut
                    ? ` → ${fmtTime(stats.todayClockOut)}`
                    : ' (no checkout)'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CLOCK */}
        <div className="text-right hidden sm:block">
          <div className="text-xl font-semibold text-gray-900">
            {now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {now.toLocaleDateString('en-US', {
              weekday:'short',
              month:'short',
              day:'numeric'
            })}
          </div>
        </div>
      </div>
    </div>

    {/* ATTENDANCE BAR */}
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex-1">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Monthly breakdown</span>
        <span className="font-semibold text-gray-600">
          {totalDays} days
        </span>
      </div>

      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
        {totalDays > 0 && [
          { value: stats?.presentDays||0, color:'bg-emerald-500' },
          { value: stats?.lateDays||0, color:'bg-amber-400' },
          { value: stats?.leaveDays||0, color:'bg-blue-400' },
          { value: stats?.absentDays||0, color:'bg-red-400' },
        ].map((seg, i) => (
          seg.value > 0 && (
            <div key={i}
              className={`${seg.color} h-full`}
              style={{ width:`${(seg.value/totalDays)*100}%` }}
            />
          )
        ))}
      </div>

      {/* LEGEND */}
      <div className="flex gap-4 mt-3">
        {[
          { label:'Present', color:'bg-emerald-500' },
          { label:'Late',    color:'bg-amber-400' },
          { label:'Leave',   color:'bg-blue-400' },
          { label:'Absent',  color:'bg-red-400' },
        ].map((l,i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${l.color}`}/>
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* ── RIGHT (1/3) ── */}
<div className="h-full flex">
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 flex flex-col w-full h-full">

    {/* SALARY */}
    <div className="flex items-center justify-between p-5 flex-1">
      <div>
        <p className="text-xs text-gray-400">Net Salary</p>
        <p className="text-lg font-bold text-gray-900 mt-1">
          {stats?.latestNetSalary ? fmtMMK(stats.latestNetSalary) : '—'}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
        <Wallet size={18} className="text-gray-600"/>
      </div>
    </div>

    {/* OVERTIME */}
    <div className="flex items-center justify-between p-5 flex-1">
      <div>
        <p className="text-xs text-gray-400">Overtime</p>
        <p className="text-lg font-bold text-gray-900 mt-1">
          {stats?.overtimeHoursThisMonth || 0}
          <span className="text-sm text-gray-400 ml-1">hrs</span>
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
        <Clock size={18} className="text-gray-600"/>
      </div>
    </div>

    {/* ATTENDANCE */}
    <div className="flex items-center justify-between p-5 flex-1">
      <div>
        <p className="text-xs text-gray-400">Attendance</p>
        <p className="text-lg font-bold text-gray-900 mt-1">
          {attendPct}%
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
        <Activity size={18} className="text-gray-600"/>
      </div>
    </div>

  </div>
</div>

</div>

      {/* ── QUICK ACTIONS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'View Payslip',       icon: FileText,    color:'text-emerald-600', bg:'bg-white', border:'border-gray-100', tab:'payroll'},
          { label:'Apply Leave',         icon: Calendar,    color:'text-blue-600',    bg:'bg-white',    border:'border-gray-100', tab:'leave'   },
          { label:'Request Overtime',    icon: Zap,         color:'text-violet-600',  bg:'bg-white',  border:'border-gray-100', tab:'overtime' },
          { label:'Attendance History',  icon: Activity,    color:'text-indigo-600',  bg:'bg-white',  border:'border-gray-100', tab:'attendance'  },
        ].map((action, i) => (
          <button key={i}
            onClick={() => setActive&& setActive(action.tab)}
            className={`${action.bg} border ${action.border} rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition text-left group`}>
            <div className={`w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition`}>
              <action.icon size={16} className={action.color}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${action.color} truncate`}>{action.label}</p>
            </div>
            <ArrowUpRight size={14} className={`${action.color} opacity-50 group-hover:opacity-100 transition flex-shrink-0`}/>
          </button>
        ))}
      </div>

      {/* ── NO EMPLOYEE LINKED WARNING ── */}
      {!employeeId && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle size={22} className="text-amber-600"/>
          </div>
          <div>
            <p className="font-semibold text-amber-800">Profile not linked</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Your account is not linked to an employee record. Contact HR to set up your profile.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

function DashboardContent1() {
  const [time, setTime] = useState(new Date())
  const name = localStorage.getItem('fullName') || 'Admin'

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const greeting = time.getHours() < 12 ? 'Morning'
                 : time.getHours() < 18 ? 'Afternoon' : 'Evening'

  return (
    <div className="p-6 space-y-6">

      {/* Welcome banner — indigo-600 same as login button */}
      <div className="bg-indigo-600 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-1">
            Good {greeting}, {name}! <Hand className="w-5 h-5 text-white-500" />
          </h2>
          <p className="text-indigo-200 text-sm">
            Here's what's happening in your company today.
          </p>
          <div className="flex gap-3 mt-4">
            <button className="bg-white text-indigo-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-indigo-50 transition">
              View Reports
            </button>
            <button className="bg-indigo-500 border border-indigo-400 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-indigo-400 transition">
              Add Employee
            </button>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-4xl font-bold text-white">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-indigo-200 text-sm mt-1">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Attendance Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly attendance rate %</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full font-medium">
              2026
            </span>
          </div>
          <AttendanceChart />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Today's Status</h3>
          <p className="text-xs text-gray-400 mb-4">Real-time headcount</p>
          <DonutChart present={98} leave={12} absent={14} />
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">124</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Employees */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Employees</h3>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View All →</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Employee', 'Department', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentEmployees.map((emp, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-indigo-50 transition cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${emp.color} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">{emp.avatar}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-400">{emp.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{emp.dept}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leave requests */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Leave Requests</h3>
            <span className="bg-amber-100 text-amber-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {leaveRequests.filter(l => l.status === 'Pending').length} pending
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {leaveRequests.map((req, i) => (
              <div key={i} className="px-5 py-3 hover:bg-indigo-50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{req.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{req.type} · {req.days} day{req.days > 1 ? 's' : ''}</div>
                    <div className="text-xs text-gray-400">{req.date}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${req.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {req.status}
                  </span>
                </div>
                {req.status === 'Pending' && (
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium">
                      Approve
                    </button>
                    <button className="flex-1 text-xs bg-gray-100 text-gray-600 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Placeholder ──
function PlaceholderPage({ name }) {
  return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-xl font-semib=old text-gray-700">{name}</h2>
        <p className="text-gray-400 text-sm mt-2">This module will be built in the next phase.</p>
        <button className="mt-4 text-sm bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition">
          Coming Soon
        </button>
      </div>
    </div>
  )
}

// ── Root ──
export default function Dashboard() {
  const [active,    setActive]    = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) window.location.href = '/'
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeMenu={active} />
          <main className="flex-1 overflow-y-auto">
            {active === 'dashboard'   && <DashboardContent setActive={setActive}/>}
            {active === 'employees'   && <EmployeePage />}
            {active === 'departments' && <DepartmentPage />} 
            {active === 'attendance' && <AttendancePage />}
            {active === 'settings' && <SettingsPage />}
            {active === 'leave' && <LeavePage />}
            {active === 'overtime' && <OvertimePage />}
            {active === 'payroll' && <PayrollPage />}
            {active !== 'dashboard' && active !== 'employees' && active !== 'departments'&& active !== 'attendance'&&active !== 'settings'&&active !== 'leave'&&active !== 'overtime'&&active !== 'payroll'&&(
              <PlaceholderPage name={menuItems.find(m => m.id === active)?.label || active} />
            )}
          </main>
      </div>
    </div>
  )
}