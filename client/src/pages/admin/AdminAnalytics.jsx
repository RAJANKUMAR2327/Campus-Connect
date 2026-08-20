import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
  Download,
  Building, Loader } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6']

function StatBox({ label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null)
  const [growth, setGrowth] = useState([])
  const [usage, setUsage] = useState([])
  const [placement, setPlacement] = useState(null)
  const [colleges, setColleges] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ov, gr, us, pl, co, hm] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/growth'),
        api.get('/admin/analytics/feature-usage'),
        api.get('/admin/analytics/placement-insights'),
        api.get('/admin/analytics/colleges'),
        api.get('/admin/analytics/heatmap'),
      ])
      setOverview(ov.data)
      setGrowth(gr.data.timeline)
      setUsage(us.data.usage)
      setPlacement(pl.data)
      setColleges(co.data.colleges)
      setHeatmap(hm.data.heatmap)
    } catch { toast.error('Failed to load analytics') } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const exportReport = async (type) => {
    try {
      const { data } = await api.get(`/admin/analytics/report/${type}`)
      const csv = convertToCSV(data.data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      toast.success('Report downloaded!')
    } catch { toast.error('Failed to export') }
  }

  const convertToCSV = (data) => {
    if (!data.length) return ''
    const headers = Object.keys(data[0]).filter(k => k !== '_id' && k !== '__v')
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    return [headers.join(','), ...rows].join('\n')
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxHeat = Math.max(...heatmap.flat(), 1)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-indigo-400" /></div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Advanced Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform-wide insights & reports</p>
        </div>
        <div className="flex gap-2">
          {['users', 'notes', 'placements', 'events'].map(type => (
            <button key={type} onClick={() => exportReport(type)}
              className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors capitalize">
              <Download size={12} /> {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ id: 'overview', label: 'Overview' }, { id: 'growth', label: 'Growth' }, { id: 'usage', label: 'Feature Usage' }, { id: 'placement', label: 'Placement' }, { id: 'engagement', label: 'Engagement' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${tab === t.id ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox label="Total Users" value={overview.totals.totalUsers.toLocaleString()} color="#6366f1" />
            <StatBox label="Weekly Active" value={`${overview.engagement.weeklyActiveRate}%`} sub={`${overview.engagement.activeWeekly} users`} color="#10b981" />
            <StatBox label="Monthly Active" value={`${overview.engagement.monthlyActiveRate}%`} sub={`${overview.engagement.activeMonthly} users`} color="#3b82f6" />
            <StatBox label="Total Messages" value={overview.totals.totalMessages.toLocaleString()} color="#8b5cf6" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Notes', val: overview.totals.totalNotes },
              { label: 'Events', val: overview.totals.totalEvents },
              { label: 'Listings', val: overview.totals.totalListings },
              { label: 'Posts', val: overview.totals.totalPosts },
              { label: 'Study Groups', val: overview.totals.totalStudyGroups },
              { label: 'Clubs', val: overview.totals.totalClubs },
              { label: 'Mentorships', val: overview.totals.totalMentorships },
              { label: 'Applications', val: overview.totals.totalApplications },
              { label: 'Library Bookings', val: overview.totals.totalBookings },
              { label: 'Rides', val: overview.totals.totalRides },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.val}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Building size={15} /> Top Colleges</h3>
            <div className="space-y-2">
              {colleges.map((c, i) => (
                <div key={c.college}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-700 dark:text-gray-300 font-medium">{c.college}</span><span className="text-gray-500">{c.userCount} users</span></div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full"><div className="h-full rounded-full" style={{ width: `${(c.userCount / colleges[0].userCount) * 100}%`, background: COLORS[i % COLORS.length] }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'growth' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">12-Month Growth Trends</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={false} name="New Users" />
              <Line type="monotone" dataKey="notes" stroke="#10b981" strokeWidth={2} dot={false} name="Notes" />
              <Line type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={2} dot={false} name="Events" />
              <Line type="monotone" dataKey="posts" stroke="#ec4899" strokeWidth={2} dot={false} name="Posts" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'usage' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Feature Usage Ranking</h3>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={usage} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="feature" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {usage.map((_, i) => <Bar key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'placement' && placement && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatBox label="Total Applications" value={placement.total} color="#6366f1" />
            <StatBox label="Offers Made" value={placement.offers} color="#10b981" />
            <StatBox label="Success Rate" value={`${placement.successRate}%`} color="#f59e0b" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Top Recruiting Companies</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={placement.topCompanies} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="company" type="category" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Branch-wise Application Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={placement.branchActivity}>
                  <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'engagement' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Heatmap (last 30 days)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-xs text-gray-400 p-1"></th>
                  {Array.from({ length: 24 }, (_, h) => <th key={h} className="text-[8px] text-gray-400 p-0.5 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row, day) => (
                  <tr key={day}>
                    <td className="text-[10px] text-gray-500 dark:text-gray-400 pr-2 font-medium">{dayLabels[day]}</td>
                    {row.map((val, hour) => (
                      <td key={hour} className="p-0.5">
                        <div className="w-4 h-4 rounded" style={{ background: `rgba(99,102,241,${val / maxHeat})` }} title={`${val} messages`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">Darker = more message activity. Based on chat messages over the last 30 days.</p>
        </div>
      )}
    </AdminLayout>
  )
}