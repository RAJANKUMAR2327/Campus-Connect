import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Search, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.users)
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(); setSelectedIds([]) }, [search, roleFilter])

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === users.length ? [] : users.map(u => u._id))
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} user(s)? This cannot be undone.`)) return
    try {
      await api.delete('/admin/users/bulk', { data: { ids: selectedIds } })
      toast.success(`${selectedIds.length} user(s) deleted.`)
      setSelectedIds([])
      fetchUsers(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed')
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role })
      toast.success('Role updated!')
      fetchUsers(pagination.page)
    } catch { toast.error('Failed') }
  }

  const handleToggleVerify = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/verify`)
      toast.success('Verification toggled!')
      fetchUsers(pagination.page)
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted.')
      fetchUsers(pagination.page)
    } catch { toast.error('Failed') }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pagination.total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            placeholder="Search by name, email, college..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3">
                  <input type="checkbox"
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={toggleSelectAll}
                    className="rounded" />
                </th>
                {['User', 'College', 'Branch/Year', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
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
              ) : users.map(user => (
                <tr key={user._id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(user._id)}
                      onChange={() => toggleSelect(user._id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden">
                        {user.avatar
                          ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          : user.name?.charAt(0)
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                    {user.college || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {user.branch || '—'} {user.year ? `· Y${user.year}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleVerify(user._id)}>
                      {user.isVerified
                        ? <CheckCircle size={16} className="text-green-500" />
                        : <XCircle size={16} className="text-red-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}