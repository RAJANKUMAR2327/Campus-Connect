import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  BookOpen, MapPin, Clock, Users, Zap,
  X, Check, Calendar, QrCode, Trash2,
  Wifi, Monitor, Plug, ChevronRight,
  Loader, AlertCircle, CheckCircle } from 'lucide-react'

const typeIcons = {
  silent: '🤫', 'group-study': '👥', 'computer-lab': '💻',
  'discussion-room': '💬', 'reading-room': '📖' }

const statusConfig = {
  upcoming: { color: '#6366f1', bg: '#eef2ff', label: 'Upcoming' },
  'checked-in': { color: '#10b981', bg: '#ecfdf5', label: 'Active Now' },
  completed: { color: '#6b7280', bg: '#f9fafb', label: 'Completed' },
  cancelled: { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled' },
  'no-show': { color: '#f59e0b', bg: '#fffbeb', label: 'No-show' } }

// ─── BOOKING MODAL ─────────────────────────────────────────────────
function BookingModal({ zone, onClose, onBooked }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [seats, setSeats] = useState([])
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [startTime, setStartTime] = useState('14:00')
  const [endTime, setEndTime] = useState('16:00')
  const [purpose, setPurpose] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSeats, setLoadingSeats] = useState(true)

  const fetchAvailability = async () => {
    setLoadingSeats(true)
    try {
      const { data } = await api.get(`/library/zones/${zone._id}/availability?date=${date}`)
      setSeats(data.seats)
    } catch { toast.error('Failed to load seats') } finally { setLoadingSeats(false) }
  }

  useEffect(() => { fetchAvailability() }, [date])

  const isSeatBookedAtTime = (seat) => {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const s = toMin(startTime), e = toMin(endTime)
    return seat.bookedSlots?.some(slot => {
      const bs = toMin(slot.startTime), be = toMin(slot.endTime)
      return s < be && e > bs
    })
  }

  const maxRow = Math.max(...seats.map(s => s.row || 1), 1)
  const maxCol = Math.max(...seats.map(s => s.col || 1), 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSeat) return toast.error('Select a seat')
    setLoading(true)
    try {
      const { data } = await api.post('/library/bookings', {
        zoneId: zone._id, seatNumber: selectedSeat,
        date, startTime, endTime, purpose })
      toast.success('Seat booked! 🎉')
      onBooked(data.booking)
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{zone.name}</h2>
              <p className="text-xs text-gray-400">{zone.floor} · {zone.capacity} seats</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Seat map */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Select a seat</p>
          {loadingSeats ? (
            <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-3 overflow-x-auto">
                <div className="grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(32px, 1fr))`, maxWidth: `${maxCol * 40}px` }}>
                  {seats.map(seat => {
                    const booked = isSeatBookedAtTime(seat)
                    const isSelected = selectedSeat === seat.seatNumber
                    return (
                      <button key={seat.seatNumber} type="button"
                        disabled={booked || !seat.isActive}
                        onClick={() => setSelectedSeat(seat.seatNumber)}
                        title={seat.seatNumber}
                        className={`aspect-square rounded-lg text-[9px] font-bold flex items-center justify-center transition-all relative
                          ${isSelected ? 'bg-indigo-600 text-white scale-110' : booked || !seat.isActive ? 'bg-red-100 dark:bg-red-900/30 text-red-400 cursor-not-allowed' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'}`}>
                        {seat.seatNumber}
                        {seat.hasPowerOutlet && <Plug size={7} className="absolute -top-0.5 -right-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4 text-[10px]">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-green-200 dark:bg-green-900/50 rounded" /> Available</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-200 dark:bg-red-900/50 rounded" /> Booked</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-indigo-600 rounded" /> Selected</span>
                <span className="flex items-center gap-1"><Plug size={9} /> Power outlet</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <input value={purpose} onChange={e => setPurpose(e.target.value)}
              placeholder="What are you working on? (optional)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />

            <button type="submit" disabled={loading || !selectedSeat}
              className="w-full py-3 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors">
              {loading ? 'Booking...' : selectedSeat ? `Book Seat ${selectedSeat}` : 'Select a seat first'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── TICKET MODAL ──────────────────────────────────────────────────
function TicketModal({ booking, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 text-center bg-gradient-to-br from-indigo-600 to-purple-600">
          <CheckCircle size={32} className="text-white mx-auto mb-2" />
          <p className="text-white font-bold">Booking Confirmed!</p>
        </div>
        <div className="p-6 text-center">
          <div className="inline-block p-3 bg-white rounded-xl border mb-4">
            <QRCodeSVG value={booking.qrCode} size={160} level="H" />
          </div>
          <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-4">{booking.qrCode}</p>
          <div className="text-left space-y-1.5 text-sm">
            <p><span className="text-gray-400">Zone:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{booking.zone?.name}</span></p>
            <p><span className="text-gray-400">Seat:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{booking.seatNumber}</span></p>
            <p><span className="text-gray-400">Date:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{booking.date}</span></p>
            <p><span className="text-gray-400">Time:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{booking.startTime} - {booking.endTime}</span></p>
          </div>
          <p className="text-xs text-gray-400 mt-4">Show this QR at the library entrance to check in</p>
          <button onClick={onClose} className="w-full mt-4 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function LibraryBooking() {
  useSection('notes')
  const [zones, setZones] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(null)
  const [showTicket, setShowTicket] = useState(null)
  const [tab, setTab] = useState('zones')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [zonesRes, bookingsRes] = await Promise.all([
        api.get('/library/zones'),
        api.get('/library/bookings'),
      ])
      setZones(zonesRes.data.zones)
      setMyBookings(bookingsRes.data.bookings)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.patch(`/library/bookings/${id}/cancel`)
      toast.success('Cancelled')
      fetchData()
    } catch { toast.error('Failed') }
  }

  const upcomingBookings = myBookings.filter(b => ['upcoming', 'checked-in'].includes(b.status))
  const pastBookings = myBookings.filter(b => ['completed', 'cancelled', 'no-show'].includes(b.status))

  return (
    <Layout>
      <AnimatePresence>
        {showBooking && (
          <BookingModal zone={showBooking} onClose={() => setShowBooking(null)}
            onBooked={(booking) => { setShowTicket(booking); fetchData() }} />
        )}
        {showTicket && <TicketModal booking={showTicket} onClose={() => setShowTicket(null)} />}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Library Seat Booking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Reserve a study spot in advance</p>
        </div>

        <div className="flex gap-2 mb-5">
          {[{ id: 'zones', label: 'Browse Zones' }, { id: 'bookings', label: `My Bookings (${upcomingBookings.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
        ) : tab === 'zones' ? (
          zones.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <BookOpen size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No library zones set up yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {zones.map(zone => (
                <motion.div key={zone._id} whileHover={{ y: -3 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setShowBooking(zone)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{typeIcons[zone.type]}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{zone.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {zone.floor}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-700" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Users size={11} /> {zone.capacity} seats</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {zone.openTime}-{zone.closeTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.amenities?.map(a => (
                      <span key={a} className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <Calendar size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No bookings yet</p>
              </div>
            ) : (
              <>
                {upcomingBookings.map(b => {
                  const conf = statusConfig[b.status]
                  return (
                    <div key={b._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${b.zone?.color}15` }}>
                        <span className="text-lg">{typeIcons[b.zone?.type]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{b.zone?.name} — Seat {b.seatNumber}</p>
                        <p className="text-xs text-gray-400">{b.date} · {b.startTime}-{b.endTime}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: conf.bg, color: conf.color }}>
                        {conf.label}
                      </span>
                      <button onClick={() => setShowTicket(b)} className="text-indigo-500 hover:text-indigo-600 shrink-0">
                        <QrCode size={16} />
                      </button>
                      {b.status === 'upcoming' && (
                        <button onClick={() => handleCancel(b._id)} className="text-gray-300 hover:text-red-500 shrink-0 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )
                })}
                {pastBookings.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-6 mb-2">History</p>
                    {pastBookings.slice(0, 10).map(b => {
                      const conf = statusConfig[b.status]
                      return (
                        <div key={b._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3 opacity-70">
                          <span className="text-base">{typeIcons[b.zone?.type]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{b.zone?.name} — Seat {b.seatNumber}</p>
                            <p className="text-[10px] text-gray-400">{b.date}</p>
                          </div>
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: conf.bg, color: conf.color }}>{conf.label}</span>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}