import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  FileText, Plus,
  Clock, Trash2, X, Link as LinkIcon } from 'lucide-react'

function JoinModal({ onClose }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post(`/collab-docs/join/${code}`)
      toast.success('Joined!')
      navigate(`/notes/collab/${data.docId}`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Join Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleJoin}>
          <input value={code} onChange={e => setCode(e.target.value)} required
            placeholder="Enter share code"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />
          <button type="submit" disabled={loading}
            className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors">
            {loading ? 'Joining...' : 'Join Document'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function CollabNotes() {
  useSection('notes')
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/collab-docs')
      setDocs(data.docs)
    } catch { toast.error('Failed to load documents') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleCreate = async () => {
    try {
      const { data } = await api.post('/collab-docs', { title: 'Untitled Document' })
      navigate(`/notes/collab/${data.doc._id}`)
    } catch { toast.error('Failed to create document') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/collab-docs/${id}`)
      toast.success('Deleted!')
      fetchDocs()
    } catch { toast.error('Failed') }
  }

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <Layout>
      <AnimatePresence>{showJoin && <JoinModal onClose={() => setShowJoin(false)} />}</AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Collaborative Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Edit notes together in real-time</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <LinkIcon size={14} /> Join via Code
          </button>
          <button onClick={handleCreate}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
            style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Plus size={15} /> New Document
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-32 animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No documents yet</p>
          <button onClick={handleCreate} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Create your first collaborative note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <motion.div key={doc._id} whileHover={{ y: -3 }}
              onClick={() => navigate(`/notes/collab/${doc._id}`)}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-indigo-500" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(doc._id) }}
                  className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">{doc.title}</h3>
              {doc.subject && <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">{doc.subject}</p>}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                <div className="flex -space-x-1.5">
                  {doc.collaborators?.slice(0, 3).map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden">
                      {c.user?.avatar
                        ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-indigo-400 flex items-center justify-center text-white text-[9px] font-bold">{c.user?.name?.charAt(0)}</div>
                      }
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock size={10} /> {timeAgo(doc.updatedAt)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  )
}