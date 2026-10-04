// src/app/students/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  class: number
  section: string
  roll_number: string
  first_name: string
  last_name: string
  dob: string | null
  father_name: string | null
}

const CLASSES = Array.from({ length: 10 }, (_, i) => i + 1)
const SECTIONS = ['A', 'B', 'C', 'D']

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  // form state
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    class: 1,
    section: 'A',
    roll_number: '',
    first_name: '',
    last_name: '',
    dob: '',
    father_name: '',
  })

  // bulk paste state
  const [bulkText, setBulkText] = useState('')

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    await loadStudents()
  }

  async function loadStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('class', { ascending: true })
      .order('roll_number', { ascending: true })

    if (!error && data) setStudents(data)
    setLoading(false)
  }

  function resetForm() {
    setEditId(null)
    setForm({
      class: 1,
      section: 'A',
      roll_number: '',
      first_name: '',
      last_name: '',
      dob: '',
      father_name: '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      class: Number(form.class),
      section: form.section,
      roll_number: form.roll_number.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      dob: form.dob || null,
      father_name: form.father_name.trim() || null,
    }

    if (editId) {
      const { error } = await supabase.from('students').update(payload).eq('id', editId)
      if (error) return alert(error.message)
    } else {
      const { error } = await supabase.from('students').insert(payload)
      if (error) return alert(error.message)
    }

    resetForm()
    await loadStudents()
  }

  function handleEdit(s: Student) {
    setEditId(s.id)
    setForm({
      class: s.class,
      section: s.section,
      roll_number: s.roll_number,
      first_name: s.first_name,
      last_name: s.last_name,
      dob: s.dob || '',
      father_name: s.father_name || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this student?')) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) return alert(error.message)
    await loadStudents()
  }

  async function handleBulkUpload() {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    if (!lines.length) return alert('Paste some student lines first')

    const rows: any[] = []
    for (const line of lines) {
      // expected: Class, Section, Roll, First, Last, DOB, Father
      const p = line.split(',').map((x) => x.trim())
      if (p.length < 5) continue
      rows.push({
        class: Number(p[0]),
        section: p[1],
        roll_number: p[2],
        first_name: p[3],
        last_name: p[4],
        dob: p[5] || null,
        father_name: p[6] || null,
      })
    }

    if (!rows.length) return alert('No valid lines found. Use: Class, Section, Roll, First, Last, DOB, Father')

    const { error } = await supabase.from('students').insert(rows)
    if (error) return alert(error.message)

    setBulkText('')
    await loadStudents()
    alert(`Added ${rows.length} students`)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student Management</h1>
          <button onClick={handleLogout} className="text-sm text-red-600 underline">
            Logout
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editId ? 'Edit Student' : 'Add Student'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Class</label>
              <select
                value={form.class}
                onChange={(e) => setForm({ ...form, class: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Section</label>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Roll Number</label>
              <input
                value={form.roll_number}
                onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">First Name</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Last Name</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Father's Name</label>
              <input
                value={form.father_name}
                onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                {editId ? 'Update' : 'Add'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bulk Upload Card */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Bulk Upload</h2>
          <p className="text-sm text-gray-500 mb-3">
            One student per line: <code className="bg-gray-100 px-1 rounded">Class, Section, Roll, First, Last, DOB, Father</code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            className="w-full border rounded-lg px-3 py-2 font-mono text-sm mb-3"
            placeholder="5, A, 1, Ali, Khan, 2015-04-12, Imran Khan&#10;5, A, 2, Sara, Ahmed, 2015-06-20, Ahmed Raza"
          />
          <button
            onClick={handleBulkUpload}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
          >
            Upload Students
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              All Students ({students.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : students.length === 0 ? (
            <p className="p-6 text-gray-500">No students yet. Add one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3">Class</th>
                    <th className="p-3">Sec</th>
                    <th className="p-3">Roll</th>
                    <th className="p-3">First Name</th>
                    <th className="p-3">Last Name</th>
                    <th className="p-3">DOB</th>
                    <th className="p-3">Father</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{s.class}</td>
                      <td className="p-3">{s.section}</td>
                      <td className="p-3">{s.roll_number}</td>
                      <td className="p-3">{s.first_name}</td>
                      <td className="p-3">{s.last_name}</td>
                      <td className="p-3">{s.dob || '—'}</td>
                      <td className="p-3">{s.father_name || '—'}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-blue-600 underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-600 underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}