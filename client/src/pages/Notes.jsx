import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  Upload,
  Download,
  Heart,
  Bookmark,
  Search,
  FileText,
  Users,
  X } from 'lucide-react'
import api from '../api/axios'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { CardSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import useSectionStore from '../store/sectionStore'
import useAuthStore from '../store/authStore'
import { getTheme } from '../styles/tokens'

function UploadModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    branch: '',
    year: '',
    semester: '',
    description: '',
    tags: '' })

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a file')
      return
    }

    setLoading(true)

    try {
      const fd = new FormData()

      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value)
      })

      fd.append(
        'tags',
        JSON.stringify(
          form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      )

      fd.append('file', file)

      await api.post('/notes', fd)

      toast.success('Note uploaded!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Upload Note</h2>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Title *"
            className="w-full border rounded-lg px-3 py-2"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Subject *"
              className="w-full border rounded-lg px-3 py-2"
              value={form.subject}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  subject: e.target.value }))
              }
            />

            <input
              required
              placeholder="Branch *"
              className="w-full border rounded-lg px-3 py-2"
              value={form.branch}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  branch: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              required
              className="border rounded-lg px-3 py-2"
              value={form.year}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  year: e.target.value }))
              }
            >
              <option value="">Year *</option>
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            <select
              className="border rounded-lg px-3 py-2"
              value={form.semester}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  semester: e.target.value }))
              }
            >
              <option value="">Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={3}
            placeholder="Description"
            className="w-full border rounded-lg px-3 py-2"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value }))
            }
          />

          <input
            placeholder="Tags (comma separated)"
            className="w-full border rounded-lg px-3 py-2"
            value={form.tags}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tags: e.target.value }))
            }
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-lg py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NoteCard({ note, onLike, onBookmark, onDownload }) {
  const { currentSection } = useSectionStore()
  const theme = getTheme(currentSection)

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all duration-300 ${theme.card}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg shrink-0 ${theme.icon}`}>
          <FileText size={18} className={theme.text.split(' ')[0]} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{note.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{note.subject}</p>
        </div>
      </div>

      {note.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{note.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mt-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${theme.tag}`}>
          {note.branch}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${theme.tag}`}>
          Year {note.year}
        </span>
        {note.tags?.slice(0, 2).map(tag => (
          <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full ${theme.tag}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-1">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${theme.icon} ${theme.text.split(' ')[0]}`}>
            {note.uploader?.name?.charAt(0)}
          </div>
          <span className="text-[11px] text-gray-500">{note.uploader?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onLike(note._id)}
            className={`flex items-center gap-1 text-[11px] text-gray-400 hover:${theme.text.split(' ')[0].replace('text-','text-')} transition-colors`}>
            <Heart size={13} /> {note.likes?.length || 0}
          </button>
          <button onClick={() => onBookmark(note._id)}
            className="text-gray-400 hover:text-indigo-500 transition-colors">
            <Bookmark size={13} />
          </button>
          <button onClick={() => onDownload(note._id, note.fileUrl)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-green-500 transition-colors">
            <Download size={13} /> {note.downloadCount || 0}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Notes() {
  useSection('notes')
  const { currentSection } = useSectionStore()
  const { user } = useAuthStore()
  const theme = getTheme(currentSection)
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    branch: '',
    year: '',
    subject: '' })
  const [page, setPage] = useState(1)

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx/Notifications.jsx
  // for the same pattern applied elsewhere. placeholderData: keepPreviousData
  // means switching pages shows the previous page's notes while the new
  // one loads, instead of flashing a full loading-skeleton grid — a real
  // UX improvement the original page-number pagination didn't have.
  const queryKey = ['notes', { search, branch: filters.branch, year: filters.year, subject: filters.subject, page }]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 12 })
      if (search) params.append('search', search)
      if (filters.branch) params.append('branch', filters.branch)
      if (filters.year) params.append('year', filters.year)
      if (filters.subject) params.append('subject', filters.subject)

      const { data } = await api.get(`/notes?${params}`)
      return data
    },
    placeholderData: keepPreviousData,
  })

  const notes = data?.notes ?? []
  const pagination = data?.pagination ?? { page: 1, pages: 1, total: 0 }

  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['notes'] })

  // Mirrors the server's exact toggle logic in noteController.toggleLike
  // (note.likes.pull/push by the current user's id). Optimistic with
  // rollback on failure — same discipline as Feed.jsx's reaction handler.
  const handleLike = async (id) => {
    const previous = queryClient.getQueryData(queryKey)
    queryClient.setQueryData(queryKey, (old) => old && ({
      ...old,
      notes: old.notes.map((note) => {
        if (note._id !== id) return note
        const alreadyLiked = note.likes?.includes(user._id)
        const likes = alreadyLiked
          ? note.likes.filter((uid) => uid !== user._id)
          : [...(note.likes || []), user._id]
        return { ...note, likes }
      }),
    }))
    try {
      await api.patch(`/notes/${id}/like`)
    } catch {
      queryClient.setQueryData(queryKey, previous)
      toast.error('Failed to like')
    }
  }

  const handleBookmark = async (id) => {
    try {
      await api.patch(`/notes/${id}/bookmark`)
      toast.success('Bookmark updated')
    } catch {
      toast.error('Failed to bookmark')
    }
  }

  // Optimistically increments the displayed download count — the
  // original never updated this locally at all (it would only reflect
  // the real count after switching pages or refetching some other way).
  const handleDownload = async (id, url) => {
    queryClient.setQueryData(queryKey, (old) => old && ({
      ...old,
      notes: old.notes.map((note) =>
        note._id === id ? { ...note, downloadCount: (note.downloadCount || 0) + 1 } : note
      ),
    }))
    try {
      await api.patch(`/notes/${id}/download`)
      window.open(url, '_blank')
    } catch {
      toast.error('Download failed')
    }
  }

  return (
    <Layout>
      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={invalidateNotes}
        />
      )}

      <div className="flex justify-end mb-3">
        <Link to="/notes/collab" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          <Users size={13} /> Live Collaborative Notes
        </Link>
      </div>

      <PageHeader
        title="Notes"
        subtitle={`${pagination.total || 0} notes shared by students`}
        action={{ label: 'Upload Note', icon: Upload, onClick: () => setShowModal(true) }}
      />

      <div className={`bg-white dark:bg-gray-900 rounded-xl border p-4 mb-6 flex flex-wrap gap-3 ${theme.topbarBorder}`}>
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            placeholder="Search notes..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['CSE','ECE','EEE','Mechanical'].map(b => (
            <button key={b}
              onClick={() => { setFilters(f => ({ ...f, branch: f.branch === b ? '' : b })); setPage(1) }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                ${filters.branch === b
                  ? theme.filterActive + ' border-transparent'
                  : theme.filter + ' bg-white dark:bg-gray-990 hover:opacity-80'}`}>
              {b}
            </button>
          ))}
          {[1,2,3,4,5].map(y => (
            <button key={y}
              onClick={() => { setFilters(f => ({ ...f, year: f.year === y.toString() ? '' : y.toString() })); setPage(1) }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                ${filters.year === y.toString()
                  ? theme.filterActive + ' border-transparent'
                  : theme.filter + ' bg-white dark:bg-gray-900 hover:opacity-80'}`}>
              Y{y}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState message="No notes found matching your criteria." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onDownload={handleDownload}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded ${
                    pagination.page === i + 1
                      ? 'bg-indigo-600 text-white'
                      : 'border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}