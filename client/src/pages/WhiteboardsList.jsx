import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import { PenTool, Plus, X, Trash2, Link as LinkIcon, Users } from 'lucide-react'

function JoinModal({ onClose }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post(`/whiteboards/join/${code}`)
      navigate(`/whiteboards/${data.boardId}`)
      onClose()
    } catch { toast.error('Invalid code') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Join Whiteboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleJoin}>
          <input value={code} onChange={e => setCode(e.target.value)} required placeholder="Enter share code"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />
          <button type="submit" disabled={loading} className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">{loading ? 'Joining...' : 'Join'}</button>
        </form>
      </motion.div>
    </div>
  )
}

export default function WhiteboardsList() {
  useSection('notes')
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)

  const fetchBoards = async () => {
    setLoading(true)
    try { const { data } = await api.get('/whiteboards'); setBoards(data.boards) } catch { toast.error('Failed') } finally { setLoading(false) }
  }
  useEffect(() => { fetchBoards() }, [])

  const handleCreate = async () => {
    try { const { data } = await api.post('/whiteboards', { title: 'Untitled Board' }); navigate(`/whiteboards/${data.board._id}`) } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this whiteboard?')) return
    try { await api.delete(`/whiteboards/${id}`); toast.success('Deleted!'); fetchBoards() } catch { toast.error('Failed') }
  }

  return (
    <Layout>
      <AnimatePresence>{showJoin && <JoinModal onClose={() => setShowJoin(false)} />}</AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Whiteboards</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Collaborate visually in real-time</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><LinkIcon size={14} /> Join via Code</button>
          <button onClick={handleCreate} className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all" style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}><Plus size={15} /> New Whiteboard</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-32 animate-pulse" />)}</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <PenTool size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No whiteboards yet</p>
          <button onClick={handleCreate} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Create your first whiteboard</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <motion.div key={board._id} whileHover={{ y: -3 }} onClick={() => navigate(`/whiteboards/${board._id}`)}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"><PenTool size={18} className="text-indigo-500" /></div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(board._id) }} className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">{board.title}</h3>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-gray-400"><Users size={10} /> {board.collaborators?.length} collaborators</span>
                <span className="text-[10px] text-gray-400">{new Date(board.updatedAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  )
}