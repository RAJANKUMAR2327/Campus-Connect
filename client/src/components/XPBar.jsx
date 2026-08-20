import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { Flame, Zap } from 'lucide-react'

export default function XPBar() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/gamification/my-stats')
        setStats(data.stats)
      } catch {}
    }
    fetch()
  }, [])

  if (!stats) return null

  return (
    <Link to="/leaderboard" className="block px-3 py-2.5 mx-1 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-indigo-500" />
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Lvl {stats.level}</span>
        </div>
        {stats.streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={11} className="text-orange-500" />
            <span className="text-xs font-semibold text-orange-500">{stats.streak}</span>
          </div>
        )}
      </div>
      <div className="h-1.5 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stats.progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>
      <p className="text-[9px] text-gray-400 mt-1">{stats.currentXP}/{stats.neededXP} XP</p>
    </Link>
  )
}