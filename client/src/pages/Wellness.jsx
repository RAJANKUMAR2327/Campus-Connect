import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { HeartHandshake, CalendarPlus, X, Trash2, User as UserIcon, MapPin, Loader, Info } from 'lucide-react'

function AddSlotModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    counselorName: '', specialization: '', date: '', startTime: '09:00', durationMinutes: 30, location: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/counseling', form)
      toast.success('Slot added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add slot')
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Counseling Slot</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.counselorName} onChange={e => set('counselorName', e.target.value)} placeholder="Counselor name" required
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={form.specialization} onChange={e => set('specialization', e.target.value)} placeholder="Specialization (e.g. Academic stress)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} required
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.durationMinutes} onChange={e => set('durationMinutes', Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Room / Online"
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Slot'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function BookModal({ slot, onClose, onBooked }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleBook = async () => {
    setSaving(true)
    try {
      await api.post(`/counseling/${slot._id}/book`, { note })
      toast.success('Appointment booked!')
      onBooked()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book')
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 text-sm">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{slot.counselorName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date(slot.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {slot.startTime} · {slot.durationMinutes} min
          </p>
        </div>
        <p className="text-xs text-gray-400 mb-2">This booking is private — only you and campus admins can see it's yours.</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="What would you like to discuss? (optional)"
          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4" />
        <button onClick={handleBook} disabled={saving}
          className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {saving ? 'Booking…' : 'Confirm Booking'}
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function Wellness() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [slots, setSlots] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [bookingSlot, setBookingSlot] = useState(null)

  const fetchData = async () => {
    try {
      const [slotsRes, myRes] = await Promise.all([
        api.get('/counseling'),
        api.get('/counseling/my-bookings'),
      ])
      setSlots(slotsRes.data.slots)
      setMyBookings(myRes.data.slots)
    } catch {
      toast.error('Failed to load counseling slots')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const cancelBooking = async (id) => {
    try {
      await api.post(`/counseling/${id}/cancel`)
      toast.success('Booking cancelled')
      fetchData()
    } catch {
      toast.error('Failed to cancel')
    }
  }

  const deleteSlot = async (id) => {
    if (!confirm('Remove this slot?')) return
    try {
      await api.delete(`/counseling/${id}`)
      fetchData()
    } catch {
      toast.error('Failed to remove slot')
    }
  }

  const availableSlots = slots.filter(s => !s.isBooked)

  return (
    <Layout>
      <AnimatePresence>
        {showAddSlot && <AddSlotModal onClose={() => setShowAddSlot(false)} onAdded={fetchData} />}
        {bookingSlot && <BookModal slot={bookingSlot} onClose={() => setBookingSlot(null)} onBooked={fetchData} />}
      </AnimatePresence>

      <PageHeader
        title="Wellness & Counseling"
        subtitle="Book a confidential session with a campus counselor"
        action={isAdmin ? { label: 'Add Slot', icon: CalendarPlus, onClick: () => setShowAddSlot(true) } : undefined}
      />

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 mb-6 flex gap-3">
        <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-300">
          These sessions are with your campus's counseling staff and are kept private from other students.
          If you're in crisis or need to talk to someone right now, please also see the emergency contacts on the Campus Safety page.
        </p>
      </div>

      {myBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">My Appointments</h2>
          <div className="space-y-2">
            {myBookings.map(s => (
              <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.counselorName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {s.startTime} · {s.location || 'Location TBD'}
                  </p>
                </div>
                <button onClick={() => cancelBooking(s._id)}
                  className="text-xs font-medium text-red-500 hover:underline">Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Available Slots</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader size={22} className="animate-spin text-indigo-400" /></div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-12">
            <HeartHandshake size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-400">No open slots right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableSlots.map(s => (
              <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <UserIcon size={13} className="text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.counselorName}</p>
                </div>
                {s.specialization && <p className="text-xs text-gray-400 mb-1">{s.specialization}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.startTime} · {s.durationMinutes} min
                </p>
                {s.location && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-3"><MapPin size={10} /> {s.location}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setBookingSlot(s)}
                    className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Book
                  </button>
                  {isAdmin && (
                    <button onClick={() => deleteSlot(s._id)} className="text-gray-300 hover:text-red-500 px-2"><Trash2 size={14} /></button>
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
