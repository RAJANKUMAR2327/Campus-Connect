import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  MessageSquareText, Plus, X, Heart,
  Flag, MessageCircle, Trash2, CheckCircle,
  Send, Loader, EyeOff, Sparkles } from 'lucide-react'

const typeConfig = {
  confession: { label: '🤫 Confession', color: '#8b5cf6' },
  question: { label: '❓ Question', color: '#3b82f6' },
  rant: { label: '😤 Rant', color: '#ef4444' },
  advice: { label: '💡 Advice Wanted', color: '#f59e0b' } }

const categories = [
  { id: 'academics', label: '📚 Academics' },
  { id: 'relationships', label: '💕 Relationships' },
  { id: 'career', label: '💼 Career' },
  { id: 'mental-health', label: '🧠 Mental Health' },
  { id: 'roommate', label: '🏠 Roommate' },
  { id: 'professor', label: '👨‍🏫 Professor' },
  { id: 'campus-life', label: '🎓 Campus Life' },
  { id: 'funny', label: '😂 Funny' },
  { id: 'other', label: '✨ Other' },
]

const reactionConfig = {
  relate: { emoji: '🙋', label: 'I relate' },
  support: { emoji: '🤗', label: 'Support' },
  laugh: { emoji: '😂', label: 'Funny' },
  hug: { emoji: '🫂', label: 'Hug' } }

// ─── CREATE MODAL ───────────────────────────────────────────────────
function CreateConfessionModal({ onClose, onCreated }) {
  const [content, setContent] = useState('')
  const [type, setType] = useState('confession')
  const [category, setCategory] = useState('other')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return toast.error('Write something first')
    setLoading(true)
    try {
      await api.post('/confessions', { content, type, category })
      toast.success('Posted anonymously! 🤫')
      onCreated()
      onClose()
    } catch { toast.error('Failed to post') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Share Anonymously</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-1.5 mb-4 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
            <EyeOff size={13} /> Your identity is completely hidden. No one can trace this back to you.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeConfig).map(([key, conf]) => (
                  <button key={key} type="button" onClick={() => setType(key)}
                    className={`text-xs font-medium px-3 py-2 rounded-xl transition-all ${type === key ? 'ring-1 ring-current' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                    style={type === key ? { background: `${conf.color}15`, color: conf.color } : {}}>
                    {conf.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-full transition-all ${category === c.id ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} maxLength={1000}
                placeholder="What's on your mind? Share freely, no one will know it's you..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">{content.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={loading || !content.trim()}
                className="flex-1 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold flex items-center justify-center gap-2">
                {loading ? 'Posting...' : <><Sparkles size={14} /> Post Anonymously</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── COMMENTS SECTION ───────────────────────────────────────────────
function ConfessionComments({ confessionId }) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx/Notes.jsx/etc.
  const queryKey = ['confession-comments', confessionId]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/confessions/${confessionId}/comments`)
      return data.comments
    },
  })
  const comments = data ?? []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const { data } = await api.post(`/confessions/${confessionId}/comments`, { content: text })
      queryClient.setQueryData(queryKey, (old) => [data.comment, ...(old || [])])
      setText('')
    } catch { toast.error('Failed') }
    finally { setSubmitting(false) }
  }

  // NOT optimistic, deliberately: like everything anonymous on this
  // page, there's no client-visible "have I already liked this" state
  // (comments only expose an aggregate likeCount, same as confession
  // reactions below) — the client genuinely cannot know beforehand
  // whether this click should increment or decrement. Applies the
  // server's authoritative count once the response arrives instead of
  // guessing.
  const handleLike = async (commentId) => {
    try {
      const { data } = await api.patch(`/confessions/comments/${commentId}/like`)
      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((c) => (c._id === commentId ? { ...c, likeCount: data.count } : c))
      )
    } catch {}
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input value={text} onChange={e => setText(e.target.value)} maxLength={500}
          placeholder="Reply anonymously..."
          className="flex-1 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <button type="submit" disabled={submitting || !text.trim()}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
          <Send size={13} />
        </button>
      </form>

      {isLoading ? (
        <Loader size={16} className="animate-spin text-gray-400 mx-auto" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-2">No replies yet</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {comments.map(c => (
            <div key={c._id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                style={{ background: c.avatarColor }}>
                {c.anonName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{c.anonName}</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{c.content}</p>
                </div>
                <button onClick={() => handleLike(c._id)}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 mt-1 px-1 transition-colors">
                  <Heart size={10} /> {c.likeCount || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CONFESSION CARD ────────────────────────────────────────────────
function ConfessionCard({ confession, onReact, onFlag, onDelete, onToggleResolve }) {
  const [showComments, setShowComments] = useState(false)
  const conf = typeConfig[confession.type]
  const catLabel = categories.find(c => c.id === confession.category)?.label

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: confession.avatarColor }}>
            {confession.anonName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{confession.anonName}</p>
            <p className="text-[10px] text-gray-400">{timeAgo(confession.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${conf.color}15`, color: conf.color }}>
            {conf.label}
          </span>
          {confession.isResolved && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center gap-0.5">
              <CheckCircle size={9} /> Resolved
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-2">{catLabel}</p>

      {/* Content */}
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3 whitespace-pre-wrap">
        {confession.content}
      </p>

      {/* Reactions */}
      <div className="flex items-center gap-1 mb-2">
        {Object.entries(reactionConfig).map(([type, conf]) => (
          <button key={type} onClick={() => onReact(confession._id, type)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span>{conf.emoji}</span>
            {confession.reactions[type] > 0 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{confession.reactions[type]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <MessageCircle size={13} /> {confession.commentCount > 0 ? `${confession.commentCount} replies` : 'Reply'}
        </button>

        <div className="flex items-center gap-2">
          {confession.isMine && (confession.type === 'question' || confession.type === 'advice') && (
            <button onClick={() => onToggleResolve(confession._id)}
              className="text-xs text-green-600 dark:text-green-400 hover:underline">
              {confession.isResolved ? 'Unresolve' : 'Mark Resolved'}
            </button>
          )}
          {confession.isMine ? (
            <button onClick={() => onDelete(confession._id)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          ) : (
            <button onClick={() => onFlag(confession._id)} className="text-gray-300 dark:text-gray-700 hover:text-amber-500 transition-colors" title="Report">
              <Flag size={13} />
            </button>
          )}
        </div>
      </div>

      {showComments && <ConfessionComments confessionId={confession._id} />}
    </motion.div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function ConfessionBoard() {
  useSection('dashboard')
  const [showCreate, setShowCreate] = useState(false)
  const [activeType, setActiveType] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): "Load more" button here
  // rather than Feed.jsx's auto-scroll sentinel, but the same
  // useInfiniteQuery underneath — fetchNextPage() just gets called from
  // an onClick instead of an IntersectionObserver callback.
  const queryKey = ['confessions', activeType, activeCategory]

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ page: pageParam, limit: 10 })
      if (activeType) params.append('type', activeType)
      if (activeCategory) params.append('category', activeCategory)
      const { data } = await api.get(`/confessions?${params}`)
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (allPages.length < lastPage.pagination.pages ? allPages.length + 1 : undefined),
  })

  const confessions = data?.pages.flatMap((p) => p.confessions) ?? []
  const invalidateConfessions = () => queryClient.invalidateQueries({ queryKey: ['confessions'] })

  // NOT optimistic, deliberately — see ConfessionComments.handleLike
  // above for why: the client has no visibility into whether this
  // anonymous user already reacted, so there's no safe way to guess
  // whether a click should add or remove a reaction before the
  // authoritative server response arrives.
  const handleReact = async (id, type) => {
    try {
      const { data } = await api.patch(`/confessions/${id}/react`, { type })
      queryClient.setQueriesData({ queryKey: ['confessions'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            confessions: page.confessions.map((c) => (c._id === id ? { ...c, reactions: data.reactions } : c)),
          })),
        }
      })
    } catch {}
  }

  const handleFlag = async (id) => {
    if (!confirm('Report this post for review?')) return
    try {
      await api.post(`/confessions/${id}/flag`)
      toast.success('Reported. Thank you.')
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return
    const previous = queryClient.getQueriesData({ queryKey: ['confessions'] })
    queryClient.setQueriesData({ queryKey: ['confessions'] }, (old) => {
      if (!old) return old
      return { ...old, pages: old.pages.map((page) => ({ ...page, confessions: page.confessions.filter((c) => c._id !== id) })) }
    })
    try {
      await api.delete(`/confessions/${id}`)
      toast.success('Deleted')
    } catch {
      previous.forEach(([key, value]) => queryClient.setQueryData(key, value))
      toast.error('Failed to delete')
    }
  }

  // This one CAN be optimistic — isResolved is a plain boolean the
  // client already has, unlike the anonymous reaction/like counts above.
  const handleToggleResolve = async (id) => {
    const previous = queryClient.getQueriesData({ queryKey: ['confessions'] })
    queryClient.setQueriesData({ queryKey: ['confessions'] }, (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          confessions: page.confessions.map((c) => (c._id === id ? { ...c, isResolved: !c.isResolved } : c)),
        })),
      }
    })
    try {
      await api.patch(`/confessions/${id}/resolve`)
    } catch {
      previous.forEach(([key, value]) => queryClient.setQueryData(key, value))
      toast.error('Failed')
    }
  }

  const typeFilters = [{ id: '', label: 'All' }, ...Object.entries(typeConfig).map(([id, c]) => ({ id, label: c.label }))]

  return (
    <Layout>
      <AnimatePresence>
        {showCreate && <CreateConfessionModal onClose={() => setShowCreate(false)} onCreated={invalidateConfessions} />}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageSquareText className="text-purple-500" size={24} /> Confession Board
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">100% anonymous · Say what's on your mind</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
            <Plus size={15} /> Post
          </button>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 mb-4 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl px-3 py-2.5">
          <EyeOff size={14} /> All posts are completely anonymous. No one — not even admins — can see who posted what.
        </div>

        {/* Type filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {typeFilters.map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl whitespace-nowrap transition-all
                ${activeType === t.id ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          <button onClick={() => setActiveCategory('')}
            className={`text-[11px] px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all ${!activeCategory ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
            All Topics
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(activeCategory === c.id ? '' : c.id)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all ${activeCategory === c.id ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-40 animate-pulse" />)}
          </div>
        ) : confessions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <MessageSquareText size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-1">Nothing here yet</p>
            <button onClick={() => setShowCreate(true)} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
              Be the first to share!
            </button>
          </div>
        ) : (
          <>
            {confessions.map(c => (
              <ConfessionCard key={c._id} confession={c}
                onReact={handleReact} onFlag={handleFlag}
                onDelete={handleDelete} onToggleResolve={handleToggleResolve} />
            ))}
            {hasNextPage && (
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                className="w-full py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}