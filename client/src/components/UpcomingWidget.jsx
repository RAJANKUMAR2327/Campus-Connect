import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function UpcomingWidget() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/calendar/upcoming')
        setData(data)
      } catch {}
    }
    fetch()
  }, [])

  if (!data) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today & Upcoming</h3>
        <Link to="/calendar" className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
          View all <ChevronRight size={12} />
        </Link>
      </div>

      {data.todayClasses.length === 0 && data.upcomingEvents.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">Nothing scheduled</p>
      ) : (
        <div className="space-y-2">
          {data.todayClasses.slice(0, 3).map(c => (
            <div key={c._id} className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-gray-600 dark:text-gray-400 font-medium">{c.startTime}</span>
              <span className="text-gray-900 dark:text-gray-100 truncate">{c.subject}</span>
            </div>
          ))}
          {data.upcomingEvents.slice(0, 3).map(e => (
            <div key={e._id} className="flex items-center gap-2 text-xs">
              <CalendarIcon size={11} className="text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-gray-100 truncate flex-1">{e.title}</span>
              <span className="text-gray-400">{new Date(e.startDate).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}