import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import EmptyState from '../components/EmptyState'
import { Plus, Check, X, Undo2, Trash2 } from 'lucide-react'

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6']

function AddSubjectModal({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const [minRequiredPercent, setMinRequiredPercent] = useState(75)
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/attendance', { name, minRequiredPercent, color })
      toast.success('Subject added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Subject</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Subject name" required autoFocus
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Minimum required attendance (%)</label>
            <input
              type="number" min="0" max="100"
              value={minRequiredPercent}
              onChange={e => setMinRequiredPercent(e.target.value)}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full shrink-0"
                style={{ background: c, outline: color === c ? '2px solid #1e293b' : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Adding…' : 'Add Subject'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function SubjectCard({ subject, onChanged }) {
  const [busy, setBusy] = useState(false)
  const pct = subject.totalClasses > 0 ? (subject.attendedClasses / subject.totalClasses) * 100 : 0
  const safe = pct >= subject.minRequiredPercent

  // How many more classes can be skipped while staying at/above threshold,
  // or how many more must be attended in a row to reach it.
  let advice
  if (subject.totalClasses === 0) {
    advice = 'No classes logged yet'
  } else if (safe) {
    // max skips: floor((attended - threshold*(total+skips))/... ) — solve for n where
    // attended / (total+n) >= threshold/100  =>  n <= attended*100/threshold - total
    const maxSkips = Math.floor((subject.attendedClasses * 100) / subject.minRequiredPercent - subject.totalClasses)
    advice = maxSkips > 0 ? `Can skip ${maxSkips} more class${maxSkips !== 1 ? 'es' : ''}` : 'At the edge — don\'t skip'
  } else {
    // classes needed in a row: (attended+n)/(total+n) >= threshold/100
    const t = subject.minRequiredPercent / 100
    const needed = Math.ceil((t * subject.totalClasses - subject.attendedClasses) / (1 - t))
    advice = `Attend next ${needed} class${needed !== 1 ? 'es' : ''} to recover`
  }

  const mark = async (status) => {
    setBusy(true)
    try {
      await api.post(`/attendance/${subject._id}/mark`, { status })
      onChanged()
    } catch {
      toast.error('Failed to mark attendance')
    } finally {
      setBusy(false)
    }
  }

  const undo = async () => {
    setBusy(true)
    try {
      await api.post(`/attendance/${subject._id}/undo`)
      toast.success('Undone')
      onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nothing to undo')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Remove ${subject.name}?`)) return
    try {
      await api.delete(`/attendance/${subject._id}`)
      onChanged()
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: subject.color }} />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{subject.name}</p>
        </div>
        <button onClick={remove} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
      </div>

      <div className="flex items-end justify-between mb-2">
        <p className={`text-2xl font-bold ${safe ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
          {pct.toFixed(1)}%
        </p>
        <p className="text-xs text-gray-400">{subject.attendedClasses}/{subject.totalClasses} classes</p>
      </div>

      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${safe ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className={`text-[11px] mb-3 ${safe ? 'text-gray-400' : 'text-red-500 font-medium'}`}>{advice}</p>

      <div className="flex gap-2">
        <button onClick={() => mark('present')} disabled={busy}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50">
          <Check size={13} /> Present
        </button>
        <button onClick={() => mark('absent')} disabled={busy}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
          <X size={13} /> Absent
        </button>
        <button onClick={undo} disabled={busy || subject.totalClasses === 0}
          className="px-2.5 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30">
          <Undo2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function AttendanceTracker() {
  useSection('dashboard')
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/attendance')
      setSubjects(data.subjects)
    } catch {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubjects() }, [])

  const overallPct = (() => {
    const total = subjects.reduce((s, sub) => s + sub.totalClasses, 0)
    const attended = subjects.reduce((s, sub) => s + sub.attendedClasses, 0)
    return total > 0 ? ((attended / total) * 100).toFixed(1) : '—'
  })()

  return (
    <Layout>
      <AnimatePresence>
        {showAdd && <AddSubjectModal onClose={() => setShowAdd(false)} onAdded={fetchSubjects} />}
      </AnimatePresence>

      <PageHeader
        title="Attendance Tracker"
        subtitle={subjects.length > 0 ? `Overall: ${overallPct}% across ${subjects.length} subjects` : 'Track attendance per subject'}
        action={{ label: 'Add Subject', icon: Plus, onClick: () => setShowAdd(true) }}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Add a subject to start tracking attendance and see how many classes you can safely skip."
          actionLabel="Add Subject"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <SubjectCard key={s._id} subject={s} onChanged={fetchSubjects} />
          ))}
        </div>
      )}
    </Layout>
  )
}
