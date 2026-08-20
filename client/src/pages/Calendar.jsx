import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  ChevronLeft, ChevronRight, Plus, X,
  Calendar as CalendarIcon,
  Trash2, BookOpen, Briefcase,
  Bell, Users, GraduationCap, Loader,
  List, Grid3x3 } from 'lucide-react'

const typeConfig = {
  exam: { color: '#ef4444', icon: GraduationCap, label: 'Exam' },
  assignment: { color: '#f59e0b', icon: BookOpen, label: 'Assignment' },
  event: { color: '#10b981', icon: CalendarIcon, label: 'Event' },
  meeting: { color: '#3b82f6', icon: Users, label: 'Meeting' },
  reminder: { color: '#8b5cf6', icon: Bell, label: 'Reminder' },
  'study-group': { color: '#6366f1', icon: Users, label: 'Study Group' },
  placement: { color: '#06b6d4', icon: Briefcase, label: 'Placement' },
  other: { color: '#6b7280', icon: CalendarIcon, label: 'Other' } }

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6']

// ─── ADD EVENT MODAL ───────────────────────────────────────────────
function AddEventModal({ onClose, onAdded, defaultDate }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'other',
    startDate: defaultDate || new Date().toISOString().slice(0, 16),
    endDate: '', allDay: false, location: '', color: '#6366f1',
    reminderEnabled: false, reminderMinutes: 30 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/calendar/events', {
        ...form,
        reminder: JSON.stringify({ enabled: form.reminderEnabled, minutesBefore: form.reminderMinutes }) })
      toast.success('Event added!')
      onAdded()
      onClose()
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Calendar Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title *</label>
            <input value={form.title} required onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. DBMS Mid-sem Exam"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(typeConfig).map(([key, conf]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, type: key, color: conf.color }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-medium transition-all
                    ${form.type === key ? 'ring-1 ring-current' : 'border border-gray-200 dark:border-gray-700 text-gray-500'}`}
                  style={form.type === key ? { background: `${conf.color}15`, color: conf.color } : {}}>
                  <conf.icon size={14} />
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start *</label>
              <input type="datetime-local" value={form.startDate} required
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End (optional)</label>
              <input type="datetime-local" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Room 204"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <textarea value={form.description} rows={2}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.reminderEnabled}
              onChange={e => setForm(f => ({ ...f, reminderEnabled: e.target.checked }))}
              className="rounded accent-indigo-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Remind me before</span>
          </label>

          {form.reminderEnabled && (
            <select value={form.reminderMinutes} onChange={e => setForm(f => ({ ...f, reminderMinutes: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">
              {loading ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── ADD CLASS MODAL ───────────────────────────────────────────────
function AddClassModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    subject: '', type: 'lecture', dayOfWeek: 1,
    startTime: '09:00', endTime: '10:00',
    venue: '', instructor: '', color: '#6366f1' })
  const [loading, setLoading] = useState(false)

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/calendar/timetable', form)
      toast.success('Class added!')
      onAdded()
      onClose()
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Class</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject *</label>
            <input value={form.subject} required onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Operating Systems"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Day</label>
              <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                {['lecture', 'lab', 'tutorial', 'seminar'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Venue</label>
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              placeholder="LT-3"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Color</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">
              {loading ? 'Adding...' : 'Add Class'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── TIMETABLE VIEW ────────────────────────────────────────────────
function TimetableView() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am-8pm

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/calendar/timetable')
      setEntries(data.entries)
    } catch { toast.error('Failed to load timetable') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [])

  const handleDelete = async (id) => {
    try {
      await api.delete(`/calendar/timetable/${id}`)
      toast.success('Removed!')
      fetchEntries()
    } catch { toast.error('Failed') }
  }

  const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const getEntryStyle = (entry) => {
    const startMin = timeToMinutes(entry.startTime) - 8 * 60
    const endMin = timeToMinutes(entry.endTime) - 8 * 60
    const top = (startMin / 60) * 48
    const height = ((endMin - startMin) / 60) * 48
    return { top: `${top}px`, height: `${Math.max(height, 30)}px` }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> Add Class
        </button>
      </div>

      <AnimatePresence>
        {showAdd && <AddClassModal onClose={() => setShowAdd(false)} onAdded={fetchEntries} />}
      </AnimatePresence>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
            <div className="p-3 text-xs font-semibold text-gray-400 dark:text-gray-600">Time</div>
            {days.map(d => (
              <div key={d} className="p-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center border-l border-gray-100 dark:border-gray-800">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative" style={{ height: `${hours.length * 48}px` }}>
            <div className="grid grid-cols-7 h-full">
              <div className="relative">
                {hours.map(h => (
                  <div key={h} className="h-12 text-[10px] text-gray-400 dark:text-gray-600 pr-2 text-right border-b border-gray-50 dark:border-gray-800 flex items-start justify-end pt-1">
                    {h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`}
                  </div>
                ))}
              </div>
              {[1, 2, 3, 4, 5, 6].map(day => (
                <div key={day} className="relative border-l border-gray-50 dark:border-gray-800">
                  {hours.map(h => <div key={h} className="h-12 border-b border-gray-50 dark:border-gray-800" />)}
                  {entries.filter(e => e.dayOfWeek === day).map(entry => (
                    <div key={entry._id}
                      className="absolute left-0.5 right-0.5 rounded-lg p-1.5 overflow-hidden group cursor-pointer"
                      style={{ ...getEntryStyle(entry), background: `${entry.color}20`, borderLeft: `3px solid ${entry.color}` }}>
                      <p className="text-[9px] font-bold truncate" style={{ color: entry.color }}>{entry.subject}</p>
                      <p className="text-[8px] text-gray-500 dark:text-gray-400 truncate">{entry.venue}</p>
                      <button onClick={() => handleDelete(entry._id)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                        <Trash2 size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MONTH CALENDAR VIEW ───────────────────────────────────────────
function MonthView() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState(null)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59)
      const { data } = await api.get(`/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`)
      setEvents(data.events)
    } catch { toast.error('Failed to load events') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEvents() }, [currentMonth])

  const handleDelete = async (id) => {
    try {
      await api.delete(`/calendar/events/${id}`)
      toast.success('Deleted!')
      fetchEvents()
    } catch { toast.error('Failed') }
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eventDate = new Date(e.startDate)
      return eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 w-40 text-center">{monthName}</h2>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={() => { setSelectedDate(new Date().toISOString().slice(0, 16)); setShowAdd(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> Add Event
        </button>
      </div>

      <AnimatePresence>
        {showAdd && <AddEventModal defaultDate={selectedDate} onClose={() => setShowAdd(false)} onAdded={fetchEvents} />}
      </AnimatePresence>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-600 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(firstDayOfWeek)].map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1
            const dayEvents = getEventsForDay(day)
            return (
              <button key={day}
                onClick={() => setSelectedDayEvents({ day, events: dayEvents })}
                className={`aspect-square p-1 rounded-xl border text-left transition-all relative
                  ${isToday(day) ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}>
                <span className={`text-xs font-medium ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day}
                </span>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                  ))}
                  {dayEvents.length > 3 && <span className="text-[8px] text-gray-400">+{dayEvents.length - 3}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail popup */}
      <AnimatePresence>
        {selectedDayEvents && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDayEvents(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {monthName.split(' ')[0]} {selectedDayEvents.day}
                </h3>
                <button onClick={() => setSelectedDayEvents(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
              </div>
              {selectedDayEvents.events.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-6">No events on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.events.map(e => {
                    const conf = typeConfig[e.type] || typeConfig.other
                    return (
                      <div key={e._id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${e.color}15` }}>
                          <conf.icon size={14} style={{ color: e.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{e.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {e.location && ` · ${e.location}`}
                          </p>
                        </div>
                        {!e.readOnly && (
                          <button onClick={() => { handleDelete(e._id); setSelectedDayEvents(prev => ({ ...prev, events: prev.events.filter(ev => ev._id !== e._id) })) }}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function Calendar() {
  useSection('dashboard')
  const [view, setView] = useState('month')

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your classes, events and deadlines</p>
          </div>
          <div className="flex gap-2">
            {[{ id: 'month', icon: Grid3x3, label: 'Month' }, { id: 'timetable', icon: List, label: 'Timetable' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all ${view === v.id ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                <v.icon size={13} /> {v.label}
              </button>
            ))}
          </div>
        </div>

        {view === 'month' ? <MonthView /> : <TimetableView />}
      </div>
    </Layout>
  )
}