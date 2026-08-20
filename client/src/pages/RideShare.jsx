import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  Car, Plus, X, MapPin, Clock, Users,
  Bike, Check, XCircle,
  ArrowRight, Loader,
  LogOut } from 'lucide-react'

const vehicleIcons = { car: Car, bike: Bike, auto: Car, other: Car }

// ─── CREATE RIDE MODAL ─────────────────────────────────────────────
function CreateRideModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    type: 'offer', fromLocation: '', toLocation: '',
    departureTime: '', totalSeats: 3, pricePerSeat: 0,
    vehicleType: 'car', vehicleInfo: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/rides', form)
      toast.success(form.type === 'offer' ? 'Ride posted!' : 'Request posted!')
      onCreated()
      onClose()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Post a Ride</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              {[{ id: 'offer', label: '🚗 I have a ride' }, { id: 'request', label: '🙋 I need a ride' }].map(t => (
                <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${form.type === t.id ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input value={form.fromLocation} required onChange={e => setForm(f => ({ ...f, fromLocation: e.target.value }))}
                placeholder="From (e.g. Campus Gate)"
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <ArrowRight size={14} className="text-gray-400 shrink-0" />
              <input value={form.toLocation} required onChange={e => setForm(f => ({ ...f, toLocation: e.target.value }))}
                placeholder="To (e.g. Railway Station)"
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Departure Time</label>
              <input type="datetime-local" value={form.departureTime} required onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {form.type === 'offer' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                    className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                    <option value="car">🚗 Car</option><option value="bike">🏍️ Bike</option><option value="auto">🛺 Auto</option>
                  </select>
                  <input type="number" value={form.totalSeats} min={1} max={6} onChange={e => setForm(f => ({ ...f, totalSeats: e.target.value }))}
                    placeholder="Seats" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" value={form.pricePerSeat} min={0} onChange={e => setForm(f => ({ ...f, pricePerSeat: e.target.value }))}
                    placeholder="₹/seat" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <input value={form.vehicleInfo} onChange={e => setForm(f => ({ ...f, vehicleInfo: e.target.value }))}
                  placeholder="Vehicle info (e.g. White Swift Dzire)"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </>
            )}

            <textarea value={form.notes} rows={2} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">{loading ? 'Posting...' : 'Post'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── RIDE CARD ──────────────────────────────────────────────────────
function RideCard({ ride, currentUserId, onJoin }) {
  const VehicleIcon = vehicleIcons[ride.vehicleType] || Car
  const hasJoined = ride.passengers?.some(p => p.user?._id === currentUserId)
  const isFull = ride.availableSeats <= 0

  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${ride.type === 'offer' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
          {ride.type === 'offer' ? '🚗 Ride Offered' : '🙋 Ride Needed'}
        </span>
        {ride.type === 'offer' && <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{ride.pricePerSeat > 0 ? `₹${ride.pricePerSeat}/seat` : 'Free'}</span>}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MapPin size={13} className="text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ride.fromLocation}</span>
        <ArrowRight size={12} className="text-gray-300 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ride.toLocation}</span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
        <span className="flex items-center gap-1"><Clock size={11} />{new Date(ride.departureTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        {ride.type === 'offer' && <span className="flex items-center gap-1"><Users size={11} />{ride.availableSeats}/{ride.totalSeats} seats</span>}
      </div>

      {ride.vehicleInfo && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><VehicleIcon size={12} />{ride.vehicleInfo}</p>
      )}
      {ride.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">"{ride.notes}"</p>}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            {ride.driver?.avatar ? <img src={ride.driver.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">{ride.driver?.name?.charAt(0)}</div>}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{ride.driver?.name}</span>
        </div>
        {ride.driver?._id !== currentUserId && (
          <button onClick={() => onJoin(ride)} disabled={hasJoined || (ride.type === 'offer' && isFull)}
            className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {hasJoined ? 'Requested' : isFull ? 'Full' : ride.type === 'offer' ? 'Join Ride' : 'Offer Ride'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── MY RIDES TAB ───────────────────────────────────────────────────
function MyRidesTab() {
  const { user } = useAuthStore()
  const [data, setData] = useState({ offered: [], joined: [] })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/rides/my-rides')
      setData(data)
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleRespond = async (rideId, passengerId, action) => {
    try { await api.patch(`/rides/${rideId}/respond`, { passengerId, action }); toast.success(`Passenger ${action}ed!`); fetchData() } catch { toast.error('Failed') }
  }

  const handleCancel = async (rideId) => {
    if (!confirm('Cancel this ride?')) return
    try { await api.patch(`/rides/${rideId}/cancel`); toast.success('Cancelled!'); fetchData() } catch { toast.error('Failed') }
  }

  const handleLeave = async (rideId) => {
    try { await api.patch(`/rides/${rideId}/leave`); toast.success('Left the ride'); fetchData() } catch { toast.error('Failed') }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Rides You Offered ({data.offered.length})</h3>
        {data.offered.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-600">No rides offered yet</p> : (
          <div className="space-y-3">
            {data.offered.map(ride => (
              <div key={ride._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ride.fromLocation} → {ride.toLocation}</p>
                  {ride.status === 'active' && <button onClick={() => handleCancel(ride._id)} className="text-xs text-red-500 hover:underline">Cancel</button>}
                </div>
                <p className="text-xs text-gray-400 mb-2">{new Date(ride.departureTime).toLocaleString()}</p>
                {ride.passengers?.filter(p => p.status === 'pending').map(p => (
                  <div key={p.user?._id || p._id} className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg mb-1.5">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">{p.user?.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white text-[9px] font-bold">{p.user?.name?.charAt(0) || '?'}</div>}</div>
                    <span className="text-xs flex-1 text-gray-700 dark:text-gray-300">{p.user?.name || 'Deleted User'}</span>
                    <button onClick={() => handleRespond(ride._id, p.user?._id, 'confirm')} className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 p-1 rounded"><Check size={13} /></button>
                    <button onClick={() => handleRespond(ride._id, p.user?._id, 'reject')} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded"><XCircle size={13} /></button>
                  </div>
                ))}
                {ride.passengers?.filter(p => p.status === 'confirmed').map(p => (
                  <div key={p.user?._id || p._id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg mb-1.5">
                    <Check size={11} className="text-green-500" /><span className="text-xs text-green-700 dark:text-green-400">{p.user?.name || 'Deleted User'} confirmed</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Rides You Joined ({data.joined.length})</h3>
        {data.joined.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-600">No rides joined yet</p> : (
          <div className="space-y-3">
            {data.joined.map(ride => {
              const myStatus = ride.passengers?.find(p => p.user === user?.id)?.status
              return (
                <div key={ride._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ride.fromLocation} → {ride.toLocation}</p><p className="text-xs text-gray-400">Driver: {ride.driver?.name}</p></div>
                    <button onClick={() => handleLeave(ride._id)} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function RideShare() {
  useSection('events')
  const { user } = useAuthStore()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState('browse')
  const [filterType, setFilterType] = useState('')

  const fetchRides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType) params.append('type', filterType)
      const { data } = await api.get(`/rides?${params}`)
      setRides(data.rides)
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchRides() }, [filterType])

  const handleJoin = async (ride) => {
    try { await api.post(`/rides/${ride._id}/join`); toast.success('Request sent!'); fetchRides() } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <Layout>
      <AnimatePresence>{showCreate && <CreateRideModal onClose={() => setShowCreate(false)} onCreated={fetchRides} />}</AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ride Share</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Carpool with fellow students</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all" style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> Post Ride
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ id: 'browse', label: 'Browse Rides' }, { id: 'my-rides', label: 'My Rides' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'browse' ? (
        <>
          <div className="flex gap-2 mb-4">
            {[{ id: '', label: 'All' }, { id: 'offer', label: '🚗 Offering' }, { id: 'request', label: '🙋 Looking' }].map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id)} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterType === f.id ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>{f.label}</button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
          ) : rides.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800"><Car size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" /><p className="text-gray-500 dark:text-gray-400">No rides available</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rides.map(ride => <RideCard key={ride._id} ride={ride} currentUserId={user?.id} onJoin={handleJoin} />)}
            </div>
          )}
        </>
      ) : <MyRidesTab />}
    </Layout>
  )
}