import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import CallButton from '../components/CallButton'
import {
  Users, Star, Award, Search, X,
  MessageCircle, CheckCircle,
  XCircle, Plus, Sparkles,
  TrendingUp, Briefcase, Code, GraduationCap,
  Heart, Target,
  Loader, UserCheck, Send } from 'lucide-react'

const domainConfig = {
  'academics': { icon: GraduationCap, label: 'Academics', color: '#6366f1' },
  'placements': { icon: Briefcase, label: 'Placements', color: '#3b82f6' },
  'projects': { icon: Code, label: 'Projects', color: '#8b5cf6' },
  'competitive-programming': { icon: TrendingUp, label: 'Competitive Programming', color: '#ec4899' },
  'research': { icon: Sparkles, label: 'Research', color: '#10b981' },
  'higher-studies': { icon: GraduationCap, label: 'Higher Studies', color: '#f59e0b' },
  'internships': { icon: Briefcase, label: 'Internships', color: '#06b6d4' },
  'career-guidance': { icon: Target, label: 'Career Guidance', color: '#ef4444' },
  'soft-skills': { icon: Heart, label: 'Soft Skills', color: '#f43f5e' },
  'entrepreneurship': { icon: TrendingUp, label: 'Entrepreneurship', color: '#14b8a6' } }

// ─── BECOME MENTOR MODAL ──────────────────────────────────────────
function BecomeMentorModal({ onClose, onCreated, existingProfile }) {
  const [form, setForm] = useState({
    bio: existingProfile?.bio || '',
    expertise: existingProfile?.expertise?.join(', ') || '',
    domains: existingProfile?.domains || [],
    experience: existingProfile?.experience || '',
    availability: existingProfile?.availability || 'medium',
    maxMentees: existingProfile?.maxMentees || 5,
    linkedIn: existingProfile?.linkedIn || '' })
  const [loading, setLoading] = useState(false)

  const toggleDomain = (d) => {
    setForm(f => ({
      ...f,
      domains: f.domains.includes(d) ? f.domains.filter(x => x !== d) : [...f.domains, d]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.domains.length === 0) return toast.error('Select at least one domain')
    setLoading(true)
    try {
      const payload = {
        ...form,
        expertise: JSON.stringify(form.expertise.split(',').map(s => s.trim()).filter(Boolean)),
        domains: JSON.stringify(form.domains) }
      if (existingProfile) {
        await api.patch('/mentorship/profile', payload)
        toast.success('Profile updated!')
      } else {
        await api.post('/mentorship/profile', payload)
        toast.success('You are now a mentor! 🎉')
      }
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {existingProfile ? 'Edit Mentor Profile' : 'Become a Mentor'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Domains you can mentor in *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(domainConfig).map(([key, conf]) => (
                  <button key={key} type="button"
                    onClick={() => toggleDomain(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all
                      ${form.domains.includes(key)
                        ? 'ring-1 ring-current'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    style={form.domains.includes(key) ? { background: `${conf.color}15`, color: conf.color } : {}}>
                    <conf.icon size={14} className="shrink-0" />
                    {conf.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</label>
              <textarea value={form.bio} rows={3}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell mentees about yourself, what you can help with..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Experience / Achievements</label>
              <input value={form.experience}
                onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                placeholder="e.g. SWE Intern at Google, 500+ Leetcode problems solved"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Areas of Expertise (comma separated)</label>
              <input value={form.expertise}
                onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
                placeholder="DSA, System Design, Resume Building"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Availability</label>
                <select value={form.availability}
                  onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Mentees</label>
                <input type="number" value={form.maxMentees} min={1} max={20}
                  onChange={e => setForm(f => ({ ...f, maxMentees: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">LinkedIn (optional)</label>
              <input value={form.linkedIn}
                onChange={e => setForm(f => ({ ...f, linkedIn: e.target.value }))}
                placeholder="linkedin.com/in/..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
                {loading ? 'Saving...' : existingProfile ? 'Update Profile' : 'Become a Mentor'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── REQUEST MODAL ────────────────────────────────────────────────
function RequestMentorModal({ mentor, onClose, onSent }) {
  const [message, setMessage] = useState('')
  const [domain, setDomain] = useState(mentor.domains?.[0] || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/mentorship/requests', {
        mentorId: mentor.user?._id, message, domain })
      toast.success('Request sent!')
      onSent()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Request Mentorship</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>

          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              {mentor.user?.avatar
                ? <img src={mentor.user.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{mentor.user?.name?.charAt(0)}</div>
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{mentor.user?.name}</p>
              <p className="text-xs text-gray-400">{mentor.user?.branch} · Y{mentor.user?.year}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Domain</label>
              <select value={domain} onChange={e => setDomain(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {mentor.domains?.map(d => (
                  <option key={d} value={d}>{domainConfig[d]?.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Message</label>
              <textarea value={message} rows={4} required
                onChange={e => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain what you need help with..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold flex items-center justify-center gap-2">
                {loading ? 'Sending...' : <><Send size={14} /> Send Request</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── MENTOR CARD ──────────────────────────────────────────────────
function MentorCard({ mentor, onRequest }) {
  const availabilityColor = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    low: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' }

  return (
    <motion.div whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900">
          {mentor.user?.avatar
            ? <img src={mentor.user.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{mentor.user?.name?.charAt(0)}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{mentor.user?.name}</p>
          <p className="text-xs text-gray-400">{mentor.user?.branch} · Year {mentor.user?.year}</p>
          {mentor.rating > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{mentor.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({mentor.totalRatings})</span>
            </div>
          )}
        </div>
        <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${availabilityColor[mentor.availability]}`}>
          {mentor.availability}
        </span>
      </div>

      {mentor.bio && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{mentor.bio}</p>
      )}

      {mentor.experience && (
        <div className="flex items-center gap-1.5 mb-3">
          <Award size={12} className="text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">{mentor.experience}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {mentor.domains?.slice(0, 3).map(d => {
          const conf = domainConfig[d]
          return (
            <span key={d} className="text-[10px] font-medium px-2 py-1 rounded-full"
              style={{ background: `${conf?.color}15`, color: conf?.color }}>
              {conf?.label}
            </span>
          )
        })}
        {mentor.domains?.length > 3 && (
          <span className="text-[10px] text-gray-400">+{mentor.domains.length - 3}</span>
        )}
      </div>

      <button onClick={() => onRequest(mentor)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
        style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
        <UserCheck size={14} /> Request Mentorship
      </button>
    </motion.div>
  )
}

// ─── MY MENTORSHIPS TAB ───────────────────────────────────────────
function MyMentorshipsTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): the original fired these two
  // requests via Promise.all inside one fetchData function — with
  // separate useQuery calls, react-query fires them in parallel
  // automatically, no explicit Promise.all needed.
  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['mentorship-active'],
    queryFn: async () => {
      const { data } = await api.get('/mentorship/active')
      return data
    },
  })
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['mentorship-requests'],
    queryFn: async () => {
      const { data } = await api.get('/mentorship/requests/as-mentor?status=pending')
      return data.requests
    },
  })

  const data = activeData ?? { asMentor: [], asMentee: [] }
  const requests = requestsData ?? []
  const loading = activeLoading || requestsLoading

  // Accepting a request moves it out of "pending" and into "active
  // mentorships" — two separate cached queries need to change together.
  // Patching both optimistically would mean reconstructing an active-
  // mentorship record's shape (mentee info, domain, etc.) from a request
  // record that isn't guaranteed to have identical fields — invalidating
  // both is the honest, correct choice here rather than a fragile guess
  // at what the new record should look like.
  const handleRespond = async (id, action) => {
    try {
      await api.patch(`/mentorship/requests/${id}`, { action })
      toast.success(`Request ${action}ed!`)
      queryClient.invalidateQueries({ queryKey: ['mentorship-active'] })
      queryClient.invalidateQueries({ queryKey: ['mentorship-requests'] })
    } catch { toast.error('Failed') }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      {requests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Pending Requests ({requests.length})
          </h3>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req._id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                    {req.mentee?.avatar
                      ? <img src={req.mentee.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">{req.mentee?.name?.charAt(0)}</div>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{req.mentee?.name}</p>
                    <p className="text-xs text-gray-400">{req.mentee?.branch} · Y{req.mentee?.year}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full"
                    style={{ background: `${domainConfig[req.domain]?.color}15`, color: domainConfig[req.domain]?.color }}>
                    {domainConfig[req.domain]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{req.message}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleRespond(req._id, 'accept')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <CheckCircle size={13} /> Accept
                  </button>
                  <button onClick={() => handleRespond(req._id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <XCircle size={13} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* As mentor */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          My Mentees ({data.asMentor.length})
        </h3>
        {data.asMentor.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600">No active mentees yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.asMentor.map(m => (
              <div key={m._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  {m.mentee?.avatar
                    ? <img src={m.mentee.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold">{m.mentee?.name?.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.mentee?.name}</p>
                  <p className="text-[10px] text-gray-400">{domainConfig[m.domain]?.label}</p>
                </div>
                
                <CallButton targetUserId={m.mentee._id} targetName={m.mentee.name} targetAvatar={m.mentee.avatar} type="mentorship" />

              </div>
            ))}
          </div>
        )}
      </div>

      {/* As mentee */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          My Mentors ({data.asMentee.length})
        </h3>
        {data.asMentee.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600">No active mentors yet — find one above!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.asMentee.map(m => (
              <div key={m._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  {m.mentor?.avatar
                    ? <img src={m.mentor.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white font-bold">{m.mentor?.name?.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.mentor?.name}</p>
                  <p className="text-[10px] text-gray-400">{domainConfig[m.domain]?.label}</p>
                </div>
                <MessageCircle size={15} className="text-gray-400 cursor-pointer hover:text-indigo-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function Mentorship() {
  useSection('placement')
  const { user } = useAuthStore()
  const [showBecomeMentor, setShowBecomeMentor] = useState(false)
  const [requestingMentor, setRequestingMentor] = useState(null)
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [tab, setTab] = useState('find')
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx/Notes.jsx/etc.
  // for the same pattern applied elsewhere.
  const { data: mentorsData, isLoading } = useQuery({
    queryKey: ['mentors', search, domain],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (domain) params.append('domain', domain)
      const { data } = await api.get(`/mentorship/mentors?${params}`)
      return data.mentors
    },
  })
  const mentors = mentorsData ?? []

  const { data: myProfile } = useQuery({
    queryKey: ['my-mentor-profile'],
    queryFn: async () => {
      const { data } = await api.get('/mentorship/my-profile')
      return data.profile
    },
  })

  const invalidateMyProfile = () => queryClient.invalidateQueries({ queryKey: ['my-mentor-profile'] })
  const invalidateMentors = () => queryClient.invalidateQueries({ queryKey: ['mentors'] })

  const tabs = [
    { id: 'find', label: '🔍 Find a Mentor' },
    { id: 'my-mentorships', label: '🤝 My Mentorships' },
  ]

  return (
    <Layout>
      <AnimatePresence>
        {showBecomeMentor && (
          <BecomeMentorModal
            existingProfile={myProfile}
            onClose={() => setShowBecomeMentor(false)}
            onCreated={invalidateMyProfile}
          />
        )}
        {requestingMentor && (
          <RequestMentorModal
            mentor={requestingMentor}
            onClose={() => setRequestingMentor(null)}
            onSent={invalidateMentors}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mentorship</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Connect with seniors, grow faster</p>
        </div>
        <button onClick={() => setShowBecomeMentor(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> {myProfile ? 'Edit Mentor Profile' : 'Become a Mentor'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-medium px-4 py-2 rounded-xl transition-all
              ${tab === t.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my-mentorships' ? (
        <MyMentorshipsTab />
      ) : (
        <>
          {/* Search & filters */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Search size={15} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by skills, expertise..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setDomain('')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${!domain ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                All Domains
              </button>
              {Object.entries(domainConfig).map(([key, conf]) => (
                <button key={key} onClick={() => setDomain(domain === key ? '' : key)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${domain === key ? 'text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                  style={domain === key ? { background: conf.color } : {}}>
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mentors grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-56 animate-pulse" />)}
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Users size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No mentors found</p>
              <button onClick={() => setShowBecomeMentor(true)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Be the first mentor!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map(mentor => (
                <MentorCard key={mentor._id} mentor={mentor} onRequest={setRequestingMentor} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}