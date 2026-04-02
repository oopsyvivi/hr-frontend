import { useState, useEffect, useRef } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, Users, FileText,
  Download, ChevronLeft, ChevronRight, CheckCircle, Clock,
  AlertCircle, Search, Filter, Eye, Edit2, Play, X,
  BarChart3, Wallet, Calculator, ArrowUpRight, Printer,
  Shield, Zap, Star, Award, ChevronDown, ChevronUp
} from 'lucide-react'
import API from '../api/axios'

// ── MMK formatter ──────────────────────────────────────────
function fmtMMK(amount) {
  if (amount == null) return '— MMK'
  return new Intl.NumberFormat('en-US').format(Math.round(amount)) + ' MMK'
}

function fmtMMKShort(amount) {
  if (amount == null) return '—'
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M MMK'
  if (amount >= 1000)    return (amount / 1000).toFixed(0) + 'K MMK'
  return Math.round(amount) + ' MMK'
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

// ── Avatar ──────────────────────────────────────────────────
function Avatar({ name = '', size = 'sm' }) {
  const palette = ['bg-emerald-500','bg-indigo-500','bg-amber-500','bg-rose-500','bg-teal-500','bg-cyan-500']
  const idx = name.split('').reduce((s,c)=>s+c.charCodeAt(0),0) % palette.length
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-lg' }
  return (
    <div className={`${palette[idx]} ${sz[size]} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────
function PayStatus({ status }) {
  const map = {
    Paid:      'bg-emerald-300 text-emerald-700 border-emerald-200',
    Pending:   'bg-amber-300   text-amber-700   border-amber-200',
    Processing:'bg-blue-300    text-blue-600    border-blue-200',
    Draft:     'bg-gray-300   text-gray-500    border-gray-200',
  }
  const icons = {
    Paid:      <CheckCircle size={11}/>,
    Pending:   <Clock size={11}/>,
    Processing:<Zap size={11}/>,
    Draft:     <Edit2 size={11}/>,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]||map.Draft}`}>
      {icons[status]} {status}
    </span>
  )
}

// ── Salary row item ─────────────────────────────────────────
function SalaryRow({ label, amount, type = 'neutral', indent = false }) {
  const color = type === 'add'  ? 'text-emerald-600'
              : type === 'deduct' ? 'text-red-500'
              :                     'text-gray-800'
  const prefix = type === 'add' ? '+' : type === 'deduct' ? '−' : ''
  return (
    <div className={`flex items-center justify-between py-2 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${indent ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-semibold ${color}`}>
        {prefix}{fmtMMK(amount)}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  PAYSLIP MODAL  (employee & HR can view)
// ══════════════════════════════════════════════════════════
function PayslipModal({ payroll, employee, onClose }) {
  const printRef = useRef()

  function handlePrint() {
    const printContent = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Payslip - ${employee?.fullName || payroll?.employeeName}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
            .header { background: linear-gradient(135deg,#059669,#0d9488); color:white; padding:24px; border-radius:16px; margin-bottom:24px; }
            .header h1 { font-size:20px; font-weight:700; }
            .header p  { font-size:12px; opacity:0.8; margin-top:4px; }
            .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
            .card  { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; }
            .card-label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
            .card-value { font-size:15px; font-weight:700; color:#1e293b; margin-top:4px; }
            .section-title { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.08em; margin:16px 0 8px; }
            .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
            .row:last-child { border-bottom:none; }
            .add    { color:#059669; font-weight:600; }
            .deduct { color:#ef4444; font-weight:600; }
            .total  { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px; margin-top:16px; display:flex; justify-content:space-between; align-items:center; }
            .total-label { font-size:13px; color:#065f46; font-weight:600; }
            .total-value { font-size:22px; font-weight:800; color:#059669; }
            .footer { margin-top:24px; text-align:center; font-size:11px; color:#94a3b8; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  const p = payroll
  const empName = employee?.fullName || p?.employeeName || 'Employee'
  //CHatGpt ADD
  const SalaryRowClean = ({ label, amount, negative }) => {
  if (!amount || amount === 0) return null

  return (
    <div className="flex justify-between px-4 py-2 border-t text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={negative ? "text-gray-500" : "text-gray-900"}>
        {negative ? "-" : ""}{fmtMMK(amount)}
      </span>
    </div>
  )
}
  return (
   <div
  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  onClick={onClose}
>
  <div
    className="bg-white w-full max-w-xl rounded-2xl shadow-lg border border-gray-200"
    onClick={(e) => e.stopPropagation()}
  >

    {/* Header */}
    <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Payslip</h2>
        <p className="text-sm text-gray-500">
          {MONTH_NAMES[p?.month-1]} {p?.year}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={handlePrint} className="text-gray-500 hover:text-gray-800">
          <Printer size={18} />
        </button>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <X size={18} />
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="p-6 text-sm text-gray-800">

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-gray-400 text-xs">Employee</p>
          <p className="font-medium">{empName}</p>
          <p className="text-gray-500 text-xs">
            {p?.department} · {p?.position}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-xs">Period</p>
          <p className="font-medium">
            {MONTH_NAMES[p?.month-1]} {p?.year}
          </p>
          <p className="text-gray-500 text-xs">
            {p?.presentDays || 0} / {p?.workingDays || 22} days
          </p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 mb-2">EARNINGS</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">

          <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-500">
            <span>Description</span>
            <span>Amount</span>
          </div>

          <SalaryRowClean label="Basic Salary" amount={p?.basicSalary} />
          <SalaryRowClean label="Transport Allowance" amount={p?.transportAllowance} />
          <SalaryRowClean label="Meal Allowance" amount={p?.mealAllowance} />
          <SalaryRowClean label="Overtime Pay" amount={p?.overtimePay} />

          <div className="flex justify-between px-4 py-2 font-semibold border-t">
            <span>Gross Salary</span>
            <span>{fmtMMK(p?.grossSalary)}</span>
          </div>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 mb-2">DEDUCTIONS</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">

          <SalaryRowClean label={`Income Tax (${p?.taxRate}%)`} amount={p?.taxAmount} negative />
          <SalaryRowClean label="Late Deduction" amount={p?.lateDeduction} negative />
          <SalaryRowClean label="Absent Deduction" amount={p?.absentDeduction} negative />

          <div className="flex justify-between px-4 py-2 font-semibold border-t">
            <span>Total Deductions</span>
            <span>-{fmtMMK(p?.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* Net Salary */}
      <div className="border-t pt-4 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">Net Salary</span>
        <span className="text-xl font-bold text-gray-900">
          {fmtMMK(p?.netSalary)}
        </span>
      </div>

    </div>
  </div>
</div>
  )
}

// ══════════════════════════════════════════════════════════
//  RUN PAYROLL MODAL
// ══════════════════════════════════════════════════════════
function RunPayrollModal({ month, year, employees, onClose, onRun }) {
  const [config, setConfig] = useState({
    taxRate:              5,
    overtimeRate:         1.5,
    transportAllowance:   30000,
    mealAllowance:        20000,
    lateDeductionPerDay:  5000,
    absentDeductionPerDay:10000,
  })
  const [step, setStep] = useState(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e=>e.stopPropagation()}
        style={{ boxShadow:'0 32px 80px rgba(16,185,129,0.18)' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Play size={18} className="text-white"/>
              </div>
              <div>
                <h3 className="font-bold text-white">Run Payroll</h3>
                <p className="text-emerald-200 text-xs">{MONTH_NAMES[month-1]} {year}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition">
              <X size={15} className="text-white"/>
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1,2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition
                  ${step >= s ? 'bg-white text-emerald-600' : 'bg-white/20 text-white/50'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`h-px w-8 ${step > s ? 'bg-white' : 'bg-white/20'}`}/>}
              </div>
            ))}
            <span className="text-white/60 text-xs ml-1">
              {step === 1 ? 'Configure' : 'Confirm'}
            </span>
          </div>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">
                Payroll Rules
              </p>
              <div className="space-y-3">
                {[
                  { label:'Income Tax Rate (%)',         key:'taxRate',              type:'number', suffix:'%'    },
                  { label:'Overtime Rate (×)',            key:'overtimeRate',         type:'number', suffix:'×'    },
                  { label:'Transport Allowance (MMK)',    key:'transportAllowance',   type:'number', suffix:'MMK'  },
                  { label:'Meal Allowance (MMK)',         key:'mealAllowance',        type:'number', suffix:'MMK'  },
                  { label:'Late Deduction/day (MMK)',     key:'lateDeductionPerDay',  type:'number', suffix:'MMK'  },
                  { label:'Absent Deduction/day (MMK)',   key:'absentDeductionPerDay',type:'number', suffix:'MMK'  },
                ].map(field => (
                  <div key={field.key} className="flex items-center justify-between gap-3">
                    <label className="text-sm text-gray-600 flex-1">{field.label}</label>
                    <div className="flex items-center gap-1">
                      <input type="number"
                        value={config[field.key]}
                        onChange={e => setConfig({...config, [field.key]: parseFloat(e.target.value)||0})}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-right outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                      />
                      <span className="text-xs text-gray-400 w-8">{field.suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-700">
                Payroll will be calculated for all {employees.length} active employees
                using their base salary + attendance data.
              </p>
            </div>

            <button onClick={() => setStep(2)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-emerald-100">
              Preview Payroll →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary</p>
              <div className="space-y-2">
                {[
                  { label:'Period',      value:`${MONTH_NAMES[month-1]} ${year}` },
                  { label:'Employees',   value:`${employees.length} employees` },
                  { label:'Tax Rate',    value:`${config.taxRate}%` },
                  { label:'OT Rate',     value:`${config.overtimeRate}×` },
                  { label:'Transport',   value:fmtMMK(config.transportAllowance) },
                  { label:'Meal',        value:fmtMMK(config.mealAllowance) },
                ].map((r,i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-sm text-gray-500">{r.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-2">
              <Shield size={14} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-emerald-700">
                This will generate payroll records with status "Draft". You can review and finalize before marking as Paid.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                ← Edit
              </button>
              <button onClick={() => { onRun(config); onClose() }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-emerald-100">
                Run Payroll ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  EDIT SALARY MODAL
// ══════════════════════════════════════════════════════════
function EditSalaryModal({ employee, onClose, onSave }) {
  const [salary, setSalary] = useState(employee?.salary || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e=>e.stopPropagation()}>
        <div className="bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={employee?.fullName||''} size="sm"/>
              <div>
                <h3 className="font-bold text-gray-700 text-sm">{employee?.fullName}</h3>
                <p className="text-gray-500 text-xs">{employee?.position}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition">
              <X size={15} className="text-white"/>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Basic Salary (MMK)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">MMK</span>
              <input type="number"
                value={salary}
                onChange={e => setSalary(parseFloat(e.target.value)||0)}
                className="w-full pl-16 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{fmtMMK(salary)}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { onSave(employee.id, salary); onClose() }}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition">
              Save Salary
            </button>
            <button onClick={onClose}
              className="px-4 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  HR PAYROLL VIEW
// ══════════════════════════════════════════════════════════

// Mock data
const MOCK_EMPLOYEES = [
  { id:22, fullName:'Cat',           position:'Junior Developer',   department:'Engineering', salary:2000000  },
  { id:2,  fullName:'Aung Kyaw Zin', position:'Developer',          department:'Engineering', salary:2500000  },
  { id:3,  fullName:'Eaindray',      position:'Senior Developer',   department:'Engineering', salary:3500000  },
  { id:6,  fullName:'Kelvin',        position:'UI/UX Designer',     department:'Design',      salary:2800000  },
  { id:10, fullName:'Anna',          position:'Offshore Developer', department:'Operations',  salary:3000000  },
  { id:11, fullName:'Catherine',     position:'IT Support',         department:'Operations',  salary:1500000  },
]

function generateMockPayroll(employees, month, year, config = {}) {
  const taxRate       = config.taxRate              || 5
  const otRate        = config.overtimeRate         || 1.5
  const transport     = config.transportAllowance   || 30000
  const meal          = config.mealAllowance        || 20000
  const lateD         = config.lateDeductionPerDay  || 5000
  const absentD       = config.absentDeductionPerDay|| 10000

  return employees.map(emp => {
    const presentDays = 18 + Math.floor(Math.random() * 4)
    const lateDays    = Math.floor(Math.random() * 3)
    const absentDays  = 22 - presentDays - lateDays
    const otHours     = Math.floor(Math.random() * 10)
    const dailyRate   = emp.salary / 22
    const hourlyRate  = emp.salary / (22 * 8)
    const otPay       = otHours * hourlyRate * otRate
    const grossSalary = emp.salary + transport + meal + otPay
    const taxAmount   = grossSalary * taxRate / 100
    const lateDeduct  = lateDays * lateD
    const absentDeduct= absentDays > 0 ? absentDays * absentD : 0
    const totalDeduct = taxAmount + lateDeduct + absentDeduct
    const netSalary   = grossSalary - totalDeduct

    return {
      id:             emp.id * 100 + month,
      employeeId:     emp.id,
      employeeName:   emp.fullName,
      position:       emp.position,
      department:     emp.department,
      month,
      year,
      basicSalary:    emp.salary,
      transportAllowance: transport,
      mealAllowance:  meal,
      overtimeHours:  otHours,
      overtimePay:    Math.round(otPay),
      grossSalary:    Math.round(grossSalary),
      taxRate,
      taxAmount:      Math.round(taxAmount),
      lateDays,
      lateDeduction:  lateDeduct,
      absentDays:     absentDays > 0 ? absentDays : 0,
      absentDeduction:absentDeduct,
      totalDeductions:Math.round(totalDeduct),
      netSalary:      Math.round(netSalary),
      workingDays:    22,
      presentDays,
      status:         Math.random() > 0.4 ? 'Paid' : 'Pending',
    }
  })
}

function HRPayrollView() {
  const [activeTab,    setActiveTab]    = useState('payroll')
  const [selMonth,     setSelMonth]     = useState(new Date().getMonth() + 1)
  const [selYear,      setSelYear]      = useState(new Date().getFullYear())
  const [employees,    setEmployees]    = useState(MOCK_EMPLOYEES)
  const [payrollData,  setPayrollData]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showRun,      setShowRun]      = useState(false)
  const [showPayslip,  setShowPayslip]  = useState(null)
  const [showEdit,     setShowEdit]     = useState(null)
  const [success,      setSuccess]      = useState('')
  const [payrollConfig,setPayrollConfig]= useState(null)

  useEffect(() => { loadData() }, [selMonth, selYear])

  async function loadData() {
    setLoading(true)
    try {
      const [empRes, payRes] = await Promise.all([
        API.get('/employees'),
        API.get(`/payroll?month=${selMonth}&year=${selYear}`),
      ])
      setEmployees(empRes.data.length > 0 ? empRes.data : MOCK_EMPLOYEES)
      if (payRes.data.length > 0) {
        setPayrollData(payRes.data)
      } else {
        // No payroll yet — show empty
        setPayrollData([])
      }
    } catch {
      setEmployees(MOCK_EMPLOYEES)
      setPayrollData([])
    } finally {
      setLoading(false)
    }
  }

  async function handleRunPayroll(config) {
    const adminId = localStorage.getItem('userId') || 1
    try {
      const res = await API.post(`/payroll/run/${adminId}`, {
        month: selMonth,
        year:  selYear,
        ...config
      })
      setPayrollData(res.data)
      setSuccess(`Payroll generated! ${res.data.length} employees processed.`)
    } catch (err) {
      // Fallback to mock
      const generated = generateMockPayroll(employees, selMonth, selYear, config)
      setPayrollData(generated)
      setSuccess(`Payroll generated for ${MONTH_NAMES[selMonth-1]} ${selYear}`)
    }
    setTimeout(() => setSuccess(''), 5000)
  }

  async function handleStatusChange(id, newStatus) {
    try {
      if (newStatus === 'Paid') {
        await API.put(`/payroll/${id}/paid`)
      } else {
        await API.put(`/payroll/${id}/status`, { status: newStatus })
      }
    } catch (err) {
      console.error('Status update failed:', err)
    }
    setPayrollData(prev => prev.map(p =>
      p.id === id ? { ...p, status: newStatus } : p
    ))
  }

  async function handleMarkAllPaid() {
    try {
      await API.put(`/payroll/paid-all?month=${selMonth}&year=${selYear}`)
    } catch {}
    setPayrollData(prev => prev.map(p => ({ ...p, status: 'Paid' })))
    setSuccess('All payroll marked as Paid!')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleEditSalary(empId, newSalary) {
    try {
      await API.put(`/payroll/salary/${empId}`, { salary: newSalary })
    } catch {}
    setEmployees(prev => prev.map(e => e.id === empId ? {...e, salary: newSalary} : e))
    setSuccess('Salary updated!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const filtered = payrollData.filter(p => {
    const ms = p.employeeName.toLowerCase().includes(search.toLowerCase())
    const mf = statusFilter === 'All' || p.status === statusFilter
    return ms && mf
  })

  // Summary stats
  const totalGross  = payrollData.reduce((s,p) => s + (p.grossSalary||0), 0)
  const totalNet    = payrollData.reduce((s,p) => s + (p.netSalary||0), 0)
  const totalTax    = payrollData.reduce((s,p) => s + (p.taxAmount||0), 0)
  const paidCount   = payrollData.filter(p => p.status === 'Paid').length
  const pendingCount= payrollData.filter(p => p.status === 'Pending').length

  return (
    <div className="p-6 space-y-5">

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 text-sm text-emerald-700 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-500 flex-shrink-0"/>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl">
          {[
            { id:'payroll',   label:'Payroll'      },
            { id:'employees', label:'Salary Setup'  },
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
      </div>

      {/* ── PAYROLL TAB ── */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">

          {/* Month selector + Run button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-2xl px-2 py-1.5">
              <button onClick={() => {
                if (selMonth === 1) { setSelMonth(12); setSelYear(y=>y-1) }
                else setSelMonth(m=>m-1)
              }} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ChevronLeft size={16} className="text-gray-500"/>
              </button>
              <span className="font-semibold text-gray-900 px-2 text-sm min-w-32 text-center">
                {MONTH_NAMES[selMonth-1]} {selYear}
              </span>
              <button onClick={() => {
                if (selMonth === 12) { setSelMonth(1); setSelYear(y=>y+1) }
                else setSelMonth(m=>m+1)
              }} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ChevronRight size={16} className="text-gray-500"/>
              </button>
            </div>

            <div className="flex gap-2">
              {payrollData.some(p => p.status === 'Draft') && (
                <button
                  onClick={() => {
                    setPayrollData(prev => prev.map(p =>
                      p.status === 'Draft' ? { ...p, status: 'Pending' } : p
                    ))
                    setSuccess('All payroll approved!')
                    setTimeout(() => setSuccess(''), 3000)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-200 text-gray-600 py-1.5 rounded-xl hover:bg-gray-300 transition font-medium">
                  <CheckCircle size={15}/> Approve All
                </button>
              )}
              {payrollData.some(p => p.status === 'Pending') && (
                <button onClick={handleMarkAllPaid}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-300 transition font-medium">
                  <CheckCircle size={15}/> Mark All Paid
                </button>
              )}
              <button onClick={() => setShowRun(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-emerald-100 active:scale-[0.98]">
                <Play size={15}/> Run Payroll
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Total Gross',    value:fmtMMKShort(totalGross),   icon:TrendingUp,   bg:'bg-white', text:'text-emerald-600', ib:'bg-emerald-300' },
              { label:'Total Net',      value:fmtMMKShort(totalNet),     icon:Wallet,       bg:'bg-white',    text:'text-teal-600',    ib:'bg-teal-300'    },
              { label:'Total Tax',      value:fmtMMKShort(totalTax),     icon:Shield,       bg:'bg-white',  text:'text-orange-600',  ib:'bg-orange-300'  },
              { label:'Paid',           value:`${paidCount}/${payrollData.length}`,icon:CheckCircle,bg:'bg-bg-white',text:'text-blue-600',ib:'bg-blue-300' },
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

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
            <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
              <Search size={16} className="text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"/>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2  shadow-sm hover:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-150">
              <Filter size={14} className="text-gray-400"/>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none">
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Payroll table */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Employee','Basic Salary','Gross Salary','Deductions','Net Salary','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-emerald-50/30 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.employeeName}/>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.employeeName}</p>
                            <p className="text-xs text-gray-400">{p.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {fmtMMK(p.basicSalary)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
                        {fmtMMK(p.grossSalary)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-red-500">
                        −{fmtMMK(p.totalDeductions)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-900">{fmtMMK(p.netSalary)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <PayStatus status={p.status}/>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* View payslip */}
                          <button onClick={() => setShowPayslip(p)}
                            className="p-1.5 hover:bg-indigo-100 rounded-lg transition text-gray-400 hover:text-indigo-600"
                            title="View Payslip">
                            <Eye size={14}/>
                          </button>

                          {/* Draft → Pending */}
                          {p.status === 'Draft' && (
                            <button onClick={() => handleStatusChange(p.id, 'Pending')}
                              className="text-xs px-2.5 py-1 bg-indigo-500 text-white border border-indigo-200 rounded-lg hover:bg-indigo-600 transition font-medium whitespace-nowrap">
                              Approve
                            </button>
                          )}

                          {/* Pending → Paid */}
                          {p.status === 'Pending' && (
                            <button onClick={() => handleStatusChange(p.id, 'Paid')}
                              className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition font-medium whitespace-nowrap">
                              Mark Paid ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Wallet size={24} className="text-gray-400"/>
                        </div>
                        <p className="text-gray-600 font-medium">No payroll data</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Run Payroll" to generate</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SALARY SETUP TAB ── */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Employee Salary Setup</h3>
                <p className="text-xs text-gray-400 mt-0.5">Manage base salary for each employee</p>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Employee','Department','Position','Basic Salary','Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp, i) => (
                  <tr key={emp.id || i} className="hover:bg-emerald-50/30 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.fullName || emp.full_name || ''}/>
                        <span className="text-sm font-semibold text-gray-900">
                          {emp.fullName || emp.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{emp.department}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{emp.position}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-gray-900">
                        {fmtMMK(emp.salary)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setShowEdit(emp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-indigo-500 border border-indigo-100 rounded-lg hover:bg-indigo-600 transition font-medium">
                        <Edit2 size={12}/> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Modals */}
      {showRun && (
        <RunPayrollModal
          month={selMonth} year={selYear}
          employees={employees}
          onClose={() => setShowRun(false)}
          onRun={handleRunPayroll}
        />
      )}
      {showPayslip && (
        <PayslipModal
          payroll={showPayslip}
          employee={employees.find(e=>e.id===showPayslip.employeeId)}
          onClose={() => setShowPayslip(null)}
        />
      )}
      {showEdit && (
        <EditSalaryModal
          employee={showEdit}
          onClose={() => setShowEdit(null)}
          onSave={handleEditSalary}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  EMPLOYEE PAYROLL VIEW
// ══════════════════════════════════════════════════════════
function EmployeePayrollView() {
  const [activeTab,  setActiveTab]  = useState('payslips')
  const [payslips,   setPayslips]   = useState([])
  const [currentSlip,   setCurrentSlip]   = useState([null])
  const [loading,    setLoading]    = useState(true)
  const [showSlip,   setShowSlip]   = useState(null)
  const [selMonth,   setSelMonth]   = useState(new Date().getMonth() + 1)
  const [selYear,    setSelYear]    = useState(new Date().getFullYear())

  const employeeId = localStorage.getItem('employeeId')

  useEffect(() => { loadPayslips() }, [])

  async function loadPayslips() {
  setLoading(true)
  try {
    const res = await API.get(`/payroll/my/${employeeId}`)
    setPayslips(res.data)
    //latest slip = current month
    if(res.data.length > 0){
      setCurrentSlip(res.data[0])
    }
  } catch (err){
    console.error('Failed to load payslips:',err)
     // Fallback mock
      const mock = {
        id:1,
        employeeId:     parseInt(employeeId) || 22,
        employeeName:   localStorage.getItem('fullName') || 'Employee',
        position:       'Employee',
        department:     'Engineering',
        month:          selMonth,
        year:           selYear,
        basicSalary:    2000000,
        transportAllowance: 30000,
        mealAllowance:  20000,
        overtimeHours:  0,
        overtimePay:    0,
        grossSalary:    2050000,
        taxRate:        5,
        taxAmount:      102500,
        lateDays:       0,
        lateDeduction:  0,
        absentDays:     0,
        absentDeduction:0,
        totalDeductions:102500,
        netSalary:      1947500,
        workingDays:    22,
        presentDays:    22,
        status:         'Pending',
      }
      setCurrentSlip(mock)
      setPayslips([mock])
    } finally {
      setLoading(false)
    }
  }
if (loading) return (
  <div className="p-6 flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
  </div>
)

if (!currentSlip) return (
  <div className="p-6">
    {/* tabs */}
    <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit mb-5">
      ...
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Wallet size={24} className="text-emerald-400"/>
      </div>
      <p className="text-gray-600 font-medium">No payslip yet</p>
      <p className="text-gray-400 text-sm mt-1">
        Your payroll has not been processed yet. Please contact HR.
      </p>
    </div>
  </div>
)


  return (
    <div className="p-6 space-y-5">

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
        {[
          { id:'payslips',  label:'Payslip History' },
          { id:'breakdown', label:'Breakdown'       },
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





      {/* ── PAYSLIP HISTORY ── */}
      {activeTab === 'payslips' && (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          ) : payslips.map((slip, i) => (
            <div key={slip.id || i}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
                    ${slip.status === 'Paid' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <FileText size={18} className={slip.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}/>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {MONTH_NAMES[(slip.month||1)-1]} {slip.year}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtMMK(slip.grossSalary)} gross · {fmtMMK(slip.totalDeductions)} deducted
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">{fmtMMK(slip.netSalary)}</p>
                    <PayStatus status={slip.status}/>
                  </div>
                  <button onClick={() => setShowSlip(slip)}
                    className="w-9 h-9 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl flex items-center justify-center transition text-gray-400">
                    <Eye size={15}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

{activeTab === 'breakdown' && (
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

    {/* ── HEADER ── */}
    <div className="px-6 py-4 border-b border-gray-200 bg-white">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Salary Breakdown
      </p>
      <h2 className="text-lg font-bold text-gray-800 mt-1">
        {MONTH_NAMES[(currentSlip.month||1)-1]} {currentSlip.year}
      </h2>
    </div>

    <div className="divide-y divide-gray-200">

      {/* ── EARNINGS ── */}
      <div className="px-6 py-5">
        <p className="text-xs font-bold text-emerald-600 uppercase mb-4">
          Earnings
        </p>

        <div className="space-y-2">
          <SalaryRow label="Basic Salary" amount={currentSlip.basicSalary} type="add"/>
          <SalaryRow label="Transport Allowance" amount={currentSlip.transportAllowance} type="add" indent/>
          <SalaryRow label="Meal Allowance" amount={currentSlip.mealAllowance} type="add" indent/>
          <SalaryRow label={`Overtime (${currentSlip.overtimeHours}h)`} amount={currentSlip.overtimePay} type="add" indent/>

          <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Total Earnings</span>
            <span className="text-sm font-bold text-emerald-600">
              {fmtMMK(currentSlip.grossSalary)}
            </span>
          </div>
        </div>
      </div>

      {/* ── DEDUCTIONS ── */}
      <div className="px-6 py-5">
        <p className="text-xs font-bold text-red-500 uppercase mb-4">
          Deductions
        </p>

        <div className="space-y-2">
          <SalaryRow label={`Income Tax (${currentSlip.taxRate}%)`} amount={currentSlip.taxAmount} type="deduct"/>
          <SalaryRow label={`Late (${currentSlip.lateDays} day)`} amount={currentSlip.lateDeduction} type="deduct" indent/>

          {currentSlip.absentDays > 0 && (
            <SalaryRow label={`Absent (${currentSlip.absentDays} days)`} amount={currentSlip.absentDeduction} type="deduct" indent/>
          )}

          <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Total Deductions</span>
            <span className="text-sm font-bold text-red-500">
              −{fmtMMK(currentSlip.totalDeductions)}
            </span>
          </div>
        </div>
      </div>

      {/* ── ATTENDANCE ── */}
      <div className="px-6 py-5">
        <p className="text-xs font-bold text-gray-500 uppercase mb-4">
          Attendance
        </p>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label:'Present', value:currentSlip.presentDays },
            { label:'Late', value:currentSlip.lateDays },
            { label:'Absent', value:currentSlip.absentDays },
            { label:'OT Hours', value:currentSlip.overtimeHours },
          ].map((s,i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── NET SALARY ── */}
      <div className="px-6 py-5 flex items-center justify-between bg-white">
        <div>
          <p className="text-xs text-gray-400 uppercase">Net Salary</p>
          <p className="text-2xl font-bold text-gray-900">
            {fmtMMK(currentSlip.netSalary)}
          </p>
        </div>

        <PayStatus status={currentSlip.status}/>
      </div>

    </div>
  </div>
)}

      {/* Payslip modal */}
      {showSlip && (
        <PayslipModal
          payroll={showSlip}
          onClose={() => setShowSlip(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════
export default function PayrollPage() {
  const role = localStorage.getItem('role') || 'EMPLOYEE'
  const isHR = role === 'ADMIN' || role === 'HR'

  return (
    <div>
      <div className="px-6 pt-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payroll</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isHR ? 'Manage salary, run payroll and generate payslips' : 'View your salary and payslips'}
          </p>
        </div>
        {isHR && (
          <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100">
            <Users size={14}/> HR / Admin View
          </div>
        )}
      </div>
      {isHR ? <HRPayrollView /> : <EmployeePayrollView />}
    </div>
  )
}