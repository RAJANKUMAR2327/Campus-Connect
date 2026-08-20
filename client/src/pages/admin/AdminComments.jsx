import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

export default function AdminComments() {
  const [comments, setComments] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])

  const fetchComments = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/comments?page=${page}&limit=20`)
      setComments(data.comments)
      setPagination(data.pagination)
      setSelectedIds([])
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComments() }, [])

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} comment(s)?`)) return
    try {
      await api.delete('/admin/comments/bulk', { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} comment(s) deleted.`)
      fetchComments(pagination.page)
    } catch { toast.error('Bulk delete failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment?')) return
    try {
      await api.delete(`/admin/comments/${id}`)
      toast.success('Comment deleted.')
      fetchComments(pagination.page)
    } catch { toast.error('Failed') }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comment Moderation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pagination.total} total comments</p>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-xs font-medium text-red-600 dark:text-red-400">{selectedIds.length} selected</span>
          <button onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse h-20" />
          ))
        ) : comments.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">No comments found</div>
        ) : comments.map(comment => (
          <div key={comment._id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-start gap-3 group">
            <input type="checkbox" checked={selectedIds.includes(comment._id)}
              onChange={() => toggleSelect(comment._id)} className="rounded mt-1 shrink-0" />
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {comment.author?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {comment.author?.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {comment.author?.email}
                </span>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full ml-auto">
                  {comment.targetType}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(comment._id)}
              className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => fetchComments(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                ${pagination.page === i + 1
                  ? 'bg-red-500 text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}