import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { HandHeart, Plus, X, Trash2, BadgeCheck, Upload, Loader, CheckCircle2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'community-service', label: 'Community Service' },
  { value: 'ngo', label: 'NGO Work' },
  { value: 'campus-event', label: 'Campus Event' },
  { value: 'teaching', label: 'Teaching / Tutoring' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'other', label: 'Other' },
]

function LogHoursModal({ onClose, onAdded }) {
  const [title, setTitle] = useState('')
  const [organization, setOrganization] = useState('')
  const [category, setCategory] = useState('community-service')
  const [hours, setHours] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [proof, setProof] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !hours || !date) return toast.error('Title, hours, and date are required')
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('organization', organization)
      formData.append('category', category)
      formData.append('hours', hours)
      formData.append('date', date)
      formData.append('description', description)
      if (proof) formData.append('proof', proof)

      await api.post('/volunteer', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Hours logged!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log hours')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Log Volunteer Hours</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What did you do?" required
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Organization (optional)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="0.5" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="Hours" required
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description (optional)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 cursor-pointer hover:border-indigo-400 transition-colors">
            <Upload size={14} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 truncate">{proof ? proof.name : 'Attach proof (optional) — photo, certificate, or letter'}</span>
            <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={e => setProof(e.target.files?.[0] || null)} />
          </label>
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Logging…' : 'Log Hours'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function VolunteerTracker() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [logs, setLogs] = useState([])
  const [totals, setTotals] = useState({ totalHours: 0, verifiedHours: 0 })
  const [pendingLogs, setPendingLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('mine') // 'mine' | 'pending' (admin only)

  const fetchData = async () => {
    try {
      const requests = [api.get('/volunteer')]
      if (isAdmin) requests.push(api.get('/volunteer/all?verified=false'))
      const results = await Promise.all(requests)
      setLogs(results[0].data.logs)
      setTotals({ totalHours: results[0].data.totalHours, verifiedHours: results[0].data.verifiedHours })
      if (isAdmin) setPendingLogs(results[1].data.logs)
    } catch {
      toast.error('Failed to load volunteer logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [isAdmin])

  const remove = async (id) => {
    if (!confirm('Remove this log?')) return
    try {
      await api.delete(`/volunteer/${id}`)
      fetchData()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const verify = async (id) => {
    try {
      await api.patch(`/volunteer/${id}/verify`)
      toast.success('Marked verified!')
      fetchData()
    } catch {
      toast.error('Failed to verify')
    }
  }

  const displayLogs = tab === 'pending' ? pendingLogs : logs

  return (
    <Layout>
      <AnimatePresence>
        {showModal && <LogHoursModal onClose={() => setShowModal(false)} onAdded={fetchData} />}
      </AnimatePresence>

      <PageHeader
        title="Volunteer Hours"
        subtitle={`${totals.totalHours} hours logged · ${totals.verifiedHours} verified`}
        action={{ label: 'Log Hours', icon: Plus, onClick: () => setShowModal(true) }}
      />

      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('mine')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${tab === 'mine' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            My Logs
          </button>
          <button onClick={() => setTab('pending')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${tab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            Pending Verification {pendingLogs.length > 0 && `(${pendingLogs.length})`}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : displayLogs.length === 0 ? (
        <div className="text-center py-16">
          <HandHeart size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">
            {tab === 'pending' ? 'Nothing awaiting verification.' : 'No hours logged yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayLogs.map(log => {
            const cat = CATEGORIES.find(c => c.value === log.category)?.label
            return (
              <div key={log._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{log.title}</p>
                    {log.verified && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full shrink-0">
                        <BadgeCheck size={10} /> Verified
                      </span>
                    )}
                  </div>
                  {tab === 'pending' && log.user && (
                    <p className="text-xs text-gray-400">{log.user.name} · {log.user.branch}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.organization && `${log.organization} · `}{cat} · {new Date(log.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{log.hours}h</span>
                  {tab === 'pending' && (
                    <button onClick={() => verify(log._id)}
                      className="flex items-center gap-1 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30">
                      <CheckCircle2 size={12} /> Verify
                    </button>
                  )}
                  {tab === 'mine' && (
                    <button onClick={() => remove(log._id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
