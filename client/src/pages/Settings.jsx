import { useSection } from '../hooks/useSection'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import toast from 'react-hot-toast'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import {
  Lock, Trash2, Moon, Sun, Bell, Shield, 
  ChevronRight, Eye, EyeOff, LogOut, Monitor, 
  Smartphone, Mail, Send, UserX, Users, MessageSquareOff, PauseCircle, Download} from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function SettingRow({ icon: Icon, label, description, children, danger }) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0
      ${danger ? 'text-red-500' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
          <Icon size={15} className={danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
        </div>
        <div>
          <p className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
            {label}
          </p>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  useSection('dashboard')
  const { user, logout, setAuth } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Change password
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  })
  const [pwLoading, setPwLoading] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)

  // Delete account
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // NEW: account deactivation (soft, reversible — distinct from delete)
  const [deactivatePassword, setDeactivatePassword] = useState('')
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  // Notification preferences (local only for now)
  const [notifications, setNotifications] = useState({
    events: true,
    placement: true,
    marketplace: false,
    lostFound: true })

  // Push notifications hook
  const { subscribed, loading: pushLoading, supported, subscribe: enablePush, unsubscribe: disablePush } = usePushNotifications()

  // Email Digest State
  const [digestPrefs, setDigestPrefs] = useState(null)
  const [sendingPreview, setSendingPreview] = useState(false)

  // NEW: Privacy settings + blocked users
  const [privacy, setPrivacy] = useState(null)
  const [privacySaving, setPrivacySaving] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState(null) // null = not loaded yet
  const [showBlockedList, setShowBlockedList] = useState(false)
  const [unblockingId, setUnblockingId] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const { data } = await api.get('/digest/preferences')
        setDigestPrefs(data.preferences)
      } catch {}
    }
    const fetchPrivacy = async () => {
      try {
        const { data } = await api.get('/privacy/settings')
        setPrivacy(data.privacy)
      } catch {}
    }
    fetchDigest()
    fetchPrivacy()
  }, [])

  const updatePrivacy = async (updates) => {
    const prev = privacy
    setPrivacy(p => ({ ...p, ...updates })) // optimistic
    setPrivacySaving(true)
    try {
      await api.patch('/privacy/settings', updates)
    } catch (err) {
      setPrivacy(prev) // revert on failure
      toast.error(err.response?.data?.message || 'Failed to save privacy setting')
    } finally {
      setPrivacySaving(false)
    }
  }

  const loadBlockedUsers = async () => {
    setShowBlockedList(s => !s)
    if (blockedUsers === null) {
      try {
        const { data } = await api.get('/privacy/blocked')
        setBlockedUsers(data.blockedUsers)
      } catch {
        toast.error('Failed to load blocked users')
        setBlockedUsers([])
      }
    }
  }

  const handleUnblock = async (userId) => {
    setUnblockingId(userId)
    try {
      await api.delete(`/privacy/block/${userId}`)
      setBlockedUsers(list => list.filter(u => u._id !== userId))
      toast.success('User unblocked')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user')
    } finally {
      setUnblockingId(null)
    }
  }

  // NEW: data export — fetch as JSON, then trigger a client-side download
  // rather than navigating away, so the person stays on the settings page.
  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const { data } = await api.get('/auth/export-my-data')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `campusconnect-my-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Your data export has downloaded.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate export')
    } finally {
      setExportLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('New passwords do not match.')
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.')
    }
    setPwLoading(true)
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword })
      toast.success('Password changed successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPwForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteLoading(true)
    try {
      await api.delete('/auth/delete-account', {
        data: { password: deletePassword }
      })
      toast.success('Account deleted.')
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  // NEW: deactivate account — soft, reversible. Logging back in reactivates
  // it automatically (see authController.login), so no special "reactivate"
  // button is needed anywhere in the UI.
  const handleDeactivateAccount = async (e) => {
    e.preventDefault()
    setDeactivateLoading(true)
    try {
      await api.post('/auth/deactivate-account', { password: deactivatePassword })
      toast.success('Account deactivated. Log back in anytime to reactivate it.')
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account')
    } finally {
      setDeactivateLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully!')
  }

  const updateDigestPref = async (updates) => {
    const newPrefs = { ...digestPrefs, ...updates }
    setDigestPrefs(newPrefs)
    try {
      await api.patch('/digest/preferences', newPrefs)
    } catch { 
      toast.error('Failed to save preference') 
    }
  }

  const handleSendPreview = async () => {
    setSendingPreview(true)
    try {
      await api.post('/digest/preview')
      toast.success('Check your email!')
    } catch { 
      toast.error('Failed to send') 
    } finally { 
      setSendingPreview(false) 
    }
  }

  const PasswordInput = ({ field, placeholder, value, onChange }) => (
    <div className="relative">
      <input
        type={showPasswords[field] ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPasswords(s => ({ ...s, [field]: !s[field] }))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {showPasswords[field] ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>

        {/* Account info */}
        <Section title="Account">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user?.name?.charAt(0)
              }
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Edit <ChevronRight size={13} />
            </button>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow
            icon={theme === 'light' ? Moon : Sun}
            label="Dark Mode"
            description={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200
                ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </SettingRow>

          <SettingRow
            icon={Monitor}
            label="System Theme"
            description="Use your device's theme preference"
          >
            <button
              onClick={() => {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                if (prefersDark && theme !== 'dark') toggleTheme()
                if (!prefersDark && theme !== 'light') toggleTheme()
                toast.success('Synced with system theme!')
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              Sync
            </button>
          </SettingRow>
        </Section>

        {/* Language */}
        <Section title={t('settings.language')}>
          <div className="py-2">
            <LanguageSwitcher variant="inline" />
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          {supported ? (
            <SettingRow
              icon={Smartphone}
              label="Push Notifications"
              description="Get notified even when the app is closed"
            >
              <button
                onClick={subscribed ? disablePush : enablePush}
                disabled={pushLoading}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50
                  ${subscribed ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${subscribed ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </SettingRow>
          ) : (
            <SettingRow
              icon={Smartphone}
              label="Push Notifications"
              description="Not supported on this browser/device"
            >
              <span className="text-xs text-gray-400">N/A</span>
            </SettingRow>
          )}

          {[
            { key: 'events', label: 'Event Reminders', desc: 'Get notified about upcoming events' },
            { key: 'placement', label: 'Placement Updates', desc: 'New jobs and internships' },
            { key: 'marketplace', label: 'Marketplace Activity', desc: 'Interest in your listings' },
            { key: 'lostFound', label: 'Lost & Found Matches', desc: 'When someone finds your item' },
          ].map(({ key, label, desc }) => (
            <SettingRow key={key} icon={Bell} label={label} description={desc}>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200
                  ${notifications[key] ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${notifications[key] ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </SettingRow>
          ))}
        </Section>

        {/* Email Digest */}
        {digestPrefs && (
          <Section title="Email Digest">
            <SettingRow icon={Mail} label="Email Digest" description="Get a summary of campus activity">
              <button
                onClick={() => updateDigestPref({ enabled: !digestPrefs.enabled })}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${digestPrefs.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${digestPrefs.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </SettingRow>

            {digestPrefs.enabled && (
              <>
                <div className="flex gap-2 py-3 border-b border-gray-50 dark:border-gray-800">
                  {['daily', 'weekly'].map(f => (
                    <button key={f} onClick={() => updateDigestPref({ frequency: f })}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${digestPrefs.frequency === f ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {f}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2">Include in digest:</p>
                {Object.entries({ notes: 'New Notes', events: 'Upcoming Events', placements: 'Placement Posts', marketplace: 'Marketplace', gamification: 'Your Progress', mentorship: 'Mentorship Updates' }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                    <button onClick={() => updateDigestPref({ sections: { ...digestPrefs.sections, [key]: !digestPrefs.sections[key] } })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${digestPrefs.sections[key] ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${digestPrefs.sections[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}

                <button onClick={handleSendPreview} disabled={sendingPreview}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-xs font-medium border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50">
                  <Send size={12} /> {sendingPreview ? 'Sending...' : 'Send me a preview now'}
                </button>
              </>
            )}
          </Section>
        )}

        {/* Privacy (NEW) */}
        <Section title="Privacy">
          {privacy && (
            <>
              <SettingRow
                icon={Eye}
                label="Who can see my profile"
                description="Controls who can view your full profile details"
              >
                <select
                  value={privacy.profileVisibility}
                  disabled={privacySaving}
                  onChange={e => updatePrivacy({ profileVisibility: e.target.value })}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="everyone">Everyone</option>
                  <option value="college">My college only</option>
                  <option value="connections">Connections only</option>
                </select>
              </SettingRow>

              <SettingRow
                icon={MessageSquareOff}
                label="Who can message me"
                description="Controls who can start a new conversation with you"
              >
                <select
                  value={privacy.whoCanMessage}
                  disabled={privacySaving}
                  onChange={e => updatePrivacy({ whoCanMessage: e.target.value })}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="everyone">Everyone</option>
                  <option value="college">My college only</option>
                  <option value="nobody">No one</option>
                </select>
              </SettingRow>

              <SettingRow
                icon={Mail}
                label="Show email on profile"
                description="Let other students see your email address"
              >
                <button
                  onClick={() => updatePrivacy({ showEmail: !privacy.showEmail })}
                  disabled={privacySaving}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50
                    ${privacy.showEmail ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${privacy.showEmail ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </SettingRow>

              <SettingRow
                icon={UserX}
                label="Blocked users"
                description="Manage people you've blocked"
              >
                <button
                  onClick={loadBlockedUsers}
                  className="text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  {showBlockedList ? 'Hide' : 'Manage'}
                </button>
              </SettingRow>

              {showBlockedList && (
                <div className="mt-3 space-y-2">
                  {blockedUsers === null ? (
                    <p className="text-xs text-gray-400 py-2">Loading...</p>
                  ) : blockedUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 flex items-center gap-2">
                      <Users size={13} /> You haven't blocked anyone.
                    </p>
                  ) : (
                    blockedUsers.map(u => (
                      <div key={u._id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{u.name}</span>
                        </div>
                        <button
                          onClick={() => handleUnblock(u._id)}
                          disabled={unblockingId === u._id}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
                        >
                          {unblockingId === u._id ? 'Unblocking...' : 'Unblock'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* NEW: data export ("download my data") */}
              <SettingRow
                icon={Download}
                label="Download your data"
                description="Get a copy of your profile and everything you've created"
              >
                <button
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
                >
                  {exportLoading ? 'Preparing...' : 'Download'}
                </button>
              </SettingRow>
            </>
          )}
        </Section>

        {/* Security */}
        <Section title="Security">
          <SettingRow
            icon={Lock}
            label="Change Password"
            description="Update your account password"
          >
            <button
              onClick={() => setShowPwForm(!showPwForm)}
              className="text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              {showPwForm ? 'Cancel' : 'Change'}
            </button>
          </SettingRow>

          {showPwForm && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <PasswordInput
                field="current"
                placeholder="Current password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              />
              <PasswordInput
                field="new"
                placeholder="New password (min 6 chars)"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              />
              <PasswordInput
                field="confirm"
                placeholder="Confirm new password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
              <button
                type="submit" disabled={pwLoading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {pwLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          <SettingRow
            icon={Shield}
            label="Two-Factor Authentication"
            description="Coming soon"
          >
            <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
              Soon
            </span>
          </SettingRow>
        </Section>

        {/* Session */}
        <Section title="Session">
          <SettingRow
            icon={LogOut}
            label="Sign Out"
            description="Log out of your account"
          >
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </SettingRow>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          {/* NEW: Deactivate — soft, reversible, offered before the permanent delete option */}
          <SettingRow
            icon={PauseCircle}
            label="Deactivate Account"
            description="Hide your profile and pause your account — log back in anytime to reactivate"
          >
            <button
              onClick={() => setShowDeactivateConfirm(!showDeactivateConfirm)}
              className="text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              {showDeactivateConfirm ? 'Cancel' : 'Deactivate'}
            </button>
          </SettingRow>

          {showDeactivateConfirm && (
            <form onSubmit={handleDeactivateAccount} className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900">
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3 font-medium">
                Your profile and content will be hidden from other users. Nothing is deleted — logging back in restores everything exactly as it was.
              </p>
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={deactivatePassword}
                onChange={e => setDeactivatePassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-amber-200 dark:border-amber-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
              />
              <button
                type="submit" disabled={deactivateLoading}
                className="w-full bg-amber-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {deactivateLoading ? 'Deactivating...' : 'Yes, Deactivate My Account'}
              </button>
            </form>
          )}

          <SettingRow
            icon={Trash2}
            label="Delete Account"
            description="Permanently delete your account and all data"
            danger
          >
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="text-xs text-red-500 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {showDeleteConfirm ? 'Cancel' : 'Delete'}
            </button>
          </SettingRow>

          {showDeleteConfirm && (
            <form onSubmit={handleDeleteAccount} className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 font-medium">
                ⚠️ This action is irreversible. All your notes, posts, and listings will be deleted.
              </p>
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
              />
              <button
                type="submit" disabled={deleteLoading}
                className="w-full bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </form>
          )}
        </Section>
      </div>
    </Layout>
  )
}