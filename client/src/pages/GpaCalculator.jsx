import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Plus, Trash2, Loader, TrendingUp, X } from 'lucide-react'

// 10-point scale, standard across Indian universities (AICTE pattern)
const GRADES = [
  { label: 'O', points: 10 },
  { label: 'A+', points: 9 },
  { label: 'A', points: 8 },
  { label: 'B+', points: 7 },
  { label: 'B', points: 6 },
  { label: 'C', points: 5 },
  { label: 'P', points: 4 },
  { label: 'F', points: 0 },
]

const emptyCourse = () => ({ id: crypto.randomUUID(), name: '', credits: '', grade: 'A' })

export default function GpaCalculator() {
  useSection('dashboard')
  const [records, setRecords] = useState([])
  const [cgpa, setCgpa] = useState(0)
  const [loading, setLoading] = useState(true)
  const [semesterLabel, setSemesterLabel] = useState('')
  const [courses, setCourses] = useState([emptyCourse()])
  const [saving, setSaving] = useState(false)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/gpa')
      setRecords(data.records)
      setCgpa(data.cgpa)
    } catch {
      toast.error('Failed to load GPA history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecords() }, [])

  const addCourseRow = () => setCourses(c => [...c, emptyCourse()])
  const removeCourseRow = (id) => setCourses(c => c.filter(row => row.id !== id))
  const updateCourse = (id, field, value) => {
    setCourses(c => c.map(row => row.id === id ? { ...row, [field]: value } : row))
  }

  const liveSgpa = (() => {
    let points = 0, credits = 0
    for (const c of courses) {
      const cr = parseFloat(c.credits)
      if (!cr) continue
      const gp = GRADES.find(g => g.label === c.grade)?.points ?? 0
      points += cr * gp
      credits += cr
    }
    return credits > 0 ? (points / credits).toFixed(2) : '0.00'
  })()

  const handleSave = async () => {
    if (!semesterLabel.trim()) return toast.error('Give this semester a name, e.g. "Semester 5"')
    const validCourses = courses.filter(c => c.name.trim() && parseFloat(c.credits) > 0)
    if (validCourses.length === 0) return toast.error('Add at least one course with credits')

    setSaving(true)
    try {
      const payload = {
        semesterLabel,
        courses: validCourses.map(c => ({
          name: c.name,
          credits: parseFloat(c.credits),
          grade: c.grade,
          gradePoint: GRADES.find(g => g.label === c.grade)?.points ?? 0,
        })),
      }
      await api.post('/gpa', payload)
      toast.success('Semester saved!')
      setSemesterLabel('')
      setCourses([emptyCourse()])
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this semester from your CGPA calculation?')) return
    try {
      await api.delete(`/gpa/${id}`)
      toast.success('Removed')
      fetchRecords()
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <Layout>
      <PageHeader title="GPA Calculator" subtitle="Track your SGPA per semester and running CGPA" />

      {/* CGPA summary */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/70 uppercase tracking-wide">Current CGPA</p>
          <p className="text-4xl font-bold mt-1">{cgpa.toFixed ? cgpa.toFixed(2) : cgpa}</p>
          <p className="text-xs text-white/60 mt-1">{records.length} semester{records.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <TrendingUp size={40} className="text-white/30" />
      </div>

      {/* New semester form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <input
            value={semesterLabel}
            onChange={e => setSemesterLabel(e.target.value)}
            placeholder="Semester name (e.g. Semester 5)"
            className="text-sm font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 flex-1 mr-3"
          />
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-400 uppercase">Live SGPA</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{liveSgpa}</p>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {courses.map(course => (
              <motion.div key={course.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 items-center">
                <input
                  value={course.name}
                  onChange={e => updateCourse(course.id, 'name', e.target.value)}
                  placeholder="Course name"
                  className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={course.credits}
                  onChange={e => updateCourse(course.id, 'credits', e.target.value)}
                  placeholder="Credits"
                  className="w-20 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={course.grade}
                  onChange={e => updateCourse(course.id, 'grade', e.target.value)}
                  className="w-20 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {GRADES.map(g => <option key={g.label} value={g.label}>{g.label}</option>)}
                </select>
                <button onClick={() => removeCourseRow(course.id)}
                  disabled={courses.length === 1}
                  className="text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button onClick={addCourseRow}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            <Plus size={14} /> Add course
          </button>
          <button onClick={handleSave} disabled={saving}
            className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Semester'}
          </button>
        </div>
      </div>

      {/* History */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : records.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No semesters saved yet. Add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {records.slice().reverse().map(r => (
            <div key={r._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.semesterLabel}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.courses.length} courses · {r.totalCredits} credits</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{r.sgpa}</p>
                  <p className="text-[10px] text-gray-400 uppercase">SGPA</p>
                </div>
                <button onClick={() => handleDelete(r._id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
