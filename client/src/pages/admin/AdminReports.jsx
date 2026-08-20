import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { Flag, CheckCircle2, XCircle, Loader } from 'lucide-react'

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate content',
  misinformation: 'Misinformation',
  other: 'Other',
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('pending')
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/reports?status=${status}`)
      setReports(data.reports)
      setPendingCount(data.pendingCount)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [status])

  const resolve = async (id, newStatus) => {
    setBusyId(id)
    try {
      await api.patch(`/admin/reports/${id}`, { status: newStatus })
      toast.success(newStatus === 'actioned' ? 'Marked as actioned' : 'Dismissed')
      fetchReports()
    } catch {
      toast.error('Failed to update report')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports Queue</h1>
          <p className="text-sm text-gray-400 mt-1">
            {pendingCount} report{pendingCount !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { v: 'pending', l: 'Pending' },
          { v: 'actioned', l: 'Actioned' },
          { v: 'dismissed', l: 'Dismissed' },
          { v: 'all', l: 'All' },
        ].map(t => (
          <button key={t.v} onClick={() => setStatus(t.v)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${status === t.v ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={22} className="animate-spin text-red-400" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Flag size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">Nothing here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map(r => (
            <div key={r._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                      {REASON_LABELS[r.reason]}
                    </span>
                    <span className="text-xs text-gray-400">on a {r.targetType}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">reported by {r.reporter?.name}</span>
                  </div>
                  {r.details && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.details}</p>}
                  <p className="text-[11px] text-gray-400 mt-2">{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  {r.reviewedBy && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Reviewed by {r.reviewedBy.name} {r.reviewNote && `— "${r.reviewNote}"`}
                    </p>
                  )}
                </div>
                {status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button onClick={() => resolve(r._id, 'actioned')} disabled={busyId === r._id}
                      className="flex items-center gap-1 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30">
                      <CheckCircle2 size={12} /> Action
                    </button>
                    <button onClick={() => resolve(r._id, 'dismissed')} disabled={busyId === r._id}
                      className="flex items-center gap-1 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <XCircle size={12} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
