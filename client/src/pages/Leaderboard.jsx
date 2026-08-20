import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import {
  Trophy, Flame, Award, Crown,
  Loader } from 'lucide-react'

const rankColors = {
  1: { bg: 'bg-gradient-to-br from-amber-300 to-amber-500', text: 'text-amber-900' },
  2: { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', text: 'text-gray-700' },
  3: { bg: 'bg-gradient-to-br from-orange-300 to-orange-500', text: 'text-orange-900' } }

export default function Leaderboard() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const [scope, setScope] = useState('all')

  // REACT-QUERY MIGRATION (FE-02 follow-up): purely read-only page, no
  // mutations — the simplest case in this series. Error feedback on
  // failure is now handled globally (see queryClient.js) rather than a
  // per-page toast.
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard?scope=${scope}`)
      return data
    },
  })

  const top3 = data?.leaderboard?.slice(0, 3) || []
  const rest = data?.leaderboard?.slice(3) || []

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leaderboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {data?.myRank ? `You're ranked #${data.myRank}` : 'Compete with your peers'}
            </p>
          </div>
          <div className="flex gap-2">
            {[{ id: 'all', label: 'Global' }, { id: 'college', label: 'My College' }, { id: 'branch', label: 'My Branch' }].map(s => (
              <button key={s.id} onClick={() => setScope(s.id)}
                className={`text-xs font-medium px-3 py-2 rounded-xl transition-all ${scope === s.id ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-indigo-400" /></div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, i) => {
                  const actualRank = entry.rank
                  const isFirst = actualRank === 1
                  return (
                    <motion.div key={entry.user?._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 text-center relative ${isFirst ? 'border-amber-300 dark:border-amber-700 -mt-4' : 'border-gray-100 dark:border-gray-800'}`}>
                      {isFirst && <Crown size={20} className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-400" />}
                      <div className={`w-14 h-14 rounded-full mx-auto mb-2 overflow-hidden ring-3 ${isFirst ? 'ring-amber-400' : actualRank === 2 ? 'ring-gray-300' : 'ring-orange-300'}`}>
                        {entry.user?.avatar
                          ? <img src={entry.user.avatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">{entry.user?.name?.charAt(0)}</div>
                        }
                      </div>
                      <div className={`w-7 h-7 rounded-full mx-auto -mt-8 mb-1 flex items-center justify-center text-xs font-bold relative z-10 ${rankColors[actualRank]?.bg} ${rankColors[actualRank]?.text}`}>
                        {actualRank}
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{entry.user?.name}</p>
                      <p className="text-[10px] text-gray-400 mb-1">Lvl {entry.level}</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{entry.xp} XP</p>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {rest.length === 0 && top3.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">No data yet — be the first to earn XP!</p>
                </div>
              ) : (
                rest.map(entry => {
                  const isMe = entry.user?._id === user?.id
                  return (
                    <div key={entry.user?._id}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors
                        ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-600 w-6">{entry.rank}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                        {entry.user?.avatar
                          ? <img src={entry.user.avatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">{entry.user?.name?.charAt(0)}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.user?.name} {isMe && <span className="text-indigo-500">(You)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">{entry.user?.branch} · Lvl {entry.level}</p>
                      </div>
                      {entry.streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame size={11} /> <span className="text-xs font-medium">{entry.streak}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Award size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{entry.badgeCount}</span>
                      </div>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 w-16 text-right">{entry.xp} XP</span>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}