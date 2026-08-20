import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Play, Pause, RotateCcw, Coffee, Timer, Flame, Trash2 } from 'lucide-react'

const FOCUS_MIN = 25
const BREAK_MIN = 5

function formatClock(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function StudyTimer() {
  useSection('dashboard')
  const [mode, setMode] = useState('focus') // 'focus' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MIN * 60)
  const [running, setRunning] = useState(false)
  const [subject, setSubject] = useState('')
  const [stats, setStats] = useState({ todayMinutes: 0, weekMinutes: 0, streak: 0, sessions: [] })
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/study-sessions')
      setStats(data)
    } catch {
      toast.error('Failed to load study stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const logSession = useCallback(async (durationMinutes, type) => {
    try {
      await api.post('/study-sessions', { subject: subject || undefined, durationMinutes, type })
      fetchStats()
    } catch {
      toast.error('Failed to log session')
    }
  }, [subject])

  const switchMode = useCallback((nextMode) => {
    setMode(nextMode)
    setSecondsLeft((nextMode === 'focus' ? FOCUS_MIN : BREAK_MIN) * 60)
    setRunning(false)
  }, [])

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          const finishedMode = mode
          logSession(finishedMode === 'focus' ? FOCUS_MIN : BREAK_MIN, finishedMode)
          toast.success(finishedMode === 'focus' ? 'Focus session complete! Time for a break.' : 'Break over — back to it!')
          switchMode(finishedMode === 'focus' ? 'break' : 'focus')
          return (finishedMode === 'focus' ? BREAK_MIN : FOCUS_MIN) * 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode, logSession, switchMode])

  const reset = () => {
    setRunning(false)
    setSecondsLeft((mode === 'focus' ? FOCUS_MIN : BREAK_MIN) * 60)
  }

  const deleteSession = async (id) => {
    try {
      await api.delete(`/study-sessions/${id}`)
      fetchStats()
    } catch {
      toast.error('Failed to remove session')
    }
  }

  const total = mode === 'focus' ? FOCUS_MIN * 60 : BREAK_MIN * 60
  const progress = ((total - secondsLeft) / total) * 100

  return (
    <Layout>
      <PageHeader title="Study Timer" subtitle="Pomodoro-style focus sessions with progress tracking" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <p className="text-xs text-white/70 uppercase tracking-wide">Today</p>
          <p className="text-3xl font-bold mt-1">{(stats.todayMinutes / 60).toFixed(1)}h</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">This Week</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{(stats.weekMinutes / 60).toFixed(1)}h</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Streak</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.streak}d</p>
          </div>
          <Flame size={28} className="text-amber-400" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 mb-6 flex flex-col items-center">
        <div className="flex gap-2 mb-6">
          <button onClick={() => switchMode('focus')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${mode === 'focus' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            <Timer size={13} /> Focus
          </button>
          <button onClick={() => switchMode('break')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${mode === 'break' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            <Coffee size={13} /> Break
          </button>
        </div>

        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={mode === 'focus' ? '#6366f1' : '#10b981'} strokeWidth="6"
              strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <span className="text-5xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatClock(secondsLeft)}</span>
        </div>

        {mode === 'focus' && (
          <input
            value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="What are you studying? (optional)"
            className="w-full max-w-xs text-sm text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 mb-5"
          />
        )}

        <div className="flex items-center gap-3">
          <button onClick={reset} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <RotateCcw size={16} />
          </button>
          <button onClick={() => setRunning(r => !r)}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
            {running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>
          <div className="w-11" /> {/* spacer to balance the layout */}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Sessions</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : stats.sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sessions logged yet. Start the timer above.</p>
        ) : (
          <div className="space-y-2">
            {stats.sessions.slice(0, 10).map(s => (
              <div key={s._id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.subject || 'Focus session'}</p>
                  <p className="text-xs text-gray-400">{new Date(s.completedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{s.durationMinutes}m</span>
                  <button onClick={() => deleteSession(s._id)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
