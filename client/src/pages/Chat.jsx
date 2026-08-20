import { useState, useEffect, useRef} from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useSocketStore from '../store/socketStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import CallButton from '../components/CallButton'
import {
  Send, Search, ArrowLeft,
  Image, Smile, Reply,
  Trash2, CheckCheck,
  MessageCircle, Plus, X, Loader, MoreVertical, UserX } from 'lucide-react'

// ─── TIME HELPER ──────────────────────────────────────────────────
const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(date).toLocaleDateString()
}

const formatTime = (date) => new Date(date).toLocaleTimeString([], {
  hour: '2-digit', minute: '2-digit'
})

// ─── CONVERSATION LIST ITEM ───────────────────────────────────────
function ConversationItem({ conv, isActive, currentUserId, onlineUsers, onClick }) {
  const other = conv.participants?.find(p => p._id !== currentUserId)
  const isOnline = onlineUsers.includes(other?._id)
  const unread = conv.unreadCount?.[currentUserId] || 0

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
        ${isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-800">
          {other?.avatar
            ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {other?.name?.charAt(0)}
              </div>
          }
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {other?.name}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
            {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 truncate">
            {conv.lastMessage?.content || 'Start a conversation'}
          </p>
          {unread > 0 && (
            <span className="ml-1 bg-indigo-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubble({ msg, isOwn, onDelete, onReply, onReact, showAvatar }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const reactionEmojis = ['❤️', '😂', '😮', '😢', '👍', '🔥']

  if (msg.deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <p className="text-xs text-gray-400 dark:text-gray-600 italic px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
          🚫 Message deleted
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 mb-1 group`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
          {msg.sender?.avatar
            ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                {msg.sender?.name?.charAt(0)}
              </div>
          }
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender name */}
        {!isOwn && showAvatar && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">
            {msg.sender?.name}
          </p>
        )}

        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 max-w-full
            ${isOwn
              ? 'bg-indigo-400/30 text-indigo-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
            <p className="font-semibold text-[10px] mb-0.5">
              {msg.replyTo?.sender?.name || 'Reply'}
            </p>
            <p className="truncate">{msg.replyTo?.content}</p>
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            onDoubleClick={() => setShowReactions(!showReactions)}
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
              ${isOwn
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}
            style={isOwn ? { boxShadow: '0 2px 8px rgba(99,102,241,0.3)' } : {}}
          >
            {/* Image */}
            {msg.image && (
              <img src={msg.image} alt="" className="rounded-xl mb-2 max-w-[200px]" />
            )}

            {msg.content}
          </div>

          {/* Reactions display */}
          {msg.reactions?.length > 0 && (
            <div className={`absolute -bottom-3 ${isOwn ? 'right-0' : 'left-0'} flex gap-0.5`}>
              {[...new Set(msg.reactions.map(r => r.emoji))].slice(0, 3).map((emoji, i) => (
                <span key={i} className="text-sm bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 w-5 h-5 flex items-center justify-center text-xs shadow-sm">
                  {emoji}
                </span>
              ))}
            </div>
          )}

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-10 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 px-2 py-1.5 flex gap-1 z-10`}
              >
                {reactionEmojis.map(emoji => (
                  <button key={emoji}
                    onClick={() => { onReact(msg._id, emoji); setShowReactions(false) }}
                    className="hover:scale-125 transition-transform text-lg">
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Meta + actions */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-600">
            {formatTime(msg.createdAt)}
          </span>
          {isOwn && (
            <CheckCheck size={12} className={msg.readBy?.length > 1 ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600'} />
          )}

          {/* Action buttons — show on hover */}
          <div className={`hidden group-hover:flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => onReply(msg)}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Reply size={11} />
            </button>
            <button onClick={() => setShowReactions(!showReactions)}
              className="p-1 text-gray-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Smile size={11} />
            </button>
            {isOwn && (
              <button onClick={() => onDelete(msg._id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── MAIN CHAT PAGE ───────────────────────────────────────────────
export default function Chat() {
  useSection('dashboard')
  const { conversationId } = useParams()
  const { user } = useAuthStore()
  const { socket, onlineUsers } = useSocketStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [typing, setTyping] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // NEW: block/unblock UI state for the active conversation partner
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [blocking, setBlocking] = useState(false)

  const messagesEndRef = useRef()
  const typingTimeoutRef = useRef()
  const inputRef = useRef()
  const fileRef = useRef()

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto'
    })
  }

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations')
      setConversations(data.conversations)
    } catch {}
  }

  useEffect(() => { fetchConversations() }, [])

  // Open conversation
  const openConversation = async (conv) => {
    setActiveConv(conv)
    setMessages([])
    setPage(1)
    setLoadingMsgs(true)

    // Socket room
    if (socket) {
      if (activeConv) socket.emit('leave_conversation', activeConv._id)
      socket.emit('join_conversation', conv._id)
      socket.emit('message_read', { conversationId: conv._id })
    }

    navigate(`/chat/${conv._id}`, { replace: true })

    try {
      const { data } = await api.get(`/chat/messages/${conv._id}?page=1&limit=30`)
      setMessages(data.messages)
      setHasMore(data.pagination.hasMore)
      setTimeout(() => scrollToBottom(false), 100)
    } catch {
      // message load failed — leave the conversation open with what we have
    }
    finally { setLoadingMsgs(false) }
  }

  // Load conversation from URL param
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c._id === conversationId)
      if (conv) openConversation(conv)
    }
  }, [conversationId, conversations])

  // Load more messages
  const loadMoreMessages = async () => {
    if (!activeConv || !hasMore || loadingMsgs) return
    const nextPage = page + 1
    try {
      const { data } = await api.get(`/chat/messages/${activeConv._id}?page=${nextPage}&limit=30`)
      setMessages(prev => [...data.messages, ...prev])
      setHasMore(data.pagination.hasMore)
      setPage(nextPage)
    } catch {}
  }

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg])
      scrollToBottom()
      if (activeConv && msg.conversation === activeConv._id) {
        socket.emit('message_read', { conversationId: activeConv._id })
      }
    }

    const handleTyping = ({ userId, userName, conversationId: convId }) => {
      if (activeConv?._id === convId && userId !== user?.id) {
        setTyping(userName)
      }
    }

    const handleStopTyping = ({ conversationId: convId }) => {
      if (activeConv?._id === convId) setTyping(null)
    }

    const handleReacted = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, reactions } : m
      ))
    }

    socket.on('message_received', handleMessage)
    socket.on('user_typing', handleTyping)
    socket.on('user_stop_typing', handleStopTyping)
    socket.on('message_reacted', handleReacted)

    return () => {
      socket.off('message_received', handleMessage)
      socket.off('user_typing', handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
      socket.off('message_reacted', handleReacted)
    }
  }, [socket, activeConv, user])

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !activeConv) return

    const tempMsg = {
      _id: Date.now().toString(),
      conversation: activeConv._id,
      sender: { _id: user?.id, name: user?.name, avatar: user?.avatar },
      content: input,
      type: 'text',
      readBy: [user?.id],
      createdAt: new Date().toISOString(),
      replyTo: replyTo || null,
      reactions: [] }

    setMessages(prev => [...prev, tempMsg])
    setInput('')
    setReplyTo(null)
    scrollToBottom()

    // Stop typing
    clearTimeout(typingTimeoutRef.current)
    if (socket) {
      socket.emit('typing_stop', { conversationId: activeConv._id })
      socket.emit('send_message', {
        conversationId: activeConv._id,
        content: tempMsg.content,
        replyTo: replyTo?._id })
    }

    fetchConversations()
  }

  // Typing indicator
  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!socket || !activeConv) return

    socket.emit('typing_start', { conversationId: activeConv._id })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: activeConv._id })
    }, 2000)
  }

  // Delete message
  const handleDelete = async (messageId) => {
    try {
      await api.delete(`/chat/messages/${messageId}`)
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, deleted: true } : m
      ))
    } catch { toast.error('Failed to delete') }
  }

  // React to message
  const handleReact = (messageId, emoji) => {
    if (!socket || !activeConv) return
    socket.emit('react_message', {
      messageId,
      emoji,
      conversationId: activeConv._id })
  }

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get(`/chat/search?q=${searchQuery}`)
        setSearchResults(data.users)
      } catch {}
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Start new chat
  const startChat = async (userId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${userId}`)
      setSearchQuery('')
      setSearchResults([])
      await fetchConversations()
      openConversation(data.conversation)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start chat') }
  }

  // NEW: support being deep-linked here as /chat?user=<id> (e.g. the
  // "Message" button on a UserProfile page) — open/create that conversation
  // once, then clear the param so it doesn't re-trigger on re-renders.
  useEffect(() => {
    const targetUserId = searchParams.get('user')
    if (targetUserId) {
      startChat(targetUserId)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const activeOther = activeConv?.participants?.find(p => p._id !== user?.id)
  const isOtherOnline = onlineUsers.includes(activeOther?._id)

  // NEW: block the person currently open in this chat. Blocking is
  // enforced server-side (chatController + the socket send_message handler),
  // this just gives the UI a way to trigger it.
  const handleBlockUser = async () => {
    if (!activeOther) return
    setBlocking(true)
    try {
      await api.post(`/privacy/block/${activeOther._id}`)
      toast.success(`Blocked ${activeOther.name}.`)
      setShowChatMenu(false)
      setActiveConv(null)
      navigate('/chat')
      fetchConversations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block user')
    } finally {
      setBlocking(false)
    }
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-7rem)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">

        {/* ── LEFT PANEL ── */}
        <div className={`w-full md:w-80 flex flex-col border-r border-gray-100 dark:border-gray-800 shrink-0
          ${activeConv ? 'hidden md:flex' : 'flex'}`}>

          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Messages</h2>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searching && <Loader size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
            </div>

            {/* Search results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 mt-1 overflow-hidden"
                >
                  {searchResults.map(u => (
                    <button key={u._id}
                      onClick={() => startChat(u._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                        {u.avatar
                          ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0)}</div>
                        }
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.branch} · Y{u.year}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No messages yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-600">Search for students to start chatting</p>
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv._id}
                  conv={conv}
                  isActive={activeConv?._id === conv._id}
                  currentUserId={user?.id}
                  onlineUsers={onlineUsers}
                  onClick={() => openConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={36} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Your Messages</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-6">
                Send private messages to your classmates, share notes, discuss placements
              </p>
              <button
                onClick={() => inputRef.current?.focus()}
                className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
                style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
              >
                <Plus size={16} /> New Message
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button
                  onClick={() => { setActiveConv(null); navigate('/chat') }}
                  className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-800">
                    {activeOther?.avatar
                      ? <img src={activeOther.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{activeOther?.name?.charAt(0)}</div>
                    }
                  </div>
                  {isOtherOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/users/${activeOther?._id}`}
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                  >
                    {activeOther?.name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {typing
                      ? <span className="text-indigo-500 font-medium">typing...</span>
                      : isOtherOnline ? '🟢 Online' : `${activeOther?.branch} · Y${activeOther?.year}`
                    }
                  </p>
                </div>

                {/* NEW: chat menu (block user) */}
                <div className="relative">
                  <button
                    onClick={() => setShowChatMenu(s => !s)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showChatMenu && (
                    <div className="absolute right-0 top-9 z-10 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg py-1">
                      <button
                        onClick={handleBlockUser}
                        disabled={blocking}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <UserX size={13} /> {blocking ? 'Blocking...' : `Block ${activeOther?.name || 'user'}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {activeOther && (
                <CallButton
                targetUserId={activeOther._id}
                targetName={activeOther.name}
                targetAvatar={activeOther.avatar}
                type="one-on-one"
              />  
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 dark:bg-gray-950/50">
                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={loadMoreMessages}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Load earlier messages
                    </button>
                  </div>
                )}

                {loadingMsgs ? (
                  <div className="flex justify-center py-8">
                    <Loader size={20} className="animate-spin text-indigo-400" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isOwn = msg.sender?._id === user?.id
                      const prevMsg = messages[i - 1]
                      const showAvatar = !prevMsg || prevMsg.sender?._id !== msg.sender?._id

                      return (
                        <MessageBubble
                          key={msg._id}
                          msg={msg}
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                          onDelete={handleDelete}
                          onReply={setReplyTo}
                          onReact={handleReact}
                        />
                      )
                    })}

                    {/* Typing indicator */}
                    <AnimatePresence>
                      {typing && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex items-center gap-2 mb-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1">
                            {[0, 150, 300].map(delay => (
                              <div key={delay}
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply preview */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-900 flex items-center gap-3"
                  >
                    <Reply size={14} className="text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Replying to {replyTo.sender?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input area */}
              <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileRef.current.click()}
                    className="p-2.5 text-gray-400 hover:text-indigo-500 transition-colors rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shrink-0"
                  >
                    <Image size={18} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" />

                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      style={{ maxHeight: '120px' }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                  >
                    <Send size={16} />
                  </motion.button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-1.5">
                  Enter to send · Shift+Enter for new line · Double-tap message to react
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}