import { useState } from 'react'
import { Save, Building2, Mail, Phone, MapPin, Globe, CheckCircle } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [form,  setForm]  = useState({ ...settings })
  const [saved, setSaved] = useState(false)
  const [tab,   setTab]   = useState('company')

  function handleSave() {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 space-y-5">

      <div>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage company and system settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id:'company', label:'Company Info'  },
          { id:'system',  label:'System'        },
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

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16}/> Settings saved successfully!
        </div>
      )}

      {/* Company Info Tab */}
      {tab === 'company' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Company Information</h3>
          <p className="text-sm text-gray-400 mb-6">
            This information appears on payslips, reports, and emails.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. ABC Company Ltd."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input type="email" value={form.companyEmail}
                  onChange={e => setForm({ ...form, companyEmail: e.target.value })}
                  placeholder="hr@company.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input value={form.companyPhone}
                  onChange={e => setForm({ ...form, companyPhone: e.target.value })}
                  placeholder="09-xxx-xxxx"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-gray-400"/>
                <input value={form.companyAddress}
                  onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                  placeholder="Company address"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-gray-400"/>
                <select value={form.timezone}
                  onChange={e => setForm({ ...form, timezone: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white">
                  <option value="Asia/Yangon">Asia/Yangon (UTC+6:30)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="UTC">UTC (UTC+0)</option>
                </select>
              </div>
            </div>

          </div>

          <button onClick={handleSave}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium">
            <Save size={15}/> Save Company Info
          </button>
        </div>
      )}

      {/* System Tab */}
      {tab === 'system' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">System Settings</h3>
          <p className="text-sm text-gray-400 mb-6">General system configuration.</p>

          <div className="space-y-4">
            {[
              { label: 'System Version',  value: 'HRMS v1.0.0',    readonly: true  },
              { label: 'Database',        value: 'MySQL 8.0',       readonly: true  },
              { label: 'Backend',         value: 'Spring Boot 3.3', readonly: true  },
              { label: 'Frontend',        value: 'React 18 + Vite', readonly: true  },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}