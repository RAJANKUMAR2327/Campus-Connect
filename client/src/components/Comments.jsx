import { useState, useEffect } from 'react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Heart, Trash2, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Comments({ targetId, targetType }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/comments/${targetType}/${targetId}`)
      setComments(data.comments)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (open) fetchComments()
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const { data } = await api.post(`/comments/${targetType}/${targetId}`, { content: text })
      setComments(prev => [data.comment, ...prev])
      setText('')
      toast.success('Comment added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId) => {
    try {
      await api.patch(`/comments/like/${commentId}`)
      fetchComments()
    } catch {}
  }

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`)
      setComments(prev => prev.filter(c => c._id !== commentId))
      toast.success('Deleted!')
    } catch {}
  }

  return (
    <div className="mt-3 border-t border-gray-50 dark:border-gray-800 pt-3">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <MessageCircle size={13} />
        {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : 'Comment'}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Add comment */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user?.name?.charAt(0)
              }
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send size={13} />
              </button>
            </div>
          </form>

          {/* Comments list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => (
                <div key={i} className="animate-pulse flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-3">
              No comments yet — be the first!
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment._id} className="flex gap-2 group">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden">
                    {comment.author?.avatar
                      ? <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                      : comment.author?.name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {comment.author?.name}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">
                          {comment.author?.branch}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 ml-auto">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <button
                        onClick={() => handleLike(comment._id)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Heart size={11} /> {comment.likes?.length || 0}
                      </button>
                      {comment.author?._id === user?.id && (
                        <button
                          onClick={() => handleDelete(comment._id)}
                          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}