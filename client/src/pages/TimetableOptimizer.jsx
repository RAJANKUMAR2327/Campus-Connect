import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { AlertTriangle, CheckCircle2, Clock, Loader, Sparkles } from 'lucide-react'

const DAYS = [
  { num: 1, label: 'Monday' },
  { num: 2, label: 'Tuesday' },
  { num: 3, label: 'Wednesday' },
  { num: 4, label: 'Thursday' },
  { num: 5, label: 'Friday' },
  { num: 6, label: 'Saturday' },
]

const DAY_START = 8 * 60   // 8:00 AM
const DAY_END = 18 * 60    // 6:00 PM

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const fmt = (mins) => {
  const h24 = Math.floor(mins / 60)
  const m = mins % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`
}

export default function TimetableOptimizer() {
  useSection('dashboard')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(60)

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const { data } = await api.get('/calendar/timetable')
        setEntries(data.entries || [])
      } catch {
        toast.error('Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }
    fetchTimetable()
  }, [])

  const byDay = (day) => entries
    .filter(e => e.dayOfWeek === day)
    .slice()
    .sort((a, b) => toMin(a.startTime) - toMin(b.startTime))

  // Conflicts: overlapping entries on the same day
  const conflictsByDay = {}
  DAYS.forEach(({ num }) => {
    const dayEntries = byDay(num)
    const conflicts = []
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const a = dayEntries[i], b = dayEntries[j]
        if (toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime)) {
          conflicts.push([a, b])
        }
      }
    }
    conflictsByDay[num] = conflicts
  })
  const totalConflicts = Object.values(conflictsByDay).reduce((s, c) => s + c.length, 0)

  // Free slots per day within the 8am–6pm window
  const freeSlotsByDay = {}
  DAYS.forEach(({ num }) => {
    const dayEntries = byDay(num)
    const slots = []
    let cursor = DAY_START
    for (const e of dayEntries) {
      const start = toMin(e.startTime)
      const end = toMin(e.endTime)
      if (start > cursor) slots.push({ start: cursor, end: Math.min(start, DAY_END) })
      cursor = Math.max(cursor, end)
    }
    if (cursor < DAY_END) slots.push({ start: cursor, end: DAY_END })
    freeSlotsByDay[num] = slots.filter(s => s.end - s.start > 0)
  })

  // Slots that fit the requested duration
  const suggestions = DAYS.flatMap(({ num, label }) =>
    freeSlotsByDay[num]
      .filter(s => s.end - s.start >= Number(duration))
      .map(s => ({ day: label, dayNum: num, ...s }))
  )

  return (
    <Layout>
      <PageHeader
        title="Timetable Optimizer"
        subtitle="Find scheduling clashes and free study slots in your weekly timetable"
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">No timetable entries yet.</p>
          <p className="text-xs text-gray-400 mt-1">Add your weekly classes from the Calendar page's Timetable view first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Conflicts */}
          <div className={`rounded-2xl border p-5 ${totalConflicts > 0
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
            : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'}`}>
            <div className="flex items-center gap-2 mb-3">
              {totalConflicts > 0
                ? <AlertTriangle size={18} className="text-red-500" />
                : <CheckCircle2 size={18} className="text-green-500" />}
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {totalConflicts > 0 ? `${totalConflicts} scheduling conflict${totalConflicts !== 1 ? 's' : ''} found` : 'No scheduling conflicts'}
              </h2>
            </div>
            {totalConflicts > 0 && (
              <div className="space-y-2">
                {DAYS.map(({ num, label }) => conflictsByDay[num].map(([a, b], i) => (
                  <div key={`${num}-${i}`} className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg px-3 py-2">
                    <span className="font-semibold">{label}:</span> "{a.subject}" ({a.startTime}–{a.endTime}) overlaps with "{b.subject}" ({b.startTime}–{b.endTime})
                  </div>
                )))}
              </div>
            )}
          </div>

          {/* Free slot finder */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Find a free slot</h2>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs text-gray-500 dark:text-gray-400">Duration needed:</label>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>

            {suggestions.length === 0 ? (
              <p className="text-sm text-gray-400">No free slots of that length between 8 AM and 6 PM. Try a shorter duration.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2.5">
                    <Clock size={14} className="text-indigo-500 shrink-0" />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{s.day}</span>
                      <span className="text-gray-500 dark:text-gray-400"> · {fmt(s.start)} – {fmt(s.end)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly free-time overview */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Free time per day (8 AM – 6 PM)</h2>
            <div className="space-y-3">
              {DAYS.map(({ num, label }) => {
                const totalFree = freeSlotsByDay[num].reduce((s, slot) => s + (slot.end - slot.start), 0)
                const pct = (totalFree / (DAY_END - DAY_START)) * 100
                return (
                  <div key={num}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
                      <span className="text-gray-400">{(totalFree / 60).toFixed(1)}h free</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
