import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Plus, X, Calendar, MapPin, Video, Phone, Building2, Loader, CheckCircle2, XCircle, Clock } from 'lucide-react'

const modeIcon = { online: Video, offline: MapPin, phone: Phone }
const resultConfig = {
  pending: { label: 'Upcoming', color: '#6366f1', bg: '#eef2ff' },
  passed: { label: 'Passed', color: '#10b981', bg: '#ecfdf5' },
  failed: { label: 'Not selected', color: '#ef4444', bg: '#fef2f2' },
}

function ScheduleRoundModal({ applications, onClose, onAdded }) {
  const [applicationId, setApplicationId] = useState(applications[0]?._id || '')
  const [round, setRound] = useState('')
  const [date, setDate] = useState('')
  const [mode, setMode] = useState('online')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!applicationId) return toast.error('Add an application in the Application Tracker first')
    if (!round.trim() || !date) return toast.error('Round name and date are required')

    setSaving(true)
    try {
      await api.post(`/applications/${applicationId}/rounds`, {
        round, date, mode, notes, result: 'pending',
      })
      toast.success('Interview scheduled!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Schedule Interview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {applications.length === 0 ? (
          <p className="text-sm text-gray-400">
            You need at least one application in the Application Tracker before you can schedule an interview round for it.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Application</label>
              <select value={applicationId} onChange={e => setApplicationId(e.target.value)}
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                {applications.map(a => (
                  <option key={a._id} value={a._id}>{a.company} — {a.role}</option>
                ))}
              </select>
            </div>
            <input value={round} onChange={e => setRound(e.target.value)} placeholder="Round name (e.g. Technical Round 1)" required
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="grid grid-cols-3 gap-2">
              {['online', 'offline', 'phone'].map(m => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                  {m}
                </button>
              ))}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Meeting link, venue, or notes (optional)"
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Scheduling…' : 'Schedule Interview'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

function countdown(date) {
  const diff = new Date(date) - new Date()
  if (diff < 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `in ${days}d ${hours}h`
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `in ${hours}h ${mins}m`
  return `in ${mins}m`
}

export default function InterviewScheduler() {
  useSection('placement')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications')
      setApplications(data.applications || [])
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApplications() }, [])

  // Flatten every interview round across every application into one list
  const allRounds = useMemo(() => {
    const rounds = []
    applications.forEach(app => {
      (app.interviewRounds || []).forEach(r => {
        rounds.push({ ...r, company: app.company, role: app.role, applicationId: app._id })
      })
    })
    return rounds.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [applications])

  const upcoming = allRounds.filter(r => new Date(r.date) >= new Date())
  const past = allRounds.filter(r => new Date(r.date) < new Date()).reverse()

  return (
    <Layout>
      <AnimatePresence>
        {showModal && (
          <ScheduleRoundModal applications={applications} onClose={() => setShowModal(false)} onAdded={fetchApplications} />
        )}
      </AnimatePresence>

      <PageHeader
        title="Interview Scheduler"
        subtitle={`${upcoming.length} upcoming interview${upcoming.length !== 1 ? 's' : ''}`}
        action={{ label: 'Schedule Interview', icon: Plus, onClick: () => setShowModal(true) }}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : allRounds.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">No interviews scheduled yet.</p>
          <p className="text-xs text-gray-400 mt-1">Schedule one above, or add rounds from the Application Tracker.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((r, i) => {
                  const ModeIcon = modeIcon[r.mode] || Building2
                  const cd = countdown(r.date)
                  return (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                          <ModeIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{r.round} · {r.company}</p>
                          <p className="text-xs text-gray-400 truncate">{r.role}</p>
                          {r.notes && <p className="text-xs text-gray-400 truncate mt-0.5">{r.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {new Date(r.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        {cd && (
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
                            <Clock size={10} /> {cd}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Past</h2>
              <div className="space-y-2">
                {past.map((r, i) => {
                  const rc = resultConfig[r.result] || resultConfig.pending
                  return (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between opacity-80">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{r.round} · {r.company}</p>
                        <p className="text-xs text-gray-400 truncate">{r.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {r.result === 'passed' && <CheckCircle2 size={14} className="text-green-500" />}
                        {r.result === 'failed' && <XCircle size={14} className="text-red-500" />}
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: rc.color, background: rc.bg }}>
                          {rc.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
