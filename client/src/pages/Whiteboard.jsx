import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useSocketStore from '../store/socketStore'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import { useWhiteboardCanvas } from '../hooks/useWhiteboardCanvas'
import toast from 'react-hot-toast'
import {
  Pencil, Eraser, Square, Circle, Minus, Type,
  Undo2, Trash2, Share2, Copy, Check, X,
  ArrowLeft, Download, Loader } from 'lucide-react'

const colors = ['#1f2937', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
const tools = [
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'text', icon: Type, label: 'Text' },
]

export default function WhiteboardPage() {
  useSection('notes')
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocketStore()
  const { user } = useAuthStore()

  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeEditors, setActiveEditors] = useState([])
  const [peerCursors, setPeerCursors] = useState({})
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [textInput, setTextInput] = useState(null) // { x, y } when placing text

  const wb = useWhiteboardCanvas(socket, boardId)
  const containerRef = useRef()

  // Fetch board data
  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/whiteboards/${boardId}`)
        setBoard(data.board)
      } catch (err) {
        toast.error('Failed to load whiteboard')
        navigate('/whiteboards')
      } finally { setLoading(false) }
    }
    fetchBoard()
  }, [boardId])

  // Setup canvas size + redraw initial strokes
  useEffect(() => {
    if (!board || !containerRef.current) return
    const canvas = containerRef.current.querySelector('canvas')
    if (!canvas) return

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      wb.initCanvas(canvas)
      wb.redrawAll(board.strokes || [])
    }
    resize()
    window.addEventListener('resize', resize)
    wb.setHistory(board.strokes || [])
    return () => window.removeEventListener('resize', resize)
  }, [board])

  // Socket listeners
  useEffect(() => {
    if (!socket || !boardId) return
    socket.emit('join_whiteboard', { boardId })

    const handleEditors = (editors) => setActiveEditors(editors)
    const handleDrawingPreview = (stroke) => wb.drawStroke(stroke)
    const handleCommitted = (stroke) => {
      wb.setHistory(prev => {
        const updated = [...prev, stroke]
        wb.redrawAll(updated)
        return updated
      })
    }
    const handleUndo = () => {
      wb.setHistory(prev => {
        const updated = prev.slice(0, -1)
        wb.redrawAll(updated)
        return updated
      })
    }
    const handleCleared = () => { wb.setHistory([]); wb.redrawAll([]) }
    const handleCursor = ({ userId, name, x, y, color }) => {
      if (userId === user?.id) return
      setPeerCursors(prev => ({ ...prev, [userId]: { name, x, y, color } }))
    }

    socket.on('board_editors', handleEditors)
    socket.on('stroke_drawing', handleDrawingPreview)
    socket.on('stroke_committed', handleCommitted)
    socket.on('board_undo', handleUndo)
    socket.on('board_cleared', handleCleared)
    socket.on('peer_cursor', handleCursor)

    return () => {
      socket.emit('leave_whiteboard', { boardId })
      socket.off('board_editors', handleEditors)
      socket.off('stroke_drawing', handleDrawingPreview)
      socket.off('stroke_committed', handleCommitted)
      socket.off('board_undo', handleUndo)
      socket.off('board_cleared', handleCleared)
      socket.off('peer_cursor', handleCursor)
    }
  }, [socket, boardId, user])

  const handleMouseMove = (e) => {
    wb.draw(e)
    if (socket) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      socket.emit('whiteboard_cursor', { boardId, x, y })
    }
  }

  const handleCanvasClick = (e) => {
    if (wb.tool === 'text') {
      const rect = e.currentTarget.getBoundingClientRect()
      const canvas = containerRef.current.querySelector('canvas')
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      setTextInput({ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY })
    }
  }

  const submitText = (text) => {
    if (text.trim() && textInput) wb.addTextAt(textInput.x, textInput.y, text)
    setTextInput(null)
  }

  const handleClear = () => {
    if (confirm('Clear the entire board?')) wb.clearCanvas()
  }

  const handleDownload = () => {
    const canvas = containerRef.current.querySelector('canvas')
    const link = document.createElement('a')
    link.download = `${board?.title || 'whiteboard'}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const copyShareCode = () => {
    navigator.clipboard.writeText(board.shareCode)
    setCopied(true)
    toast.success('Share code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-indigo-400" /></div></Layout>
  }

  return (
    <Layout>
      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowShare(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Share Whiteboard</h2>
                <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
              </div>
              <div className="flex gap-2 mb-2">
                <input readOnly value={board.shareCode} className="flex-1 px-3 py-2.5 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                <button onClick={copyShareCode} className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
              </div>
              <p className="text-xs text-gray-400">Anyone with this code can join and draw</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/whiteboards')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft size={16} /> {board?.title}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {activeEditors.slice(0, 5).map((ed, i) => (
                <div key={i} title={ed.name} className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: ed.color }}>
                  {ed.name?.charAt(0)}
                </div>
              ))}
            </div>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 overflow-x-auto">
          {tools.map(t => (
            <button key={t.id} onClick={() => wb.setTool(t.id)} title={t.label}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${wb.tool === t.id ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <t.icon size={16} />
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
          {colors.map(c => (
            <button key={c} onClick={() => wb.setColor(c)}
              className={`w-7 h-7 rounded-full shrink-0 transition-all ${wb.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
              style={{ background: c }} />
          ))}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
          <input type="range" min={1} max={10} value={wb.width} onChange={e => wb.setWidth(Number(e.target.value))} className="w-20 shrink-0 accent-indigo-600" />
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
          <button onClick={wb.undo} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"><Undo2 size={16} /></button>
          <button onClick={handleClear} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors shrink-0"><Trash2 size={16} /></button>
          <button onClick={handleDownload} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"><Download size={16} /></button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative">
          <canvas
            onMouseDown={wb.startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={wb.stopDrawing}
            onMouseLeave={wb.stopDrawing}
            onClick={handleCanvasClick}
            onTouchStart={wb.startDrawing}
            onTouchMove={wb.draw}
            onTouchEnd={wb.stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
            style={{ background: board?.backgroundColor || '#ffffff' }}
          />

          {/* Peer cursors */}
          {Object.entries(peerCursors).map(([userId, cursor]) => (
            <div key={userId} className="absolute pointer-events-none transition-all duration-75" style={{ left: cursor.x, top: cursor.y, transform: 'translate(-4px, -4px)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: cursor.color }} />
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white whitespace-nowrap" style={{ background: cursor.color }}>{cursor.name}</span>
            </div>
          ))}

          {/* Text input overlay */}
          {textInput && (
            <input
              autoFocus
              style={{ position: 'absolute', left: textInput.x, top: textInput.y - 10, fontSize: '16px', border: '1px dashed #6366f1', background: 'transparent', outline: 'none', color: wb.color }}
              onBlur={(e) => submitText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitText(e.target.value) }}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}