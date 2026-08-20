import { useSection } from '../hooks/useSection'
import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  Send, Bot, User, Sparkles,
  FileText, Lightbulb, HelpCircle,
  BookOpen, Loader, Plus, Trash2 } from 'lucide-react'

const suggestions = [
  { icon: FileText, text: 'Summarize my notes on Operating Systems deadlocks' },
  { icon: Lightbulb, text: 'Explain the difference between TCP and UDP simply' },
  { icon: HelpCircle, text: 'Generate 5 MCQs on Database Normalization' },
  { icon: BookOpen, text: 'Create a study plan for DBMS exam in 3 days' },
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isUser
          ? 'bg-indigo-600 text-white'
          : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'}`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
        {msg.content.split('\n').map((line, i) => (
          <p key={i} className={line === '' ? 'h-2' : ''}>{line}</p>
        ))}
        {msg.loading && (
          <div className="flex gap-1 mt-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIStudyAssistant() {
  useSection('notes')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Study Assistant 🎓\n\nI can help you:\n• Summarize notes and concepts\n• Explain topics in simple terms\n• Generate practice questions\n• Create study plans\n• Answer your academic questions\n\nWhat would you like to study today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedNote, setUploadedNote] = useState(null)
  const bottomRef = useRef()
  const fileRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // Add loading placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }])

    try {
      const history = messages
        .filter(m => !m.loading)
        .map(m => ({ role: m.role, content: m.content }))

      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are an AI Study Assistant for college students in India. 
You help with:
- Summarizing academic notes and concepts
- Explaining topics clearly with examples
- Generating practice MCQs and questions
- Creating study plans
- Academic problem solving

Be concise, friendly, and use simple language. 
Format responses clearly with bullet points or numbered lists when helpful.
When generating MCQs, format them as: Q1. question \n A) \n B) \n C) \n D) \n Answer: X`,
        messages: [
          ...history,
          { role: 'user', content: userMsg }
        ] })

      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.'

      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { role: 'assistant', content: reply }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ])
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you study today?" }])
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Study Assistant</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Claude AI</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}

          {/* Suggestions — show only at start */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {suggestions.map(({ icon: Icon, text }, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-2 p-3 text-left text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
                >
                  <Icon size={14} className="text-indigo-500 shrink-0" />
                  {text}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 mt-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your studies... (Enter to send)"
            rows={2}
            disabled={loading}
            className="w-full text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Shift+Enter for new line
            </p>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}