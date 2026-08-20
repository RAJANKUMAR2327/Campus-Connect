import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Search, X, Link2, MapPin, Briefcase, GraduationCap, Users, Loader } from 'lucide-react'

const INDUSTRIES = [
  { value: 'software', label: 'Software' },
  { value: 'core-engineering', label: 'Core Engineering' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'finance', label: 'Finance' },
  { value: 'government', label: 'Government' },
  { value: 'research', label: 'Research' },
  { value: 'higher-studies', label: 'Higher Studies' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'other', label: 'Other' },
]

function ProfileModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    graduationYear: existing?.graduationYear || new Date().getFullYear(),
    currentCompany: existing?.currentCompany || '',
    currentRole: existing?.currentRole || '',
    industry: existing?.industry || 'software',
    location: existing?.location || '',
    bio: existing?.bio || '',
    linkedIn: existing?.linkedIn || '',
    willingToMentor: existing?.willingToMentor ?? true,
  })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (existing) {
        await api.patch('/alumni/me', form)
        toast.success('Profile updated!')
      } else {
        await api.post('/alumni', form)
        toast.success('You\'re now listed in the Alumni Network!')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {existing ? 'Edit Your Alumni Profile' : 'Join the Alumni Network'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Graduation year</label>
            <input type="number" min="1990" max="2035" value={form.graduationYear}
              onChange={e => set('graduationYear', e.target.value)} required
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.currentCompany} onChange={e => set('currentCompany', e.target.value)} placeholder="Current company"
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={form.currentRole} onChange={e => set('currentRole', e.target.value)} placeholder="Current role"
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={form.industry} onChange={e => set('industry', e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
            {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} placeholder="LinkedIn URL (optional)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Short bio (optional)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={form.willingToMentor} onChange={e => set('willingToMentor', e.target.checked)}
              className="rounded" />
            Open to mentoring current students
          </label>
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create Profile'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function AlumniCard({ profile }) {
  const industryLabel = INDUSTRIES.find(i => i.value === profile.industry)?.label || profile.industry
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center gap-3 mb-3">
        <img src={profile.user?.avatar || '/default-avatar.png'} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.user?.name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <GraduationCap size={11} /> Class of {profile.graduationYear} · {profile.user?.branch}
          </p>
        </div>
      </div>

      {(profile.currentRole || profile.currentCompany) && (
        <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1">
          <Briefcase size={13} className="text-gray-400" />
          {profile.currentRole}{profile.currentRole && profile.currentCompany ? ' at ' : ''}{profile.currentCompany}
        </p>
      )}
      {profile.location && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-2">
          <MapPin size={11} /> {profile.location}
        </p>
      )}

      <span className="inline-block text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full mb-2">
        {industryLabel}
      </span>

      {profile.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">{profile.bio}</p>}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
        {profile.willingToMentor ? (
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">Open to mentoring</span>
        ) : <span />}
        {profile.linkedIn && (
          <a href={profile.linkedIn} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            <Link2 size={12} /> LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

export default function AlumniNetwork() {
  useSection('placement')
  const [profiles, setProfiles] = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  const fetchAll = async () => {
    try {
      const [dirRes, meRes] = await Promise.all([
        api.get(`/alumni?${industryFilter ? `industry=${industryFilter}&` : ''}${search ? `search=${encodeURIComponent(search)}` : ''}`),
        api.get('/alumni/me'),
      ])
      setProfiles(dirRes.data.profiles)
      setMyProfile(meRes.data.profile)
    } catch {
      toast.error('Failed to load alumni network')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [industryFilter, search])

  return (
    <Layout>
      <AnimatePresence>
        {showModal && (
          <ProfileModal existing={myProfile} onClose={() => setShowModal(false)} onSaved={fetchAll} />
        )}
      </AnimatePresence>

      <PageHeader
        title="Alumni Network"
        subtitle={`${profiles.length} alumni listed`}
        action={{ label: myProfile ? 'Edit My Profile' : 'Join Network', icon: Users, onClick: () => setShowModal(true) }}
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, or role..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
          className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
          <option value="">All industries</option>
          {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16">
          <Users size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">No alumni listed yet.</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to join the network above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => <AlumniCard key={p._id} profile={p} />)}
        </div>
      )}
    </Layout>
  )
}
