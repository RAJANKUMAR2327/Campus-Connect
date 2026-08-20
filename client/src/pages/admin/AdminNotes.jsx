import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Trash2, ExternalLink } from 'lucide-react'

export default function AdminNotes() {
  const [notes, setNotes] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])

  const fetchNotes = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/notes?page=${page}&limit=15`)
      setNotes(data.notes)
      setPagination(data.pagination)
      setSelectedIds([])
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [])

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === notes.length ? [] : notes.map(n => n._id))
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} note(s)?`)) return
    try {
      await api.delete('/admin/notes/bulk', { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} note(s) deleted.`)
      fetchNotes(pagination.page)
    } catch { toast.error('Bulk delete failed') }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete note "${title}"?`)) return
    try {
      await api.delete(`/admin/notes/${id}`)
      toast.success('Note deleted.')
      fetchNotes(pagination.page)
    } catch { toast.error('Failed') }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notes Moderation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pagination.total} total notes</p>
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

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3">
                  <input type="checkbox"
                    checked={notes.length > 0 && selectedIds.length === notes.length}
                    onChange={toggleSelectAll}
                    className="rounded" />
                </th>
                {['Title', 'Subject', 'Branch/Year', 'Uploader', 'Downloads', 'Uploaded', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : notes.map(note => (
                <tr key={note._id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(note._id)}
                      onChange={() => toggleSelect(note._id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[180px] truncate">
                      {note.title}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{note.subject}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {note.branch} · Y{note.year}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {note.uploader?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {note.downloadCount || 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a href={note.fileUrl} target="_blank" rel="noreferrer"
                        className="text-gray-400 hover:text-indigo-500 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => handleDelete(note._id, note.title)}
                        className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => fetchNotes(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                  ${pagination.page === i + 1
                    ? 'bg-red-500 text-white'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}