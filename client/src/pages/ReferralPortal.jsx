import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  Briefcase, Plus, X, Building, MapPin,
  Clock, XCircle,
  Send, Loader, CheckCircle } from 'lucide-react'

function CreateReferralModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    company: '', role: '', jobUrl: '', location: '',
    workMode: 'onsite', type: 'full-time', package: '',
    description: '', eligibility: '', deadline: '', maxReferrals: 5, tags: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/referrals', { ...form, tags: JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)) })
      toast.success('Referral posted!')
      onCreated()
      onClose()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Post a Referral</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={form.company} required onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="Company *" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={form.role} required onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="Role *" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input value={form.jobUrl} onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))}
              placeholder="Job posting URL"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="grid grid-cols-3 gap-3">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
              </select>
              <select value={form.workMode} onChange={e => setForm(f => ({ ...f, workMode: e.target.value }))}
                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option value="onsite">Onsite</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option>
              </select>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Location" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.package} onChange={e => setForm(f => ({ ...f, package: e.target.value }))}
                placeholder="Package (e.g. 15 LPA)" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="number" value={form.maxReferrals} onChange={e => setForm(f => ({ ...f, maxReferrals: e.target.value }))}
                placeholder="Max referrals" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <textarea value={form.description} rows={3} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description, prep tips, what to expect..." className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <input value={form.eligibility} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))}
              placeholder="Eligibility (e.g. CSE/IT, CGPA 7+)" className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">{loading ? 'Posting...' : 'Post Referral'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function RequestModal({ referral, onClose, onSent }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/referrals/${referral._id}/request`, { message })
      toast.success('Request sent!')
      onSent()
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Request Referral</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{referral.role} at {referral.company}</p>
          <form onSubmit={handleSubmit}>
            <textarea value={message} required rows={4} onChange={e => setMessage(e.target.value)}
              placeholder="Tell them why you'd be a great fit..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4" />
            <button type="submit" disabled={loading} className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2">
              {loading ? 'Sending...' : <><Send size={14} /> Send Request</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function ReferralCard({ referral, onRequest }) {
  const spotsLeft = referral.maxReferrals - referral.referralCount
  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"><Building size={18} className="text-indigo-500" /></div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{referral.company}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{referral.role}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${spotsLeft > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
          {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
        </span>
      </div>
      {referral.package && <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">{referral.package}</p>}
      {referral.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{referral.description}</p>}
      <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
        {referral.location && <span className="flex items-center gap-1"><MapPin size={10} />{referral.location}</span>}
        <span className="capitalize">{referral.workMode}</span>
        {referral.deadline && <span className="flex items-center gap-1"><Clock size={10} />Due {new Date(referral.deadline).toLocaleDateString()}</span>}
      </div>
      {referral.eligibility && (
        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mb-3">📋 {referral.eligibility}</p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full overflow-hidden">
            {referral.referrer?.avatar ? <img src={referral.referrer.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">{referral.referrer?.name?.charAt(0)}</div>}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{referral.referrer?.name}</span>
        </div>
        <button onClick={() => onRequest(referral)} disabled={spotsLeft <= 0}
          className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          Request Referral
        </button>
      </div>
    </motion.div>
  )
}

export default function ReferralPortal() {
  useSection('placement')
  const [referrals, setReferrals] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [requestingReferral, setRequestingReferral] = useState(null)
  const [tab, setTab] = useState('browse')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [refRes, myReqRes, inReqRes] = await Promise.all([
        api.get('/referrals'),
        api.get('/referrals/my-requests'),
        api.get('/referrals/requests/incoming'),
      ])
      setReferrals(refRes.data.referrals)
      setMyRequests(myReqRes.data.requests)
      setIncomingRequests(inReqRes.data.requests)
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleRespond = async (id, action) => {
    try {
      await api.patch(`/referrals/requests/${id}`, { action })
      toast.success(`Marked as ${action}!`)
      fetchData()
    } catch { toast.error('Failed') }
  }

  const statusColors = { pending: '#f59e0b', accepted: '#3b82f6', referred: '#10b981', rejected: '#ef4444' }

  return (
    <Layout>
      <AnimatePresence>
        {showCreate && <CreateReferralModal onClose={() => setShowCreate(false)} onCreated={fetchData} />}
        {requestingReferral && <RequestModal referral={requestingReferral} onClose={() => setRequestingReferral(null)} onSent={fetchData} />}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Referral Portal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Seniors helping juniors get referred</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all" style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> Post Referral
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ id: 'browse', label: `Browse (${referrals.length})` }, { id: 'requests', label: `My Requests (${myRequests.length})` }, { id: 'incoming', label: `Incoming (${incomingRequests.filter(r => r.status === 'pending').length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : tab === 'browse' ? (
        referrals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Briefcase size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No referrals posted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {referrals.map(r => <ReferralCard key={r._id} referral={r} onRequest={setRequestingReferral} />)}
          </div>
        )
      ) : tab === 'requests' ? (
        myRequests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800"><p className="text-gray-500 dark:text-gray-400">No requests sent yet</p></div>
        ) : (
          <div className="space-y-3">
            {myRequests.map(req => (
              <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
                <div className="flex-1"><p className="text-sm font-bold text-gray-900 dark:text-gray-100">{req.referral?.role} at {req.referral?.company}</p><p className="text-xs text-gray-400">Referrer: {req.referral?.referrer?.name}</p></div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full capitalize" style={{ background: `${statusColors[req.status]}15`, color: statusColors[req.status] }}>{req.status}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        incomingRequests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800"><p className="text-gray-500 dark:text-gray-400">No incoming requests</p></div>
        ) : (
          <div className="space-y-3">
            {incomingRequests.map(req => (
              <div key={req._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                    {req.applicant?.avatar ? <img src={req.applicant.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">{req.applicant?.name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{req.applicant?.name}</p><p className="text-xs text-gray-400">{req.referral?.role} at {req.referral?.company}</p></div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full capitalize" style={{ background: `${statusColors[req.status]}15`, color: statusColors[req.status] }}>{req.status}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{req.message}</p>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(req._id, 'referred')} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"><CheckCircle size={13} /> Refer Them</button>
                    <button onClick={() => handleRespond(req._id, 'rejected')} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><XCircle size={13} /> Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </Layout>
  )
}