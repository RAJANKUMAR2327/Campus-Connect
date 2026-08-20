import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (dismissed) return
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 z-50"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Download size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Install CampusConnect</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Add to your home screen for quick, app-like access
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleInstall}
                    className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    Install
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
