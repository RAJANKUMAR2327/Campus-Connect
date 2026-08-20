import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

export default function CampusInsights({ stats }) {
  const kpis = [
    { label: 'Events', value: stats.events, color: 'bg-green-500' },
    { label: 'Listings', value: stats.listings, color: 'bg-pink-500' },
    { label: 'Notes', value: stats.notes, color: 'bg-indigo-500' },
  ]
  const max = Math.max(1, ...kpis.map(k => k.value))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Campus Activity</h3>
      </div>

      <div className="space-y-3">
        {kpis.map((k, i) => (
          <div key={k.label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{k.label}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{k.value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(k.value / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full ${k.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
