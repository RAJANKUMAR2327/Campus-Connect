import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
  Users, FileText, Calendar, ShoppingBag,
  Search, Briefcase, MessageCircle, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value?.toLocaleString()}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/admin/stats')
        setData(data)
      } catch {
        toast.error('Failed to load admin stats')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse h-28" />
          ))}
        </div>
      </AdminLayout>
    )
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: data?.stats.totalUsers, color: 'bg-indigo-500' },
    { icon: FileText, label: 'Notes', value: data?.stats.totalNotes, color: 'bg-purple-500' },
    { icon: Calendar, label: 'Events', value: data?.stats.totalEvents, color: 'bg-green-500' },
    { icon: ShoppingBag, label: 'Listings', value: data?.stats.totalListings, color: 'bg-pink-500' },
    { icon: Search, label: 'Lost & Found', value: data?.stats.totalLostFound, color: 'bg-amber-500' },
    { icon: Briefcase, label: 'Placement Posts', value: data?.stats.totalPlacements, color: 'bg-blue-500' },
    { icon: MessageCircle, label: 'Comments', value: data?.stats.totalComments, color: 'bg-teal-500' },
  ]

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> User Growth (6 months)
          </h3>
          {data?.userGrowth?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="users" stroke="#6366f1"
                  strokeWidth={2} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Branch Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Branch Distribution
          </h3>
          {data?.branchDist?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.branchDist} dataKey="count" nameKey="branch"
                  cx="50%" cy="50%" outerRadius={70}
                  label={({ branch, percent }) =>
                    percent > 0.05 ? `${branch} ${(percent * 100).toFixed(0)}%` : ''
                  }>
                  {data?.branchDist?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* College Distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Colleges</h3>
        {data?.collegeDist?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-3">
            {data?.collegeDist?.map((c, i) => (
              <div key={c.college}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{c.college}</span>
                  <span className="text-gray-500 dark:text-gray-400">{c.count} users</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(c.count / data.collegeDist[0].count) * 100}%`,
                      background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Signups</h3>
        <div className="space-y-3">
          {data?.recentUsers?.map(u => (
            <div key={u._id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {u.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${u.role === 'admin' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : u.role === 'faculty' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                  {u.role}
                </span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}