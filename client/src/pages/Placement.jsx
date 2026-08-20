import { useSection } from '../hooks/useSection'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import {
  Plus, X, ArrowUp,
  Building, MapPin, Clock, ExternalLink } from 'lucide-react'
import EmptyState from '../components/EmptyState'

const types = ['job', 'internship', 'experience', 'resource', 'discussion']

const typeConfig = {
  job: { color: 'bg-blue-50 text-blue-600', label: 'Job' },
  internship: { color: 'bg-indigo-50 text-indigo-600', label: 'Internship' },
  experience: { color: 'bg-green-50 text-green-600', label: 'Experience' },
  resource: { color: 'bg-amber-50 text-amber-600', label: 'Resource' },
  discussion: { color: 'bg-purple-50 text-purple-600', label: 'Discussion' } }

function CreatePostModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: 'job', title: '', company: '', description: '',
    role: '', package: '', location: '', applyLink: '',
    deadline: '', tags: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        tags: JSON.stringify(
          form.tags.split(',').map(t => t.trim()).filter(Boolean)
        ) }
      await api.post('/placement', payload)
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
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">New Placement Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                  ${form.type === t
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t}
              </button>
            ))}
          </div>

          <input placeholder="Title *" required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Company"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <input placeholder="Role / Position"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>

          <textarea placeholder="Description — share details, prep tips, experience..." rows={4}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Package (e.g. 12 LPA)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.package} onChange={e => setForm(f => ({ ...f, package: e.target.value }))} />
            <input placeholder="Location"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Apply Link"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.applyLink} onChange={e => setForm(f => ({ ...f, applyLink: e.target.value }))} />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Deadline</label>
              <input type="date"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>

          <input placeholder="Tags (comma separated: DSA, system-design, on-campus)"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
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

export default function Placement() {
  useSection('placement')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeType, setActiveType] = useState('')

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeType) params.append('type', activeType)
      const { data } = await api.get(`/placement?${params}`)
      setPosts(data.posts)
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [activeType])

  const handleUpvote = async (id) => {
    try {
      await api.patch(`/placement/${id}/upvote`)
      fetchPosts()
    } catch { toast.error('Failed') }
  }

  return (
    <Layout>
      {showModal && (
        <CreatePostModal onClose={() => setShowModal(false)} onSuccess={fetchPosts} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Jobs, internships & interview experiences</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={15} /> New Post
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveType('')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors
            ${activeType === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All
        </button>
        {types.map(t => (
          <button key={t}
            onClick={() => setActiveType(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-colors
              ${activeType === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          type="placement"
          title="No placement posts yet"
          description="Share job opportunities, interview experiences, or resources with your batchmates."
          actionLabel="Create First Post"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post._id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex gap-4">
                {/* Upvote */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button onClick={() => handleUpvote(post._id)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <ArrowUp size={14} />
                  </button>
                  <span className="text-xs font-medium text-gray-500">
                    {post.upvotes?.length || 0}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig[post.type]?.color}`}>
                      {typeConfig[post.type]?.label}
                    </span>
                    {post.company && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Building size={11} /> {post.company}
                      </span>
                    )}
                    {post.package && (
                      <span className="text-xs font-semibold text-green-600">{post.package}</span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{post.title}</h3>

                  {post.description && (
                    <p className="text-xs text-gray-500 line-clamp-3 mb-2">{post.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {post.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={10} /> {post.location}
                      </span>
                    )}
                    {post.deadline && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} /> Deadline: {new Date(post.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {post.tags?.map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                        {post.postedBy?.name?.charAt(0)}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {post.postedBy?.name} · {post.postedBy?.branch}
                      </span>
                      <span className="text-[11px] text-gray-300 ml-1">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {post.applyLink && (
                      <a href={post.applyLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        Apply <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}