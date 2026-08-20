import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Siren, Phone, X, Plus, Trash2, MapPin, CheckCircle2, Loader, ShieldAlert } from 'lucide-react'

const CATEGORY_LABELS = {
  'campus-security': 'Campus Security',
  medical: 'Medical',
  police: 'Police',
  fire: 'Fire',
  counseling: 'Counseling',
  other: 'Other',
}

function SOSModal({ onClose, onSent }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [locating, setLocating] = useState(true)
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocating(false) },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }, [])

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post('/safety/alerts', { ...coords, message })
      toast.success('Alert sent — campus admins have been notified.')
      onSent()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Siren size={18} className="text-red-500" /> Send SOS Alert
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          This immediately notifies all campus admins with your name{coords ? ' and current location' : ''}. Use this only for genuine safety concerns.
        </p>
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <MapPin size={11} />
          {locating ? 'Getting your location…' : coords ? 'Location attached' : 'Location unavailable — alert will be sent without it'}
        </p>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Briefly describe what's happening (optional)"
          rows={3}
          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
        />
        <button onClick={handleSend} disabled={sending}
          className="w-full bg-red-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {sending ? 'Sending…' : <><Siren size={16} /> Send Alert Now</>}
        </button>
      </motion.div>
    </motion.div>
  )
}

function AddContactModal({ onClose, onAdded }) {
  const [label, setLabel] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('campus-security')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/safety/contacts', { label, phone, category })
      toast.success('Contact added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add contact')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Emergency Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Campus Security Desk)" required
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" required
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Contact'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function CampusSafety() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [contacts, setContacts] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSOS, setShowSOS] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)

  const fetchData = async () => {
    try {
      const requests = [api.get('/safety/contacts')]
      if (isAdmin) requests.push(api.get('/safety/alerts'))
      const results = await Promise.all(requests)
      setContacts(results[0].data.contacts)
      if (isAdmin) setAlerts(results[1].data.alerts)
    } catch {
      toast.error('Failed to load safety info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [isAdmin])

  const resolveAlert = async (id) => {
    try {
      await api.patch(`/safety/alerts/${id}/resolve`)
      toast.success('Alert resolved')
      fetchData()
    } catch {
      toast.error('Failed to resolve alert')
    }
  }

  const removeContact = async (id) => {
    if (!confirm('Remove this contact?')) return
    try {
      await api.delete(`/safety/contacts/${id}`)
      fetchData()
    } catch {
      toast.error('Failed to remove contact')
    }
  }

  return (
    <Layout>
      <AnimatePresence>
        {showSOS && <SOSModal onClose={() => setShowSOS(false)} onSent={fetchData} />}
        {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onAdded={fetchData} />}
      </AnimatePresence>

      <PageHeader
        title="Campus Safety"
        subtitle="Emergency alerts and important contacts"
        action={isAdmin ? { label: 'Add Contact', icon: Plus, onClick: () => setShowAddContact(true) } : undefined}
      />

      {/* Big SOS button */}
      <button onClick={() => setShowSOS(true)}
        className="w-full bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 mb-6 flex items-center justify-between hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20">
        <div className="text-left">
          <p className="text-lg font-bold flex items-center gap-2"><Siren size={20} /> Emergency SOS</p>
          <p className="text-xs text-white/80 mt-1">Tap to alert campus admins immediately</p>
        </div>
        <ShieldAlert size={36} className="text-white/40" />
      </button>

      {/* Admin: active alerts */}
      {isAdmin && alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">Active Alerts</h2>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a._id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.user?.name} <span className="text-xs font-normal text-gray-400">· {a.user?.branch}</span></p>
                  {a.message && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{a.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  {a.latitude && (
                    <a href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1">
                      <MapPin size={11} /> View location
                    </a>
                  )}
                </div>
                <button onClick={() => resolveAlert(a._id)}
                  className="flex items-center gap-1 text-xs font-medium bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900/40 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <CheckCircle2 size={12} /> Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency contacts */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Emergency Contacts</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader size={20} className="animate-spin text-indigo-400" /></div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No emergency contacts added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contacts.map(c => (
              <div key={c._id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.label}</p>
                  <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[c.category]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                    <Phone size={12} /> {c.phone}
                  </a>
                  {isAdmin && (
                    <button onClick={() => removeContact(c._id)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
