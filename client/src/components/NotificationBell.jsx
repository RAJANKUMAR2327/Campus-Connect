import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom' // Added Link here
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import { Bell, CheckCheck, MessageCircle } from 'lucide-react' // Added MessageCircle here
import useSocketStore from '../store/socketStore'

const typeEmoji = {
  comment: '💬', like: '❤️', event: '📅',
  placement: '💼', lostfound: '🔍', system: 'ℹ️' }

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const { unreadMessages } = useSocketStore() // Integrated as requested
  const [unreadCount, setUnreadCount] = useState(0)
  const [shake, setShake] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const prevCountRef = useRef(0)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications.slice(0, 8))
      if (data.unreadCount > prevCountRef.current) {
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
      prevCountRef.current = data.unreadCount
      setUnreadCount(data.unreadCount)
    } catch {
      // silent fail — bell just won't update this poll cycle
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2"> {/* Added flex layout container */}
      
      {/* 1. Chat Indicator Link (Placed next to bell icon) */}
      {unreadMessages > 0 && (
        <Link to="/chat" className="relative p-2 text-gray-500 hover:text-green-500 transition-colors">
          <MessageCircle size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        </Link>
      )}

      {/* 2. Notification Bell Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <motion.div
          animate={shake ? { rotate: [0, -15, 12, -10, 8, -4, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          <Bell size={18} />
        </motion.div>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-600">No notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">{typeEmoji[notif.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <button
            onClick={() => { navigate('/notifications'); setOpen(false) }}
            className="w-full py-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}