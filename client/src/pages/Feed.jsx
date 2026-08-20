import { useState, useRef, useCallback } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import Comments from '../components/Comments'
import toast from 'react-hot-toast'
import {
  Image, Megaphone, Send,
  Heart,
  Pin, Trash2, MoreHorizontal, Globe,
  X, Loader } from 'lucide-react'

// ─── CREATE POST BOX ──────────────────────────────────────────────
function CreatePost({ onCreated }) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [type, setType] = useState('post')
  const [loading, setLoading] = useState(false)
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollEndsAt, setPollEndsAt] = useState('')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const fileRef = useRef()

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions(prev => [...prev, ''])
  }

  const updatePollOption = (i, val) => {
    setPollOptions(prev => { const n = [...prev]; n[i] = val; return n })
  }

  const removePollOption = (i) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, idx) => idx !== i))
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && type !== 'poll') return toast.error('Write something first!')
    if (type === 'poll' && !pollQuestion.trim()) return toast.error('Add poll question!')
    if (type === 'poll' && pollOptions.filter(o => o.trim()).length < 2) {
      return toast.error('Add at least 2 poll options!')
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('content', content)
      fd.append('type', type)
      if (type === 'announcement') fd.append('isAnnouncement', 'true')
      if (type === 'poll') {
        fd.append('poll', JSON.stringify({
          question: pollQuestion,
          options: pollOptions.filter(o => o.trim()).map(text => ({ text, votes: [] })),
          endsAt: pollEndsAt || undefined,
          allowMultiple: false }))
      }
      images.forEach(img => fd.append('images', img))

      await api.post('/posts', fd)
      toast.success('Posted!')
      setContent('')
      setPollOptions(['', ''])
      setPollQuestion('')
      setImages([])
      setPreviews([])
      setType('post')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5 shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{user?.name?.charAt(0)}</div>
          }
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.branch} · Year {user?.year}</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 mb-3">
        {[
          { id: 'post', label: '✍️ Post', allowed: true },
          { id: 'poll', label: '📊 Poll', allowed: true },
          { id: 'announcement', label: '📢 Announce', allowed: ['admin', 'faculty'].includes(user?.role) },
        ].filter(t => t.allowed).map(t => (
          <button key={t.id}
            onClick={() => setType(t.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all
              ${type === t.id
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Poll question */}
      {type === 'poll' && (
        <div className="mb-3">
          <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 block">
            Poll question *
          </label>
          <input
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full px-3 py-2 text-sm border-2 border-indigo-200 dark:border-indigo-800 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Content textarea */}
      {type === 'poll' && (
        <label className="text-xs font-medium text-gray-400 mb-1 block">
          Caption (optional)
        </label>
      )}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={
          type === 'announcement' ? "Write an announcement for your campus..."
          : type === 'poll' ? "Add context to your poll (optional)..."
          : "Share something with your campus community..."
        }
        rows={3}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
      />

      {/* Poll options */}
      {type === 'poll' && (
        <div className="space-y-2 mb-3">
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={e => updatePollOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pollOptions.length > 2 && (
                <button onClick={() => removePollOption(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button onClick={addPollOption}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              + Add option
            </button>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Poll ends at (optional)</label>
            <input type="datetime-local"
              value={pollEndsAt}
              onChange={e => setPollEndsAt(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => { setImages(prev => prev.filter((_, idx) => idx !== i)); setPreviews(prev => prev.filter((_, idx) => idx !== i)) }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Image size={14} /> Photo
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${content.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
            {content.length}/2000
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && type !== 'poll')}
            className="flex items-center gap-2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            {loading ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── REACTION BUTTON ──────────────────────────────────────────────
const reactionConfig = {
  like: { emoji: '❤️', label: 'Like', color: 'text-red-500' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: 'text-amber-500' },
  support: { emoji: '🤝', label: 'Support', color: 'text-blue-500' },
  insightful: { emoji: '💡', label: 'Insightful', color: 'text-yellow-500' } }

function ReactionPicker({ postId, reactions, onReact }) {
  const [showPicker, setShowPicker] = useState(false)
  const totalReactions = Object.values(reactions).reduce((s, v) => s + v, 0)

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
      >
        {totalReactions > 0 ? '❤️' : <Heart size={14} />}
        <span>{totalReactions > 0 ? totalReactions : 'React'}</span>
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 flex gap-1 z-10"
          >
            {Object.entries(reactionConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => { onReact(postId, type); setShowPicker(false) }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-125"
                title={config.label}
              >
                <span className="text-lg">{config.emoji}</span>
                <span className="text-[9px] text-gray-500">{config.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── POLL DISPLAY ─────────────────────────────────────────────────
function PollDisplay({ post, onVote }) {
  const { user } = useAuthStore()
  const [pollData, setPollData] = useState(null)

  const userVotedOption = post.poll?.options?.findIndex(opt =>
    opt.votes?.includes(user?.id)
  )
  const hasVoted = userVotedOption !== -1
  const totalVotes = post.poll?.options?.reduce((s, o) => s + (o.votes?.length || 0), 0) || 0
  const isEnded = post.poll?.endsAt && new Date() > new Date(post.poll.endsAt)

  const handleVote = async (optionIndex) => {
    if (isEnded) return
    try {
      const { data } = await api.patch(`/posts/${post._id}/vote`, { optionIndex })
      setPollData(data.poll)
      onVote()
    } catch { toast.error('Vote failed') }
  }

  const options = pollData?.options || post.poll?.options?.map((opt, i) => ({
    text: opt.text,
    votes: opt.votes?.length || 0,
    percentage: totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0,
    hasVoted: opt.votes?.includes(user?.id) }))

  return (
    <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        📊 {post.poll.question}
      </p>
      <div className="space-y-2">
        {options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={isEnded}
            className="w-full text-left relative overflow-hidden"
          >
            <div className={`relative z-10 flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all
              ${opt.hasVoted
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
              {/* Progress bar */}
              <div
                className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg transition-all duration-700"
                style={{ width: `${hasVoted || isEnded ? opt.percentage : 0}%` }}
              />
              <span className={`relative text-xs font-medium ${opt.hasVoted ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {opt.hasVoted && '✓ '}{opt.text}
              </span>
              {(hasVoted || isEnded) && (
                <span className="relative text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {opt.percentage}%
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400 dark:text-gray-600">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {post.poll.endsAt && (
          <span>{isEnded ? '⏰ Ended' : `Ends ${new Date(post.poll.endsAt).toLocaleDateString()}`}</span>
        )}
      </div>
    </div>
  )
}

// ─── POST CARD ────────────────────────────────────────────────────
function PostCard({ post, onDelete, onReact, onRefresh }) {
  const { user } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const isAuthor = post.author?._id === user?.id
  const isAdmin = user?.role === 'admin'

  const totalReactions = Object.values(post.reactions || {}).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0)
  const reactionCounts = {
    like: post.reactions?.like?.length || 0,
    celebrate: post.reactions?.celebrate?.length || 0,
    support: post.reactions?.support?.length || 0,
    insightful: post.reactions?.insightful?.length || 0 }

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm mb-4 overflow-hidden
        ${post.pinned ? 'border-indigo-200 dark:border-indigo-800' : 'border-gray-100 dark:border-gray-800'}`}
    >
      {/* Pinned banner */}
      {post.pinned && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900">
          <Pin size={12} className="text-indigo-500" />
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Pinned Post</span>
        </div>
      )}

      {/* Announcement banner */}
      {post.isAnnouncement && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900">
          <Megaphone size={12} className="text-amber-500" />
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Announcement</span>
        </div>
      )}

      <div className="p-4">
        {/* Author */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-gray-50 dark:ring-gray-800">
              {post.author?.avatar
                ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{post.author?.name?.charAt(0)}</div>
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{post.author?.name}</p>
                {post.author?.role === 'admin' && (
                  <span className="text-[9px] bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full font-medium">Admin</span>
                )}
                {post.author?.role === 'faculty' && (
                  <span className="text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">Faculty</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{post.author?.branch} · Y{post.author?.year}</span>
                <span>·</span>
                <span>{timeAgo(post.createdAt)}</span>
                <Globe size={9} />
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1 z-10 min-w-[140px]"
                >
                  {isAdmin && (
                    <button
                      onClick={async () => { await api.patch(`/posts/${post._id}/pin`); onRefresh(); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Pin size={12} /> {post.pinned ? 'Unpin' : 'Pin post'}
                    </button>
                  )}
                  {(isAuthor || isAdmin) && (
                    <button
                      onClick={() => { onDelete(post._id); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3 whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Images */}
        {post.images?.length > 0 && (
          <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-full h-48 object-cover rounded-xl" />
            ))}
          </div>
        )}

        {/* Poll */}
        {post.type === 'poll' && post.poll && (
          <PollDisplay post={post} onVote={onRefresh} />
        )}

        {/* Reaction summary */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {Object.entries(reactionCounts).filter(([, v]) => v > 0).map(([type, count]) => (
              <span key={type} className="text-sm">{reactionConfig[type].emoji}</span>
            ))}
            <span className="text-xs text-gray-400 ml-1">{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
          <ReactionPicker
            postId={post._id}
            reactions={reactionCounts}
            onReact={onReact}
          />
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
          >
            💬 Comment
          </button>
          <div className="ml-auto text-xs text-gray-300 dark:text-gray-700">
            👁 {post.viewCount || 0}
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <Comments targetId={post._id} targetType="post" />
        )}
      </div>
    </motion.div>
  )
}

// ─── MAIN FEED PAGE ───────────────────────────────────────────────
export default function Feed() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('all')
  const observer = useRef()
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): this used to be hand-rolled
  // useState/useEffect/try-catch, with a fresh network round-trip on
  // every mount and every filter switch, no caching, and no request
  // dedup. useInfiniteQuery gives all three for free — switching back to
  // a filter tab visited within the last 30s (see src/queryClient.js's
  // staleTime) now shows cached data instantly instead of a loading
  // skeleton, and never issues a duplicate in-flight request for the
  // same page.
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts', filter],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/posts?page=${pageParam}&limit=10&filter=${filter}`)
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.pagination.hasMore ? allPages.length + 1 : undefined),
  })

  const posts = data?.pages.flatMap((p) => p.posts) ?? []

  // Infinite scroll sentinel
  const lastPostRef = useCallback(node => {
    if (isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    })
    if (node) observer.current.observe(node)
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${id}`)
      // Removes the deleted post from every cached filter variant (not
      // just the one currently being viewed), so switching filter tabs
      // afterward doesn't briefly show a post that no longer exists.
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p._id !== id),
          })),
        }
      })
      toast.success('Deleted!')
    } catch { toast.error('Failed') }
  }

  // PERFORMANCE/UX FIX (FE-03, adapted for react-query): mirrors the
  // server's exact exclusive-reaction logic in
  // postController.toggleReaction — remove the user from every reaction
  // type first, then add them to the clicked type only if they hadn't
  // already reacted with it. Patches every cached filter variant that
  // contains this post via setQueriesData, which is actually an
  // improvement over the pre-react-query version: that could only ever
  // update the single in-memory `posts` array for whichever filter was
  // currently being viewed, so switching filters afterward could
  // show a stale reaction count until the next full refetch.
  const REACTION_TYPES = ['like', 'celebrate', 'support', 'insightful']

  const handleReact = async (postId, type) => {
    const previousQueries = queryClient.getQueriesData({ queryKey: ['posts'] })

    const patchPost = (post) => {
      if (post._id !== postId) return post
      const alreadyReactedWithType = post.reactions?.[type]?.some((id) => id === user._id) ?? false
      const updatedReactions = {}
      for (const t of REACTION_TYPES) {
        updatedReactions[t] = (post.reactions?.[t] || []).filter((id) => id !== user._id)
      }
      if (!alreadyReactedWithType) {
        updatedReactions[type] = [...updatedReactions[type], user._id]
      }
      return { ...post, reactions: updatedReactions }
    }

    queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
      if (!old) return old
      return { ...old, pages: old.pages.map((page) => ({ ...page, posts: page.posts.map(patchPost) })) }
    })

    try {
      await api.patch(`/posts/${postId}/react`, { type })
    } catch {
      // Roll back every cache entry we touched — the optimistic update
      // didn't actually save.
      previousQueries.forEach(([key, value]) => queryClient.setQueryData(key, value))
      toast.error('Failed')
    }
  }

  // A new post, a poll vote, or a pin toggle all change data in ways
  // that are impractical to patch into the cache directly (poll vote
  // counts across every option, pin status affecting sort order) — an
  // invalidation + refetch is the correct, honest choice here, same
  // semantic as the pre-migration fetchPosts(1, true) call these replace.
  const invalidatePosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] })

  const filterTabs = [
    { id: 'all', label: '🌐 All' },
    { id: 'college', label: '🏛️ My College' },
    { id: 'announcements', label: '📢 Announcements' },
    { id: 'polls', label: '📊 Polls' },
  ]

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campus Feed</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">What's happening on campus</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all
                ${filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Create post */}
        <CreatePost onCreated={invalidatePosts} />

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <p className="text-4xl mb-3">📭</p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Nothing here yet</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to post something!</p>
          </div>
        ) : (
          <>
            {posts.map((post, i) => (
              <div key={post._id} ref={i === posts.length - 1 ? lastPostRef : null}>
                <PostCard
                  post={post}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  onRefresh={invalidatePosts}
                />
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader size={20} className="animate-spin text-indigo-500" />
              </div>
            )}
            {!hasNextPage && posts.length > 0 && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
                You've seen everything! 🎉
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}