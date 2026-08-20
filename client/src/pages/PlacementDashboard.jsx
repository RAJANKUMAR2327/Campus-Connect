import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import {
  TrendingUp, Award, Building, Users,
  Plus, X, Briefcase } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function AddStatModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    company: '', role: '', package: '',
    branch: '', year: new Date().getFullYear(), type: 'oncampus' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/placement-stats', form)
      toast.success('Placement data added!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Placement Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Company *" required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <input placeholder="Role / Position"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Package (LPA)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.package} onChange={e => setForm(f => ({ ...f, package: e.target.value }))} />
            <input placeholder="Branch (e.g. CSE)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Year (e.g. 2024)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            <select
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="oncampus">On Campus</option>
              <option value="offcampus">Off Campus</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PlacementDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/placement-stats/dashboard')
      setData(data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  return (
    <Layout>
      {showModal && (
        <AddStatModal onClose={() => setShowModal(false)} onSuccess={fetchDashboard} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Placement Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Campus placement analytics</p>
        </div>
        <div className="flex gap-3">
          <Link to="/placement"
            className="text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Placement Posts
          </Link>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={15} /> Add Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={Users} label="Total Placements"
              value={data.summary.totalPlacements}
              sub="Across all branches"
              color="bg-indigo-500"
            />
            <StatCard
              icon={TrendingUp} label="Average Package"
              value={`${data.summary.avgPackage} LPA`}
              sub="Mean CTC offered"
              color="bg-green-500"
            />
            <StatCard
              icon={Award} label="Highest Package"
              value={`${data.summary.maxPackage} LPA`}
              sub="Best offer received"
              color="bg-amber-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Companies */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Building size={16} className="text-indigo-500" /> Top Recruiting Companies
              </h3>
              {data.topCompanies.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topCompanies} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-bg, #fff)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Package Distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" /> Package Distribution
              </h3>
              {data.packageRanges.every(r => r.count === 0) ? (
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.packageRanges.filter(r => r.count > 0)}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ range, percent }) =>
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                      }
                    >
                      {data.packageRanges.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px' }}
                    />
                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Branch-wise + Year Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Branch Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Branch-wise Placements
              </h3>
              {data.branchStats.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.branchStats.sort((a, b) => b.count - a.count).map((b, i) => (
                    <div key={b.branch}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{b.branch}</span>
                        <span className="text-gray-500 dark:text-gray-400">{b.count} placed</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(b.count / Math.max(...data.branchStats.map(x => x.count))) * 100}%`,
                            background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Year Trend */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Year-wise Trend
              </h3>
              {data.yearTrend.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.yearTrend}>
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* No data CTA */}
          {data.summary.totalPlacements === 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900 p-6 text-center">
              <Briefcase size={32} className="mx-auto text-indigo-400 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                No placement data yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Be the first to add your college's placement statistics!
              </p>
              <button onClick={() => setShowModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Add Placement Data
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}