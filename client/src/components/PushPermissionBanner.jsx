import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { Bell, X } from 'lucide-react'

export default function PushPermissionBanner() {
  const { subscribed, supported, subscribe } = usePushNotifications()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('push-banner-dismissed')
    if (supported && !subscribed && !dismissed) {
      const timer = setTimeout(() => setShow(true), 15000) // show after 15s
      return () => clearTimeout(timer)
    }
  }, [supported, subscribed])

  const handleEnable = async () => {
    await subscribe()
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('push-banner-dismissed', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Bell size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Stay updated!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Enable notifications for events, messages, and placement updates
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleEnable}
                    className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    Enable
                  </button>
                  <button onClick={handleDismiss}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                    Not now
                  </button>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-gray-300 dark:text-gray-700 hover:text-gray-500 shrink-0">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}