import { useSection } from '../hooks/useSection'
import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import BadgesGrid from '../components/BadgesGrid'

import {
  User, Mail, BookOpen, GraduationCap,
  Edit3, Save, X, Camera, FileText,
  ShoppingBag, Briefcase } from 'lucide-react'

const branches = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Chemical', 'Civil', 'Pharmacy', 'Other']

export default function Profile() {
  useSection('dashboard')
  const { user, setAuth } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    branch: user?.branch || '',
    year: user?.year || '',
    college: user?.college || '' })
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [stats, setStats] = useState({
    notes: 0, events: 0, listings: 0, placements: 0
  })
  const fileRef = useRef()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notes, listings, placements] = await Promise.all([
          api.get('/notes/user/my-notes'),
          api.get('/listings/user/my-listings'),
          api.get('/placement/user/my-posts'),
        ])
        setStats({
          notes: notes.data.notes?.length || 0,
          listings: listings.data.listings?.length || 0,
          placements: placements.data.posts?.length || 0 })
      } catch {}
    }
    fetchStats()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data } = await api.patch('/auth/update-profile', form)
      setAuth(localStorage.getItem('token'), data.user)
      toast.success('Profile updated!')
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await api.patch('/auth/update-avatar', fd)
      setAuth(localStorage.getItem('token'), data.user)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile</h1>

        {/* Avatar + name card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">

          {/* Avatar section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {initials}
                </div>
              )}

              {/* Camera overlay */}
              <button
                onClick={() => fileRef.current.click()}
                disabled={avatarLoading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {avatarLoading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full capitalize">
                  {user?.role}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {user?.branch} · Year {user?.year}
                </span>
              </div>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors shrink-0"
            >
              {editing ? <><X size={14} /> Cancel</> : <><Edit3 size={14} /> Edit</>}
            </button>
          </div>

          {/* Info fields */}
          <div className="space-y-3">
            {/* Email - readonly */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{user?.email}</p>
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <User size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Full Name</p>
                {editing ? (
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100">{user?.name}</p>
                )}
              </div>
            </div>

            {/* College */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <GraduationCap size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">College</p>
                {editing ? (
                  <input
                    value={form.college}
                    onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100">{user?.college}</p>
                )}
              </div>
            </div>

            {/* Branch + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <BookOpen size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Branch</p>
                  {editing ? (
                    <select
                      value={form.branch}
                      onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100">{user?.branch}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <GraduationCap size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Year</p>
                  {editing ? (
                    <select
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100">Year {user?.year}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <button
              onClick={handleSave} disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Activity Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Activity</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Notes Uploaded', value: stats.notes, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
              { label: 'Items Listed', value: stats.listings, icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/30' },
              { label: 'Placement Posts', value: stats.placements, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className={`${s.bg} w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <s.icon size={16} className={s.color} />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4"> <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Badges</h3> <BadgesGrid /> </div>


        {/* Bookmarked Notes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { label: 'My Notes', to: '/notes', icon: FileText },
              { label: 'My Listings', to: '/marketplace', icon: ShoppingBag },
            ].map(({ label, icon: Icon }) => (
              <div key={label}
                className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <Icon size={15} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}