import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import Comments from '../components/Comments'
import toast from 'react-hot-toast'
import { Megaphone, Pin, Trash2, Heart, Loader, X, PinOff } from 'lucide-react'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function ComposeModal({ onClose, onCreated }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('isAnnouncement', 'true')
      await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Announcement posted!')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Megaphone size={18} className="text-amber-500" /> New Announcement
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="Write an official announcement for the campus..."
            rows={5} autoFocus maxLength={2000}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button type="submit" disabled={submitting || !content.trim()}
            className="w-full mt-4 bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50">
            {submitting ? 'Posting…' : 'Post Announcement'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Matches the server's sort order exactly (postController.getFeed:
// { pinned: -1, createdAt: -1 }) — needed so an optimistic pin toggle
// moves the item to the right position in the cached list immediately,
// not just after the next full refetch.
const sortAnnouncements = (posts) =>
  [...posts].sort((a, b) => (b.pinned - a.pinned) || (new Date(b.createdAt) - new Date(a.createdAt)))

function AnnouncementCard({ post, canDelete, canPin }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const liked = post.reactions?.like?.includes(user?._id)
  const [busy, setBusy] = useState(false)

  const togglePin = async () => {
    setBusy(true)
    const previous = queryClient.getQueryData(['announcements'])
    queryClient.setQueryData(['announcements'], (old) => old && ({
      ...old,
      posts: sortAnnouncements(old.posts.map((p) => (p._id === post._id ? { ...p, pinned: !p.pinned } : p))),
    }))
    try {
      await api.patch(`/posts/${post._id}/pin`)
    } catch {
      queryClient.setQueryData(['announcements'], previous)
      toast.error('Failed to update pin')
    } finally {
      setBusy(false)
    }
  }

  // This card only ever reacts with 'like' — a simpler single-type
  // toggle than Feed.jsx's exclusive multi-reaction handler, since this
  // UI never exposes the other reaction types for announcements.
  const handleReact = async () => {
    const previous = queryClient.getQueryData(['announcements'])
    queryClient.setQueryData(['announcements'], (old) => old && ({
      ...old,
      posts: old.posts.map((p) => {
        if (p._id !== post._id) return p
        const likes = liked
          ? (p.reactions.like || []).filter((id) => id !== user._id)
          : [...(p.reactions.like || []), user._id]
        return { ...p, reactions: { ...p.reactions, like: likes } }
      }),
    }))
    try {
      await api.patch(`/posts/${post._id}/react`, { type: 'like' })
    } catch {
      queryClient.setQueryData(['announcements'], previous)
      toast.error('Failed to react')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this announcement?')) return
    const previous = queryClient.getQueryData(['announcements'])
    queryClient.setQueryData(['announcements'], (old) => old && ({
      ...old,
      posts: old.posts.filter((p) => p._id !== post._id),
    }))
    try {
      await api.delete(`/posts/${post._id}`)
      toast.success('Deleted')
    } catch {
      queryClient.setQueryData(['announcements'], previous)
      toast.error('Failed to delete')
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 ${post.pinned ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={post.author?.avatar || '/default-avatar.png'} alt="" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{post.author?.name}</p>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full capitalize">
                {post.author?.role}
              </span>
              {post.pinned && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Pin size={9} /> Pinned
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {(canPin || canDelete) && (
          <div className="flex items-center gap-1">
            {canPin && (
              <button onClick={togglePin} disabled={busy} title={post.pinned ? 'Unpin' : 'Pin to top'}
                className="text-gray-300 hover:text-amber-500 p-1">
                {post.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 p-1">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>

      <div className="flex items-center gap-4 pt-3 border-t border-gray-50 dark:border-gray-800">
        <button onClick={handleReact} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {post.reactions?.like?.length || 0}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
        <Comments targetId={post._id} targetType="post" />
      </div>
    </div>
  )
}

export default function AnnouncementsBoard() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const [showCompose, setShowCompose] = useState(false)
  const canManage = ['admin', 'faculty'].includes(user?.role)
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx/Notes.jsx/etc.
  // for the same pattern applied elsewhere.
  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/posts?filter=announcements&limit=50')
      return data
    },
  })

  const posts = data?.posts ?? []
  const invalidateAnnouncements = () => queryClient.invalidateQueries({ queryKey: ['announcements'] })

  return (
    <Layout>
      <AnimatePresence>
        {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onCreated={invalidateAnnouncements} />}
      </AnimatePresence>

      <PageHeader
        title="Announcements"
        subtitle="Official updates from faculty and admin"
        action={canManage ? { label: 'New Announcement', icon: Megaphone, onClick: () => setShowCompose(true) } : undefined}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <AnnouncementCard
              key={post._id}
              post={post}
              canPin={user?.role === 'admin'}
              canDelete={user?.role === 'admin' || post.author?._id === user?._id}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
