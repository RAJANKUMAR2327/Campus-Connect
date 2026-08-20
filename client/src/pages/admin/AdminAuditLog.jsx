import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { History, Loader, ChevronLeft, ChevronRight } from 'lucide-react'

const ACTION_LABELS = {
  update_user_role: 'changed a role',
  delete_user: 'deleted a user',
  bulk_delete_users: 'bulk-deleted users',
  toggle_user_verification: 'toggled verification',
  delete_note: 'deleted a note',
  bulk_delete_notes: 'bulk-deleted notes',
  delete_comment: 'deleted a comment',
  bulk_delete_comments: 'bulk-deleted comments',
  resolve_report: 'resolved a report',
}

function describeDetails(action, details) {
  if (!details) return null
  switch (action) {
    case 'update_user_role':
      return `${details.userName}: ${details.from} → ${details.to}`
    case 'delete_user':
      return `${details.userName} (${details.email})`
    case 'toggle_user_verification':
      return `${details.userName}: ${details.isVerified ? 'verified' : 'unverified'}`
    case 'delete_note':
      return details.title
    case 'bulk_delete_users':
    case 'bulk_delete_notes':
    case 'bulk_delete_comments':
      return `${details.count} item${details.count !== 1 ? 's' : ''}`
    case 'resolve_report':
      return `${details.targetType} report marked ${details.status}`
    default:
      return null
  }
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/audit-log?page=${page}`)
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
        <p className="text-sm text-gray-400 mt-1">Every admin action, in order — who did what, and when</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={22} className="animate-spin text-red-400" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <History size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">No admin actions recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {logs.map(log => (
              <div key={log._id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-semibold">{log.admin?.name || 'Unknown admin'}</span>{' '}
                    {ACTION_LABELS[log.action] || log.action}
                  </p>
                  {describeDetails(log.action, log.details) && (
                    <p className="text-xs text-gray-400 mt-0.5">{describeDetails(log.action, log.details)}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 shrink-0 ml-3">
                  {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.pages}</span>
              <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
