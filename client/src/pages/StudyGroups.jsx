import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useSocketStore from '../store/socketStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  Users, Plus, Search,
  MessageCircle, Calendar,
  Send, X, ChevronRight, Lock,
  Crown, LogOut, Settings,
  ExternalLink, Loader,
  Reply, ArrowLeft } from 'lucide-react'

const coverColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6',
]

// ─── CREATE GROUP MODAL ───────────────────────────────────────────
function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', description: '', subject: '',
    branch: '', year: '', tags: '',
    maxMembers: 50, isPrivate: false,
    coverColor: '#6366f1', meetingLink: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('tags', JSON.stringify(
        form.tags.split(',').map(t => t.trim()).filter(Boolean)
      ))
      await api.post('/study-groups', fd)
      toast.success('Study group created!')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create Study Group</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cover color */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Group Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {coverColors.map(color => (
                  <button
                    key={color} type="button"
                    onClick={() => setForm(f => ({ ...f, coverColor: color }))}
                    className={`w-8 h-8 rounded-full transition-all ${form.coverColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="h-16 rounded-xl flex items-center px-4 gap-3 transition-all"
              style={{ background: `linear-gradient(135deg, ${form.coverColor}33, ${form.coverColor}11)`, border: `1px solid ${form.coverColor}33` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: form.coverColor }}>
                {form.name?.charAt(0) || 'G'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{form.name || 'Group Name'}</p>
                <p className="text-xs text-gray-500">{form.subject || 'Subject'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Group Name *</label>
                <input value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. OS Study Group"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject *</label>
                <input value={form.subject} required
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <textarea value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What will this group study?"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Branch</label>
                <input value={form.branch}
                  onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                  placeholder="CSE"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Year</label>
                <select value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Any</option>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Y{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Members</label>
                <input type="number" value={form.maxMembers} min={2} max={200}
                  onChange={e => setForm(f => ({ ...f, maxMembers: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags (comma separated)</label>
              <input value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="exam-prep, unit-4, important"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Meeting Link (optional)</label>
              <input value={form.meetingLink}
                onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPrivate}
                onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
                className="rounded accent-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Private group (invite/request only)</span>
            </label>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── GROUP CHAT ───────────────────────────────────────────────────
function GroupChat({ group, onBack }) {
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null)
  const [typing, setTyping] = useState([])
  const messagesEndRef = useRef()
  const typingTimeoutRef = useRef()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/study-groups/${group._id}/messages`)
        setMessages(data.messages)
        setTimeout(() => scrollToBottom(), 100)
      } catch {}
      finally { setLoading(false) }
    }
    fetchMessages()

    if (socket) {
      socket.emit('join_conversation', group.conversation)
    }

    return () => {
      if (socket) socket.emit('leave_conversation', group.conversation)
    }
  }, [group._id])

  useEffect(() => {
    if (!socket) return

    const handleMsg = (msg) => {
      setMessages(prev => [...prev, msg])
      scrollToBottom()
    }

    const handleTyping = ({ userId, userName }) => {
      if (userId !== user?.id) {
        setTyping(prev => [...new Set([...prev, userName])])
      }
    }

    const handleStopTyping = ({ userId }) => {
      setTyping(prev => prev.filter(n => n !== userId))
    }

    socket.on('message_received', handleMsg)
    socket.on('user_typing', handleTyping)
    socket.on('user_stop_typing', handleStopTyping)

    return () => {
      socket.off('message_received', handleMsg)
      socket.off('user_typing', handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
    }
  }, [socket, user])

  const handleSend = () => {
    if (!input.trim() || !socket) return

    socket.emit('send_group_message', {
      groupId: group._id,
      conversationId: group.conversation,
      content: input,
      replyTo: replyTo?._id })

    setInput('')
    setReplyTo(null)
    clearTimeout(typingTimeoutRef.current)
    socket.emit('typing_stop', { conversationId: group.conversation })
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!socket) return
    socket.emit('typing_start', { conversationId: group.conversation })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: group.conversation })
    }, 2000)
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
          style={{ background: group.coverColor }}>
          {group.name?.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.name}</p>
          <p className="text-xs text-gray-400">{group.members?.length} members</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-950/50">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size={20} className="animate-spin text-indigo-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">👋</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender?._id === user?.id
            const isSystem = msg.type === 'system'
            const prevMsg = messages[i - 1]
            const showAvatar = !prevMsg || prevMsg.sender?._id !== msg.sender?._id

            if (isSystem) {
              return (
                <div key={msg._id} className="flex justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                    {msg.content}
                  </span>
                </div>
              )
            }

            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}
              >
                {!isOwn && (
                  <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                    {msg.sender?.avatar
                      ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: group.coverColor }}>{msg.sender?.name?.charAt(0)}</div>
                    }
                  </div>
                )}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {!isOwn && showAvatar && (
                    <p className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender?.name}</p>
                  )}

                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 max-w-full border-l-2 opacity-70
                      ${isOwn ? 'bg-white/20 text-white border-white/40' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500'}`}>
                      <p className="truncate">{msg.replyTo?.content}</p>
                    </div>
                  )}

                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isOwn
                      ? 'text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}
                    style={isOwn ? { background: group.coverColor } : {}}>
                    {msg.content}
                  </div>

                  <div className={`flex items-center gap-2 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">{formatTime(msg.createdAt)}</span>
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="hidden group-hover:block text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      <Reply size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}

        {/* Typing indicator */}
        {typing.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full opacity-50"
              style={{ background: group.coverColor }} />
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-2.5 flex gap-1">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 border-t border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 flex items-center gap-3">
            <Reply size={13} className="text-indigo-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{replyTo.content}</p>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message the group..."
          rows={1}
          className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2.5 text-white rounded-xl disabled:opacity-40 transition-all shrink-0"
          style={{ background: group.coverColor, boxShadow: `0 4px 12px ${group.coverColor}50` }}
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  )
}

// ─── GROUP DETAIL PANEL ───────────────────────────────────────────
function GroupDetail({ group, onRefresh, onOpenChat }) {
  const { user } = useAuthStore()
  const [addingResource, setAddingResource] = useState(false)
  const [resource, setResource] = useState({ title: '', url: '', type: 'link' })
  const [meetingForm, setMeetingForm] = useState({ meetingLink: group.meetingLink || '', nextMeeting: '' })
  const [showMeetingForm, setShowMeetingForm] = useState(false)

  const isMember = group.members?.some(m => m.user?._id === user?.id)
  const isAdmin = group.admin?._id === user?.id

  const handleJoin = async () => {
    try {
      const { data } = await api.post(`/study-groups/${group._id}/join`)
      toast.success(data.message)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return
    try {
      await api.post(`/study-groups/${group._id}/leave`)
      toast.success('Left group')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleAddResource = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/study-groups/${group._id}/resources`, resource)
      toast.success('Resource added!')
      setResource({ title: '', url: '', type: 'link' })
      setAddingResource(false)
      onRefresh()
    } catch { toast.error('Failed') }
  }

  const handleUpdateMeeting = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/study-groups/${group._id}/meeting`, meetingForm)
      toast.success('Meeting updated!')
      setShowMeetingForm(false)
      onRefresh()
    } catch { toast.error('Failed') }
  }

  const handleJoinRequest = async (userId, action) => {
    try {
      await api.patch(`/study-groups/${group._id}/request`, { userId, action })
      toast.success(`Request ${action}d!`)
      onRefresh()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Group header */}
      <div className="h-24 relative flex items-end p-4"
        style={{ background: `linear-gradient(135deg, ${group.coverColor}, ${group.coverColor}88)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 flex items-end gap-3 w-full">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg border border-white/30">
            {group.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base leading-tight truncate">{group.name}</p>
            <p className="text-white/70 text-xs">{group.subject}</p>
          </div>
          {group.isPrivate && <Lock size={14} className="text-white/60 shrink-0" />}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          {group.branch && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: `${group.coverColor}15`, color: group.coverColor }}>
              {group.branch}
            </span>
          )}
          {group.year && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: `${group.coverColor}15`, color: group.coverColor }}>
              Year {group.year}
            </span>
          )}
          {group.tags?.map(tag => (
            <span key={tag} className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {group.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{group.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Members', value: `${group.members?.length}/${group.maxMembers}` },
            { label: 'Messages', value: group.messageCount || 0 },
            { label: 'Resources', value: group.resources?.length || 0 },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl"
              style={{ background: `${group.coverColor}10` }}>
              <p className="text-lg font-bold" style={{ color: group.coverColor }}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {isMember ? (
            <>
              <button onClick={onOpenChat}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all"
                style={{ background: group.coverColor, boxShadow: `0 4px 12px ${group.coverColor}40` }}>
                <MessageCircle size={15} /> Open Chat
              </button>
              {!isAdmin && (
                <button onClick={handleLeave}
                  className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 hover:border-red-200 transition-all">
                  <LogOut size={15} />
                </button>
              )}
            </>
          ) : (
            <button onClick={handleJoin}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all"
              style={{ background: group.coverColor, boxShadow: `0 4px 12px ${group.coverColor}40` }}>
              {group.isPrivate ? <><Lock size={15} /> Request to Join</> : <><Plus size={15} /> Join Group</>}
            </button>
          )}

          {group.meetingLink && (
            <a href={group.meetingLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <ExternalLink size={15} /> Meet
            </a>
          )}
        </div>

        {/* Next meeting */}
        {group.nextMeeting && (
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: `${group.coverColor}10`, border: `1px solid ${group.coverColor}20` }}>
            <Calendar size={16} style={{ color: group.coverColor }} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Next Meeting</p>
              <p className="text-xs text-gray-500">{new Date(group.nextMeeting).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Admin: Update meeting */}
        {isAdmin && (
          <div>
            <button onClick={() => setShowMeetingForm(!showMeetingForm)}
              className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1">
              <Settings size={12} /> {showMeetingForm ? 'Cancel' : 'Update Meeting'}
            </button>
            {showMeetingForm && (
              <form onSubmit={handleUpdateMeeting} className="mt-2 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <input value={meetingForm.meetingLink}
                  onChange={e => setMeetingForm(f => ({ ...f, meetingLink: e.target.value }))}
                  placeholder="Meeting link"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input type="datetime-local" value={meetingForm.nextMeeting}
                  onChange={e => setMeetingForm(f => ({ ...f, nextMeeting: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit"
                  className="w-full py-1.5 text-xs font-medium text-white rounded-lg"
                  style={{ background: group.coverColor }}>
                  Update
                </button>
              </form>
            )}
          </div>
        )}

        {/* Members */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Members ({group.members?.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {group.members?.map(({ user: member, role }) => (
              <div key={member?._id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                  {member?.avatar
                    ? <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: group.coverColor }}>{member?.name?.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{member?.name}</p>
                  <p className="text-[10px] text-gray-400">{member?.branch} · Y{member?.year}</p>
                </div>
                {role === 'admin' && <Crown size={12} style={{ color: group.coverColor }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Join requests (admin only) */}
        {isAdmin && group.joinRequests?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Join Requests ({group.joinRequests.length})
            </p>
            <div className="space-y-2">
              {group.joinRequests.map(req => (
                <div key={req._id} className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="w-7 h-7 rounded-full overflow-hidden">
                    {req.avatar
                      ? <img src={req.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">{req.name?.charAt(0)}</div>
                    }
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">{req.name}</p>
                  <button onClick={() => handleJoinRequest(req._id, 'approve')}
                    className="text-xs text-green-600 font-medium hover:underline">✓</button>
                  <button onClick={() => handleJoinRequest(req._id, 'reject')}
                    className="text-xs text-red-500 font-medium hover:underline">✗</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resources
            </p>
            {isMember && (
              <button onClick={() => setAddingResource(!addingResource)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: group.coverColor }}>
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {addingResource && (
            <form onSubmit={handleAddResource} className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
              <input value={resource.title} required
                onChange={e => setResource(r => ({ ...r, title: e.target.value }))}
                placeholder="Resource title"
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input value={resource.url} required
                onChange={e => setResource(r => ({ ...r, url: e.target.value }))}
                placeholder="URL / Link"
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <select value={resource.type}
                  onChange={e => setResource(r => ({ ...r, type: e.target.value }))}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none">
                  <option value="link">🔗 Link</option>
                  <option value="note">📝 Note</option>
                  <option value="file">📁 File</option>
                </select>
                <button type="submit"
                  className="px-4 py-2 text-xs font-medium text-white rounded-lg"
                  style={{ background: group.coverColor }}>
                  Add
                </button>
              </div>
            </form>
          )}

          {group.resources?.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-3">No resources yet</p>
          ) : (
            <div className="space-y-2">
              {group.resources?.map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                  <span className="text-base">
                    {res.type === 'link' ? '🔗' : res.type === 'note' ? '📝' : '📁'}
                  </span>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {res.title}
                  </p>
                  <ExternalLink size={11} className="text-gray-400 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── GROUP CARD ───────────────────────────────────────────────────
function GroupCard({ group, currentUserId, onClick }) {
  const isMember = group.members?.some(m => m.user?._id === currentUserId)
  const memberCount = group.members?.length || 0
  const percent = Math.round((memberCount / group.maxMembers) * 100)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      {/* Cover */}
      <div className="h-16 relative"
        style={{ background: `linear-gradient(135deg, ${group.coverColor}, ${group.coverColor}88)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {group.isPrivate && <Lock size={12} className="text-white/70" />}
          {isMember && (
            <span className="text-[9px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
              Joined
            </span>
          )}
        </div>
        <div className="absolute -bottom-4 left-4 w-10 h-10 rounded-xl border-2 border-white dark:border-gray-900 flex items-center justify-center text-white font-bold text-sm shadow-md"
          style={{ background: group.coverColor }}>
          {group.name?.charAt(0)}
        </div>
      </div>

      <div className="pt-6 px-4 pb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate mb-0.5">{group.name}</h3>
        <p className="text-xs font-medium mb-1" style={{ color: group.coverColor }}>{group.subject}</p>
        {group.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{group.description}</p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {group.branch && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${group.coverColor}15`, color: group.coverColor }}>
              {group.branch}
            </span>
          )}
          {group.year && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${group.coverColor}15`, color: group.coverColor }}>
              Y{group.year}
            </span>
          )}
        </div>

        {/* Member bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{memberCount} members</span>
            <span>{group.maxMembers} max</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, background: group.coverColor }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {group.members?.slice(0, 4).map((m, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-white dark:border-gray-900 overflow-hidden">
                {m.user?.avatar
                  ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: group.coverColor }}>{m.user?.name?.charAt(0)}</div>
                }
              </div>
            ))}
          </div>
          <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function StudyGroups() {
  useSection('notes')
  const { user } = useAuthStore()
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('discover')

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const [all, mine] = await Promise.all([
        api.get(`/study-groups?search=${search}`),
        api.get('/study-groups/my-groups'),
      ])
      setGroups(all.data.groups)
      setMyGroups(mine.data.groups)
    } catch { toast.error('Failed to load groups') }
    finally { setLoading(false) }
  }

  const fetchSelectedGroup = async () => {
    if (!selectedGroup) return
    try {
      const { data } = await api.get(`/study-groups/${selectedGroup._id}`)
      setSelectedGroup(data.group)
    } catch {}
  }

  useEffect(() => { fetchGroups() }, [search])

  const displayGroups = tab === 'my-groups' ? myGroups : groups

  return (
    <Layout>
      <AnimatePresence>
        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreated={fetchGroups}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Left — Group list */}
        <div className={`flex flex-col ${selectedGroup ? 'hidden lg:flex lg:w-96' : 'w-full lg:w-96'} shrink-0`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Study Groups</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Learn together, grow together</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
            >
              <Plus size={15} /> Create
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups by subject..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'discover', label: '🔍 Discover' },
              { id: 'my-groups', label: `👤 Mine (${myGroups.length})` },
            ].map(t => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl transition-all
                  ${tab === t.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Groups grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-44 animate-pulse" />
                ))}
              </div>
            ) : displayGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Users size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {tab === 'my-groups' ? "You haven't joined any groups" : "No groups found"}
                </p>
                <button onClick={() => setShowCreate(true)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-1">
                  Create one!
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 pb-4">
                {displayGroups.map(group => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    currentUserId={user?.id}
                    onClick={() => { setSelectedGroup(group); setShowChat(false) }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Detail / Chat panel */}
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
          >
            {/* Back button (mobile) */}
            <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <button onClick={() => setSelectedGroup(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <ArrowLeft size={18} />
              </button>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedGroup.name}</p>
            </div>

            {showChat ? (
              <GroupChat
                group={selectedGroup}
                onBack={() => setShowChat(false)}
              />
            ) : (
              <GroupDetail
                group={selectedGroup}
                onRefresh={fetchSelectedGroup}
                onOpenChat={() => setShowChat(true)}
              />
            )}
          </motion.div>
        )}

        {/* Empty state (desktop) */}
        {!selectedGroup && (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Select a Group</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Pick a study group to see details, members, resources and group chat
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}