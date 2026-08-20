import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useSocketStore from '../store/socketStore'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Send, Loader, Users } from 'lucide-react'

function timeLabel(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function CampusChat() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Load (or create) the single campus-wide room, then its message history
  useEffect(() => {
    const init = async () => {
      try {
        const { data: roomData } = await api.get('/chat/campus-room')
        const convId = roomData.conversation._id
        setConversationId(convId)

        const { data: msgData } = await api.get(`/chat/messages/${convId}?page=1&limit=50`)
        setMessages(msgData.messages)
      } catch {
        toast.error('Failed to load Campus Chat')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Join the socket room and listen for new messages
  useEffect(() => {
    if (!socket || !conversationId) return

    socket.emit('join_conversation', conversationId)

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message])
    }
    socket.on('message_received', handleMessage)

    return () => {
      socket.emit('leave_conversation', conversationId)
      socket.off('message_received', handleMessage)
    }
  }, [socket, conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !conversationId) return
    setSending(true)
    try {
      if (socket) {
        socket.emit('send_message', { conversationId, content: text.trim() })
      } else {
        // Fallback if socket isn't connected
        const formData = new FormData()
        formData.append('conversationId', conversationId)
        formData.append('content', text.trim())
        const { data } = await api.post('/chat/messages', formData)
        setMessages(prev => [...prev, data.message])
      }
      setText('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Campus Chat"
        subtitle="One open room for every student on the platform"
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col" style={{ height: '65vh' }}>
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-50 dark:border-gray-800">
          <Users size={14} className="text-indigo-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Everyone on campus can see and post here</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader size={22} className="animate-spin text-indigo-400" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">No messages yet — say hello to your campus 👋</p>
          ) : (
            messages.map(m => {
              const isMine = m.sender?._id === user?._id
              return (
                <div key={m._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <img src={m.sender?.avatar || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMine && (
                      <span className="text-[11px] text-gray-400 mb-0.5 px-1">{m.sender?.name}</span>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                    }`}>
                      {m.content}
                    </div>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5 px-1">{timeLabel(m.createdAt)}</span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-50 dark:border-gray-800">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Message the whole campus..."
            maxLength={2000}
            className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={sending || !text.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 shrink-0">
            <Send size={16} />
          </button>
        </form>
      </div>
    </Layout>
  )
}
