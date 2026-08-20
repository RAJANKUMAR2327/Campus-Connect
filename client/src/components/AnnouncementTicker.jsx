import { motion } from 'framer-motion'
import { Megaphone } from 'lucide-react'

/**
 * A smooth, continuously-scrolling ticker bar for short notices
 * (exam schedules, placement drives, holidays, workshop registrations).
 * Pass an array of plain strings.
 */
export default function AnnouncementTicker({ items = [] }) {
  if (items.length === 0) return null

  // Duplicate the list so the loop appears seamless
  const looped = [...items, ...items]

  return (
    <div className="relative overflow-hidden bg-indigo-600 dark:bg-indigo-700 rounded-xl mb-6 flex items-center">
      <div className="flex items-center gap-2 bg-indigo-700 dark:bg-indigo-800 px-4 py-2.5 shrink-0 z-10">
        <Megaphone size={14} className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wide">Notices</span>
      </div>
      <div className="flex-1 overflow-hidden py-2.5">
        <motion.div
          className="flex gap-10 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: items.length * 6, repeat: Infinity, ease: 'linear' }}
        >
          {looped.map((text, i) => (
            <span key={i} className="text-sm text-white/90 px-2">
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
