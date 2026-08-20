import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { Lock } from 'lucide-react'

const rarityColors = {
  common: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
  rare: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
  epic: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
  legendary: 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' }

export default function BadgesGrid() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/gamification/my-stats')
        setData(data)
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <div className="grid grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
        {data?.badges.earned.length} of {data?.badges.earned.length + data?.badges.locked.length} badges earned
      </p>
      <div className="grid grid-cols-4 gap-3">
        {data?.badges.earned.map(badge => (
          <motion.div key={badge.badgeId}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`rounded-xl border-2 p-3 text-center ${rarityColors[badge.rarity]}`}
            title={badge.description}>
            <div className="text-2xl mb-1">{badge.icon}</div>
            <p className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">{badge.name}</p>
          </motion.div>
        ))}
        {data?.badges.locked.map(badge => (
          <div key={badge.badgeId}
            className="rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3 text-center opacity-50"
            title={badge.description}>
            <div className="text-2xl mb-1 grayscale">{badge.icon}</div>
            <p className="text-[9px] font-medium text-gray-400 dark:text-gray-600 leading-tight flex items-center justify-center gap-1">
              <Lock size={8} /> {badge.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}