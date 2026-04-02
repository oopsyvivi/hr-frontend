import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Save, Building2, Users } from 'lucide-react'
import API from '../api/axios'

export default function DepartmentPage() {
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editDept,    setEditDept]    = useState(null)
  const [form,        setForm]        = useState({ name: '', description: '' })
  const [error,       setError]       = useState('')

  useEffect(() => { loadDepartments() }, [])

  async function loadDepartments() {
    try {
      const res = await API.get('/departments')
      setDepartments(res.data)
    } catch (err) {
      console.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditDept(null)
    setForm({ name: '', description: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(dept) {
    setEditDept(dept)
    setForm({ name: dept.name, description: dept.description || '' })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Department name is required')
      return
    }
    try {
      if (editDept) {
        await API.put(`/departments/${editDept.id}`, form)
      } else {
        await API.post('/departments', form)
      }
      await loadDepartments()
      setShowForm(false)
      setEditDept(null)
    } catch (err) {
      setError(err.response?.data || 'Failed to save department')
    }
  }

  async function handleDelete(dept) {
    if (!window.confirm(`Delete "${dept.name}" department?`)) return
    try {
      await API.delete(`/departments/${dept.id}`)
      await loadDepartments()
    } catch (err) {
      alert('Failed to delete department')
    }
  }

  // Color for each department card
  const colors = [
    'bg-indigo-100 border-indigo-100',
    'bg-violet-100 border-violet-100',
    'bg-amber-100  border-amber-100',
    'bg-green-100  border-green-100',
    'bg-pink-100   border-pink-100',
    'bg-blue-100   border-blue-100',
    'bg-teal-100   border-teal-100',
    'bg-rose-100   border-rose-100',
  ]
  const iconColors = [
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-amber-100  text-amber-600',
    'bg-green-100  text-green-600',
    'bg-pink-100   text-pink-600',
    'bg-blue-100   text-blue-600',
    'bg-teal-100   text-teal-600',
    'bg-rose-100   text-rose-600',
  ]

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {departments.length} departments total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          <Plus size={16}/> Add Department
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {editDept ? 'Edit Department' : 'Add New Department'}
            </h3>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition">
              <X size={16} className="text-gray-400"/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); setError('') }}
                placeholder="e.g. Engineering"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition
                  ${error ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                          : 'border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'}`}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">
              <Save size={15}/> {editDept ? 'Update' : 'Save Department'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
          >
            {/* Top Row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {dept.name}
                </h3>
              </div>

              {/* Icon badge */}
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 size={18} />
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mt-2">
              {dept.description || "No description"}
            </p>

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              <button onClick={() => openEdit(dept)} className="flex-1 text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium">
                Edit
              </button>
              <button onClick={() => handleDelete(dept)} className="flex-1 text-xs bg-gray-100 text-gray-600 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium">
                Delete
              </button>
            </div>
            
          </div>
        ))}
      

        {/* Empty state */}
        {departments.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} className="text-indigo-400"/>
            </div>
            <p className="text-gray-500 font-medium">No departments yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Department" to create one</p>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-smflex-shrink-0 mt-0.5">
          <Users size={15} className="text-indigo-600"/>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Department Management</p>
          <p className="text-xs text-indigo-500 mt-1 leading-relaxed font-semibold">
            Departments added here will automatically appear in the Employee form dropdown.
            Deleting a department hides it from the list but keeps existing employee records safe.
          </p>
        </div>
      </div>   

    </div>
  )
}