import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Layout from '../components/Layout'
import { Calendar, MapPin, Loader, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'

export default function EventTicket() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/${id}`)
        setEvent(data.event)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader size={28} className="animate-spin text-indigo-400" />
        </div>
      </Layout>
    )
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="text-center py-24">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Event not found</h1>
          <Link to="/events" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">Back to Events</Link>
        </div>
      </Layout>
    )
  }

  const isAttending = event.attendees?.some(a => (a._id || a) === user?._id)
  const ticketCode = `${event._id}:${user?._id}`

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6">
          <ArrowLeft size={16} /> Back to Events
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
            {isAttending && (
              <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium mb-3">
                <CheckCircle size={12} /> Registered
              </div>
            )}
            <h1 className="text-xl font-bold">{event.title}</h1>
            <p className="text-sm text-white/80 mt-1">{event.category}</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <span>{new Date(event.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <span>{event.venue}</span>
              </div>
            )}

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-6 flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <QRCodeSVG value={ticketCode} size={160} />
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Show this code at the entrance for check-in
              </p>
              <p className="text-[10px] text-gray-300 mt-1 font-mono">{ticketCode}</p>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Attendee</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</span>
              </div>
              {event.organizer && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Organized by</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{event.organizer}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
