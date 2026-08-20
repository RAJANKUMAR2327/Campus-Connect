import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useSocketStore from '../store/socketStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  Award, Plus, Search, Crown, Users,
  AtSign, Link2, Globe, MessageCircle,
  X, ArrowLeft, Send,
  ExternalLink, Star, Trophy,
  Loader, UserPlus, LogOut,
  Sparkles, Cpu, Palette, Music, Trophy as TrophyIcon,
  Heart, Briefcase as BriefcaseIcon } from 'lucide-react'

const categoryConfig = {
  technical: { icon: Cpu, label: 'Technical', color: '#6366f1' },
  cultural: { icon: Music, label: 'Cultural', color: '#ec4899' },
  sports: { icon: TrophyIcon, label: 'Sports', color: '#f59e0b' },
  literary: { icon: Sparkles, label: 'Literary', color: '#8b5cf6' },
  social: { icon: Heart, label: 'Social Service', color: '#10b981' },
  entrepreneurship: { icon: BriefcaseIcon, label: 'Entrepreneurship', color: '#3b82f6' },
  arts: { icon: Palette, label: 'Arts', color: '#f43f5e' },
  other: { icon: Star, label: 'Other', color: '#6b7280' } }

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6']

// ─── CREATE CLUB MODAL ────────────────────────────────────────────
function CreateClubModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', category: 'technical',
    founded: new Date().getFullYear(), coverColor: '#6366f1',
    instagram: '', linkedin: '', website: '',
    isRecruiting: false, recruitmentForm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (!['instagram', 'linkedin', 'website'].includes(k)) fd.append(k, v)
      })
      fd.append('socialLinks', JSON.stringify({
        instagram: form.instagram, linkedin: form.linkedin, website: form.website }))
      await api.post('/clubs', fd)
      toast.success('Club created!')
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create a Club</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Club Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(c => (
                  <button key={c} type="button"
                    onClick={() => setForm(f => ({ ...f, coverColor: c }))}
                    className={`w-8 h-8 rounded-full transition-all ${form.coverColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="h-20 rounded-xl relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${form.coverColor}, ${form.coverColor}88)` }}>
              <div className="absolute bottom-2 left-3 flex items-end gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold border border-white/30">
                  {form.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{form.name || 'Club Name'}</p>
                  <p className="text-xs text-white/70">{form.tagline || 'Your tagline here'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Club Name *</label>
                <input value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Robotics Club"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {Object.entries(categoryConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tagline</label>
              <input value={form.tagline}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Building the future, one robot at a time"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <textarea value={form.description} rows={3}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What does your club do? What activities do you organize?"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Founded Year</label>
              <input type="number" value={form.founded}
                onChange={e => setForm(f => ({ ...f, founded: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Social links */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Instagram</label>
                <input value={form.instagram}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                  placeholder="@handle"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">LinkedIn</label>
                <input value={form.linkedin}
                  onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                  placeholder="URL"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Website</label>
                <input value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="URL"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRecruiting}
                onChange={e => setForm(f => ({ ...f, isRecruiting: e.target.checked }))}
                className="rounded accent-indigo-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Currently recruiting members</span>
            </label>

            {form.isRecruiting && (
              <input value={form.recruitmentForm}
                onChange={e => setForm(f => ({ ...f, recruitmentForm: e.target.value }))}
                placeholder="Recruitment form link (Google Form, etc.)"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
                {loading ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── CLUB CARD ────────────────────────────────────────────────────
function ClubCard({ club, currentUserId, onClick }) {
  const isMember = club.members?.some(m => m.user?._id === currentUserId)
  const config = categoryConfig[club.category] || categoryConfig.other
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
    >
      <div className="h-24 relative"
        style={{ background: `linear-gradient(135deg, ${club.coverColor}, ${club.coverColor}88)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {club.isVerified && (
            <span className="text-[9px] font-semibold bg-white/25 text-white px-2 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
              <Star size={9} /> Verified
            </span>
          )}
          {club.isRecruiting && (
            <span className="text-[9px] font-semibold bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
              Recruiting
            </span>
          )}
        </div>
        <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl border-2 border-white dark:border-gray-900 flex items-center justify-center text-white font-bold shadow-md transition-transform duration-300 group-hover:scale-110"
          style={{ background: club.coverColor }}>
          <Icon size={20} />
        </div>
      </div>

      <div className="pt-8 px-4 pb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">{club.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{club.tagline}</p>

        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full inline-block mb-3"
          style={{ background: `${config.color}15`, color: config.color }}>
          {config.label}
        </span>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{club.members?.length || 0} members</span>
          </div>
          {isMember && (
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">✓ Joined</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── CLUB CHAT ────────────────────────────────────────────────────
function ClubChat({ club, onBack }) {
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const endRef = useRef()

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/clubs/${club._id}/messages`)
        setMessages(data.messages)
        setTimeout(() => endRef.current?.scrollIntoView(), 100)
      } catch {} finally { setLoading(false) }
    }
    fetch()
    if (socket) socket.emit('join_conversation', club.conversation)
    return () => { if (socket) socket.emit('leave_conversation', club.conversation) }
  }, [club._id])

  useEffect(() => {
    if (!socket) return
    const handle = (msg) => { setMessages(prev => [...prev, msg]); endRef.current?.scrollIntoView({ behavior: 'smooth' }) }
    socket.on('message_received', handle)
    return () => socket.off('message_received', handle)
  }, [socket])

  const handleSend = () => {
    if (!input.trim() || !socket) return
    socket.emit('send_club_message', { clubId: club._id, conversationId: club.conversation, content: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ArrowLeft size={16} /></button>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: club.coverColor }}>
          {club.name?.charAt(0)}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{club.name} Chat</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-950/50">
        {loading ? <div className="flex justify-center py-8"><Loader size={20} className="animate-spin text-indigo-400" /></div>
        : messages.map((msg, i) => {
          const isOwn = msg.sender?._id === user?.id
          const isSystem = msg.type === 'system'
          if (isSystem) return (
            <div key={msg._id} className="flex justify-center">
              <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">{msg.content}</span>
            </div>
          )
          return (
            <div key={msg._id} className={`flex ${isOwn ? 'flex-row-reverse' : ''} items-end gap-2`}>
              {!isOwn && <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                {msg.sender?.avatar ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: club.coverColor }}>{msg.sender?.name?.charAt(0)}</div>}
              </div>}
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}
                style={isOwn ? { background: club.coverColor } : {}}>
                {!isOwn && <p className="text-[10px] opacity-70 mb-0.5">{msg.sender?.name}</p>}
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="Message club members..."
          className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={handleSend} disabled={!input.trim()}
          className="p-2.5 text-white rounded-xl disabled:opacity-40 shrink-0"
          style={{ background: club.coverColor }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── CLUB DETAIL ──────────────────────────────────────────────────
function ClubDetail({ club, events, onRefresh, onOpenChat }) {
  const { user } = useAuthStore()
  const config = categoryConfig[club.category] || categoryConfig.other
  const Icon = config.icon
  const isMember = club.members?.some(m => m.user?._id === user?.id)
  const isPresident = club.president?._id === user?.id

  const handleJoin = async () => {
    try {
      await api.post(`/clubs/${club._id}/join`)
      toast.success('Joined the club!')
      onRefresh()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this club?')) return
    try {
      await api.post(`/clubs/${club._id}/leave`)
      toast.success('Left the club')
      onRefresh()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="h-28 relative flex items-end p-4"
        style={{ background: `linear-gradient(135deg, ${club.coverColor}, ${club.coverColor}88)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 flex items-end gap-3 w-full">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/30">
            <Icon size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-base leading-tight truncate">{club.name}</p>
              {club.isVerified && <Star size={14} className="text-white fill-white" />}
            </div>
            <p className="text-white/70 text-xs">{club.tagline}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${config.color}15`, color: config.color }}>
            {config.label}
          </span>
          {club.founded && (
            <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              Est. {club.founded}
            </span>
          )}
        </div>

        {club.description && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{club.description}</p>}

        {/* Recruiting banner */}
        {club.isRecruiting && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
            <UserPlus size={18} className="text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300">We're recruiting!</p>
              {club.recruitmentDeadline && (
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  Deadline: {new Date(club.recruitmentDeadline).toLocaleDateString()}
                </p>
              )}
            </div>
            {club.recruitmentForm && (
              <a href={club.recruitmentForm} target="_blank" rel="noreferrer"
                className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                Apply
              </a>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Members', value: club.members?.length || 0 },
            { label: 'Core Team', value: club.coreTeam?.length || 0 },
            { label: 'Achievements', value: club.achievements?.length || 0 },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${club.coverColor}10` }}>
              <p className="text-lg font-bold" style={{ color: club.coverColor }}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isMember ? (
            <>
              <button onClick={onOpenChat}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all"
                style={{ background: club.coverColor, boxShadow: `0 4px 12px ${club.coverColor}40` }}>
                <MessageCircle size={15} /> Club Chat
              </button>
              {!isPresident && (
                <button onClick={handleLeave}
                  className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all">
                  <LogOut size={15} />
                </button>
              )}
            </>
          ) : (
            <button onClick={handleJoin}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all"
              style={{ background: club.coverColor, boxShadow: `0 4px 12px ${club.coverColor}40` }}>
              <Plus size={15} /> Join Club
            </button>
          )}
        </div>

        {/* Social links */}
        {(club.socialLinks?.instagram || club.socialLinks?.linkedin || club.socialLinks?.website) && (
          <div className="flex gap-2">
            {club.socialLinks.instagram && (
              <a href={`https://instagram.com/${club.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <AtSign size={13} /> Instagram
              </a>
            )}
            {club.socialLinks.linkedin && (
              <a href={club.socialLinks.linkedin} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Link2 size={13} /> LinkedIn
              </a>
            )}
            {club.socialLinks.website && (
              <a href={club.socialLinks.website} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Globe size={13} /> Website
              </a>
            )}
          </div>
        )}

        {/* Core team */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Core Team</p>
          <div className="space-y-2">
            {club.coreTeam?.map(({ user: member, position }) => (
              <div key={member?._id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  {member?.avatar
                    ? <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: club.coverColor }}>{member?.name?.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{member?.name}</p>
                  <p className="text-[10px]" style={{ color: club.coverColor }}>{position}</p>
                </div>
                {position === 'President' && <Crown size={12} style={{ color: club.coverColor }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        {events?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Upcoming Events</p>
            <div className="space-y-2">
              {events.map(event => (
                <div key={event._id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: `${club.coverColor}15` }}>
                    <span className="text-xs font-bold" style={{ color: club.coverColor }}>{new Date(event.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
                    <p className="text-[10px] text-gray-400">{event.venue}</p>
                  </div>
                  {event.registrationLink && (
                    <a href={event.registrationLink} target="_blank" rel="noreferrer" className="shrink-0">
                      <ExternalLink size={12} className="text-gray-400 hover:text-indigo-500" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {club.achievements?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Achievements</p>
            <div className="space-y-1.5">
              {club.achievements.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Trophy size={13} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 dark:text-gray-300">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Members ({club.members?.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {club.members?.slice(0, 12).map(({ user: member }) => (
              <div key={member?._id} className="w-8 h-8 rounded-full overflow-hidden" title={member?.name}>
                {member?.avatar
                  ? <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: club.coverColor }}>{member?.name?.charAt(0)}</div>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function Clubs() {
  useSection('events')
  const { user } = useAuthStore()
  const [clubs, setClubs] = useState([])
  const [myClubs, setMyClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [clubEvents, setClubEvents] = useState([])
  const [showChat, setShowChat] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [tab, setTab] = useState('discover')

  const fetchClubs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      const [all, mine] = await Promise.all([
        api.get(`/clubs?${params}`),
        api.get('/clubs/my-clubs'),
      ])
      setClubs(all.data.clubs)
      setMyClubs(mine.data.clubs)
    } catch { toast.error('Failed to load clubs') }
    finally { setLoading(false) }
  }

  const fetchSelectedClub = async () => {
    if (!selectedClub) return
    try {
      const { data } = await api.get(`/clubs/${selectedClub._id}`)
      setSelectedClub(data.club)
      setClubEvents(data.events)
    } catch {}
  }

  useEffect(() => { fetchClubs() }, [search, category])

  const displayClubs = tab === 'my-clubs' ? myClubs : clubs

  return (
    <Layout>
      <AnimatePresence>
        {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} onCreated={fetchClubs} />}
      </AnimatePresence>

      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Left list */}
        <div className={`flex flex-col ${selectedClub ? 'hidden lg:flex lg:w-96' : 'w-full lg:w-96'} shrink-0`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Clubs</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Find your community</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Plus size={15} /> Create
            </motion.button>
          </div>

          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search clubs..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setCategory('')}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${!category ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              All
            </button>
            {Object.entries(categoryConfig).map(([key, conf]) => (
              <button key={key} onClick={() => setCategory(category === key ? '' : key)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${category === key ? 'text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                style={category === key ? { background: conf.color } : {}}>
                {conf.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {[{ id: 'discover', label: '🔍 Discover' }, { id: 'my-clubs', label: `👤 Mine (${myClubs.length})` }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-44 animate-pulse" />)}
              </div>
            ) : displayClubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Award size={32} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No clubs found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 pb-4">
                {displayClubs.map(club => (
                  <ClubCard key={club._id} club={club} currentUserId={user?.id}
                    onClick={() => { setSelectedClub(club); setShowChat(false) }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        {selectedClub ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <button onClick={() => setSelectedClub(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ArrowLeft size={18} /></button>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedClub.name}</p>
            </div>
            {showChat ? (
              <ClubChat club={selectedClub} onBack={() => setShowChat(false)} />
            ) : (
              <ClubDetail club={selectedClub} events={clubEvents} onRefresh={fetchSelectedClub} onOpenChat={() => setShowChat(true)} />
            )}
          </motion.div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Select a Club</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Discover clubs, see their activities, join the community
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}