import { useSection } from '../hooks/useSection'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { Plus, X, MapPin, Clock, CheckCircle } from 'lucide-react'
import EmptyState from '../components/EmptyState'


const categories = ['electronics', 'books', 'clothing', 'accessories', 'documents', 'other']

function PostModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: 'lost', title: '', description: '',
    category: 'other', location: '', contact: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/lost-found', form)
      toast.success('Post created!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Report Lost / Found</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {['lost', 'found'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                  ${form.type === t ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t}
              </button>
            ))}
          </div>
          <input placeholder="Title *" required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea placeholder="Description" rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input placeholder="Location"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <input placeholder="Contact info (phone/email)"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LostFound() {
  useSection('lostfound')   // ← ADD THIS
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ type: '', category: '', status: 'open' })
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx/Notes.jsx/etc.
  // for the same pattern applied elsewhere.
  const queryKey = ['lostFound', filter.type, filter.category, filter.status]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter.type) params.append('type', filter.type)
      if (filter.category) params.append('category', filter.category)
      if (filter.status) params.append('status', filter.status)
      const { data } = await api.get(`/lost-found?${params}`)
      return data
    },
  })

  const posts = data?.posts ?? []
  const invalidatePosts = () => queryClient.invalidateQueries({ queryKey: ['lostFound'] })

  const handleResolve = async (id) => {
    const previous = queryClient.getQueryData(queryKey)

    // A resolved post stops matching the current filter entirely when
    // viewing "Open" (the default) — it needs to disappear from the
    // list, not just show an updated badge while sitting in a view
    // that's supposed to be open-items-only. When viewing "Resolved" or
    // "All", updating the status in place is correct instead.
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old
      if (filter.status === 'open') {
        return { ...old, posts: old.posts.filter((p) => p._id !== id) }
      }
      return {
        ...old,
        posts: old.posts.map((p) => (p._id === id ? { ...p, status: 'resolved' } : p)),
      }
    })

    try {
      await api.patch(`/lost-found/${id}/resolve`)
      toast.success('Marked as resolved!')
    } catch {
      queryClient.setQueryData(queryKey, previous)
      toast.error('Failed')
    }
  }

  return (
    <Layout>
      {showModal && <PostModal onClose={() => setShowModal(false)} onSuccess={invalidatePosts} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
          <p className="text-sm text-gray-500 mt-0.5">Help your fellow students</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={15} /> Report Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex gap-2">
          {['', 'lost', 'found'].map(t => (
            <button key={t}
              onClick={() => setFilter(f => ({ ...f, type: t }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filter.type === t ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          type="lostfound"
          title="Nothing lost or found yet"
          description="Help your campus community — report a lost item or something you've found."
          actionLabel="Report an Item"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 capitalize
                    ${post.type === 'lost' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {post.type}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{post.title}</h3>
                    {post.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {post.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} /> {post.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                        {post.category}
                      </span>
                    </div>
                    {post.contact && (
                      <p className="text-xs text-indigo-600 mt-1">📞 {post.contact}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${post.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {post.status}
                  </span>
                  {post.status === 'open' && (
                    <button onClick={() => handleResolve(post._id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors">
                      <CheckCircle size={13} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}