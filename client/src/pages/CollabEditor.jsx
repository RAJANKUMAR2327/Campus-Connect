import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useSocketStore from '../store/socketStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Share2, Users, Copy,
  Check, X, Globe, Lock,
  Bold, Italic, List, Heading1,
  UserMinus, Loader } from 'lucide-react'

export default function CollabEditor() {
  useSection('notes')
  const { docId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { socket } = useSocketStore()

  const [doc, setDoc] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeEditors, setActiveEditors] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({})

  const textareaRef = useRef()
  const saveTimeoutRef = useRef()
  const isLocalChange = useRef(false)

  // Fetch document
  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/collab-docs/${docId}`)
        setDoc(data.doc)
        setContent(data.doc.content || '')
        setTitle(data.doc.title)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load document')
        navigate('/notes/collab')
      } finally { setLoading(false) }
    }
    fetchDoc()
  }, [docId])

  // Socket setup
  useEffect(() => {
    if (!socket || !docId) return

    socket.emit('join_doc', { docId })

    const handleEditors = (editors) => setActiveEditors(editors)

    const handleUpdate = ({ content: newContent, title: newTitle, editedBy }) => {
      if (editedBy.id !== user?.id) {
        isLocalChange.current = false
        setContent(newContent)
        if (newTitle) setTitle(newTitle)
      }
    }

    const handleCursor = ({ userId, name, cursorPos, color }) => {
      if (userId === user?.id) return
      setRemoteCursors(prev => ({ ...prev, [userId]: { name, cursorPos, color } }))
    }

    socket.on('doc_editors', handleEditors)
    socket.on('doc_updated', handleUpdate)
    socket.on('cursor_updated', handleCursor)

    return () => {
      socket.emit('leave_doc', { docId })
      socket.off('doc_editors', handleEditors)
      socket.off('doc_updated', handleUpdate)
      socket.off('cursor_updated', handleCursor)
    }
  }, [socket, docId, user])

  // Broadcast change + debounced save
  const broadcastChange = useCallback((newContent, newTitle) => {
    if (socket) {
      socket.emit('doc_change', { docId, content: newContent, title: newTitle })
    }
    setSaving(true)
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => setSaving(false), 600)
  }, [socket, docId])

  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    broadcastChange(newContent, title)
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    broadcastChange(content, newTitle)
  }

  const handleCursorMove = () => {
    if (!textareaRef.current || !socket) return
    const pos = textareaRef.current.selectionStart
    socket.emit('cursor_move', { docId, cursorPos: pos })
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(doc.shareCode)
    setCopied(true)
    toast.success('Share code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePublic = async () => {
    try {
      const { data } = await api.patch(`/collab-docs/${docId}/public`)
      setDoc(prev => ({ ...prev, isPublic: data.isPublic }))
      toast.success(data.isPublic ? 'Document is now public' : 'Document is now private')
    } catch { toast.error('Failed') }
  }

  const handleRemoveCollaborator = async (userId) => {
    try {
      await api.delete(`/collab-docs/${docId}/collaborators/${userId}`)
      setDoc(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c.user?._id !== userId) }))
      toast.success('Collaborator removed')
    } catch { toast.error('Failed') }
  }

  const insertFormat = (prefix, suffix = prefix) => {
    const ta = textareaRef.current
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end)
    setContent(newContent)
    broadcastChange(newContent, title)
  }

  const isOwner = doc?.owner?._id === user?.id
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-indigo-400" /></div>
      </Layout>
    )
  }

  return (
    <Layout>
      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Share Document</h2>
                <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
              </div>

              {/* Share code */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Share Code</p>
                <div className="flex gap-2">
                  <input readOnly value={doc.shareCode}
                    className="flex-1 px-3 py-2.5 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  <button onClick={copyShareLink}
                    className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Anyone with this code can join as an editor</p>
              </div>

              {/* Public toggle */}
              {isOwner && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                  <div className="flex items-center gap-2">
                    {doc.isPublic ? <Globe size={15} className="text-green-500" /> : <Lock size={15} className="text-gray-400" />}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {doc.isPublic ? 'Anyone can view' : 'Private document'}
                    </span>
                  </div>
                  <button onClick={togglePublic}
                    className={`relative w-10 h-5 rounded-full transition-colors ${doc.isPublic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${doc.isPublic ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              )}

              {/* Collaborators list */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Collaborators ({doc.collaborators?.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {doc.collaborators?.map(c => (
                    <div key={c.user?._id || c._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                        {c.user?.avatar
                          ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{c.user?.name?.charAt(0) || '?'}</div>
                        }
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1 truncate">{c.user?.name || 'Deleted User'}</p>
                      {c.user?._id && c.user._id === doc.owner?._id ? (
                        <span className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2 py-0.5 rounded-full">Owner</span>
                      ) : isOwner ? (
                        <button onClick={() => handleRemoveCollaborator(c.user?._id)}
                          className="text-gray-300 hover:text-red-500 transition-colors">
                          <UserMinus size={13} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/notes/collab')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-3">
            {/* Active editors */}
            <div className="flex -space-x-2">
              {activeEditors.slice(0, 5).map((ed, i) => (
                <div key={i} title={ed.name}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-950 overflow-hidden"
                  style={{ borderColor: ed.color }}>
                  {ed.avatar
                    ? <img src={ed.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: ed.color }}>{ed.name?.charAt(0)}</div>
                  }
                </div>
              ))}
            </div>

            {/* Save status */}
            <span className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1">
              {saving ? <><Loader size={11} className="animate-spin" /> Saving...</> : <><Check size={11} className="text-green-500" /> Saved</>}
            </span>

            <button onClick={() => setShowShare(true)}
              className="flex items-center gap-2 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Title */}
          <div className="px-6 pt-6 pb-2">
            <input
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              className="w-full text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-700"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-100 dark:border-gray-800">
            {[
              { icon: Bold, action: () => insertFormat('**'), label: 'Bold' },
              { icon: Italic, action: () => insertFormat('*'), label: 'Italic' },
              { icon: Heading1, action: () => insertFormat('# '), label: 'Heading' },
              { icon: List, action: () => insertFormat('- '), label: 'List' },
            ].map(({ icon: Icon, action, label }) => (
              <button key={label} onClick={action} title={label}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Icon size={15} />
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">{wordCount} words</span>
          </div>

          {/* Content textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleCursorMove}
              onKeyUp={handleCursorMove}
              onClick={handleCursorMove}
              placeholder="Start typing... (Markdown supported: **bold**, *italic*, # heading, - list)"
              className="w-full min-h-[60vh] px-6 py-4 text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Active editors info bar */}
        {activeEditors.length > 1 && (
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-600">
            <Users size={12} />
            {activeEditors.length} people editing right now
          </div>
        )}
      </div>
    </Layout>
  )
}