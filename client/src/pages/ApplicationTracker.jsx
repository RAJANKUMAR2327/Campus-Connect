import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  Plus, X, Briefcase, Building, MapPin,
  ExternalLink, Trash2,
  TrendingUp, Award, Clock,
  Search, LayoutGrid,
  List as ListIcon, AlertCircle } from 'lucide-react'

const statusConfig = {
  wishlist: { label: 'Wishlist', color: '#94a3b8', bg: '#f1f5f9' },
  applied: { label: 'Applied', color: '#6366f1', bg: '#eef2ff' },
  'oa-test': { label: 'OA/Test', color: '#8b5cf6', bg: '#f5f3ff' },
  'interview-1': { label: 'Interview 1', color: '#3b82f6', bg: '#eff6ff' },
  'interview-2': { label: 'Interview 2', color: '#0ea5e9', bg: '#f0f9ff' },
  'interview-3': { label: 'Interview 3', color: '#06b6d4', bg: '#ecfeff' },
  'hr-round': { label: 'HR Round', color: '#14b8a6', bg: '#f0fdfa' },
  offer: { label: 'Offer', color: '#10b981', bg: '#ecfdf5' },
  accepted: { label: 'Accepted', color: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
  withdrawn: { label: 'Withdrawn', color: '#6b7280', bg: '#f9fafb' } }

const kanbanColumns = ['wishlist', 'applied', 'oa-test', 'interview-1', 'interview-2', 'hr-round', 'offer']

const priorityConfig = {
  high: { color: '#ef4444', label: 'High' },
  medium: { color: '#f59e0b', label: 'Medium' },
  low: { color: '#6b7280', label: 'Low' } }

// ─── ADD/EDIT MODAL ────────────────────────────────────────────────
function ApplicationModal({ application, onClose, onSaved }) {
  const [form, setForm] = useState({
    company: application?.company || '',
    role: application?.role || '',
    type: application?.type || 'internship',
    source: application?.source || 'oncampus',
    location: application?.location || '',
    workMode: application?.workMode || 'onsite',
    package: application?.package || '',
    jobUrl: application?.jobUrl || '',
    appliedDate: application?.appliedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    deadline: application?.deadline?.slice(0, 10) || '',
    referredBy: application?.referredBy || '',
    notes: application?.notes || '',
    priority: application?.priority || 'medium' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (application) {
        await api.patch(`/applications/${application._id}`, form)
        toast.success('Updated!')
      } else {
        await api.post('/applications', form)
        toast.success('Application added!')
      }
      onSaved()
      onClose()
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {application ? 'Edit Application' : 'Add Application'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Company *</label>
                <input value={form.company} required onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Google"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role *</label>
                <input value={form.role} required onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="SWE Intern"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Source</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                  {['oncampus', 'offcampus', 'referral', 'linkedin', 'naukri', 'company-website', 'other'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Work Mode</label>
                <select value={form.workMode} onChange={e => setForm(f => ({ ...f, workMode: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Bangalore"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Package</label>
                <input value={form.package} onChange={e => setForm(f => ({ ...f, package: e.target.value }))}
                  placeholder="12 LPA"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Applied Date</label>
                <input type="date" value={form.appliedDate} onChange={e => setForm(f => ({ ...f, appliedDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Job URL</label>
              <input value={form.jobUrl} onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Referred By</label>
                <input value={form.referredBy} onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                <div className="flex gap-1.5">
                  {Object.entries(priorityConfig).map(([key, conf]) => (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, priority: key }))}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                      style={form.priority === key ? { background: `${conf.color}20`, color: conf.color, border: `1px solid ${conf.color}` } : { border: '1px solid #e5e7eb', color: '#6b7280' }}>
                      {conf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes} rows={2} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                {loading ? 'Saving...' : application ? 'Update' : 'Add Application'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── APPLICATION CARD ──────────────────────────────────────────────
function ApplicationCard({ app, onEdit, onDelete, onStatusChange, draggable }) {
  const conf = statusConfig[app.status]
  const priConf = priorityConfig[app.priority]

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData('appId', app._id)}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 cursor-pointer hover:shadow-md transition-all group"
      onClick={() => onEdit(app)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Building size={13} className="text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{app.company}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{app.role}</p>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: priConf.color }} title={priConf.label} />
      </div>

      {app.package && (
        <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1.5">{app.package}</p>
      )}

      <div className="flex items-center gap-2 text-[9px] text-gray-400 dark:text-gray-600 mb-2">
        {app.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{app.location}</span>}
        {app.workMode && <span className="capitalize">{app.workMode}</span>}
      </div>

      {app.deadline && new Date(app.deadline) > new Date() && (
        <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 mb-2">
          <AlertCircle size={9} /> Due {new Date(app.deadline).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
        <span className="text-[9px] text-gray-400 dark:text-gray-600 capitalize">{app.source}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(app._id) }}
          className="text-gray-300 dark:text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── KANBAN VIEW ───────────────────────────────────────────────────
function KanbanView({ board, onEdit, onDelete, onRefresh }) {
  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId')
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus })
      onRefresh()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {kanbanColumns.map(status => {
        const conf = statusConfig[status]
        const apps = board[status] || []
        return (
          <div key={status}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, status)}
            className="w-64 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: conf.color }} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{conf.label}</span>
              </div>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{apps.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px] p-2 rounded-xl" style={{ background: `${conf.bg}` }}>
              <AnimatePresence>
                {apps.map(app => (
                  <ApplicationCard key={app._id} app={app} onEdit={onEdit} onDelete={onDelete} draggable />
                ))}
              </AnimatePresence>
              {apps.length === 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center py-6">Drop here</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ANALYTICS DASHBOARD ───────────────────────────────────────────
function AnalyticsView({ analytics }) {
  if (!analytics) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Applications', value: analytics.total, icon: Briefcase, color: '#6366f1' },
          { label: 'In Progress', value: analytics.interviewing, icon: Clock, color: '#3b82f6' },
          { label: 'Offers', value: analytics.offers, icon: Award, color: '#10b981' },
          { label: 'Companies', value: analytics.totalCompanies, icon: Building, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Success Rate</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${analytics.successRate}%` }} />
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{analytics.successRate}%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Response Rate</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${analytics.responseRate}%` }} />
            </div>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{analytics.responseRate}%</span>
          </div>
        </div>
      </div>

      {analytics.upcomingDeadlines?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
            <AlertCircle size={13} /> Upcoming Deadlines
          </p>
          <div className="space-y-1.5">
            {analytics.upcomingDeadlines.map(d => (
              <div key={d._id} className="flex justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300">{d.company} - {d.role}</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{new Date(d.deadline).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function ApplicationTracker() {
  useSection('placement')
  const [board, setBoard] = useState({})
  const [applications, setApplications] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [showModal, setShowModal] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [boardRes, listRes, analyticsRes] = await Promise.all([
        api.get('/applications/board'),
        api.get(`/applications${search ? `?search=${search}` : ''}`),
        api.get('/applications/analytics'),
      ])
      setBoard(boardRes.data.board)
      setApplications(listRes.data.applications)
      setAnalytics(analyticsRes.data)
    } catch { toast.error('Failed to load applications') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [search])

  const handleDelete = async (id) => {
    if (!confirm('Delete this application?')) return
    try {
      await api.delete(`/applications/${id}`)
      toast.success('Deleted!')
      fetchData()
    } catch { toast.error('Failed') }
  }

  const handleEdit = (app) => {
    setEditingApp(app)
    setShowModal(true)
  }

  return (
    <Layout>
      <AnimatePresence>
        {showModal && (
          <ApplicationModal
            application={editingApp}
            onClose={() => { setShowModal(false); setEditingApp(null) }}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Application Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your job & internship applications</p>
        </div>
        <button onClick={() => { setEditingApp(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> Add Application
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'kanban', icon: LayoutGrid, label: 'Board' },
          { id: 'list', icon: ListIcon, label: 'List' },
          { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all
              ${view === v.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
            <v.icon size={13} /> {v.label}
          </button>
        ))}
      </div>

      {view !== 'analytics' && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" /></div>
      ) : view === 'kanban' ? (
        <KanbanView board={board} onEdit={handleEdit} onDelete={handleDelete} onRefresh={fetchData} />
      ) : view === 'list' ? (
        applications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Briefcase size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map(app => {
              const conf = statusConfig[app.status]
              return (
                <div key={app._id} onClick={() => handleEdit(app)}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <Building size={18} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{app.company}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{app.role}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: conf.bg, color: conf.color }}>
                    {conf.label}
                  </span>
                  {app.jobUrl && (
                    <a href={app.jobUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-indigo-500">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(app._id) }}
                    className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <AnalyticsView analytics={analytics} />
      )}
    </Layout>
  )
}