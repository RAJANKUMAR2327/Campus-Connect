import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  Send, Bot, User, Sparkles,
  RotateCcw, CheckCircle, X,
  Briefcase, Code, Users as UsersIcon, Award } from 'lucide-react'

const interviewTypes = [
  { id: 'technical', label: 'Technical', icon: Code, desc: 'DSA, system design, coding' },
  { id: 'hr', label: 'HR Round', icon: UsersIcon, desc: 'Behavioral, culture fit' },
  { id: 'resume', label: 'Resume-based', icon: Briefcase, desc: 'Based on your experience' },
  { id: 'case-study', label: 'Case Study', icon: Award, desc: 'Problem-solving scenarios' },
]

export default function AIMockInterview() {
  useSection('placement')
  const [setupDone, setSetupDone] = useState(false)
  const [interviewType, setInterviewType] = useState('technical')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const systemPrompt = `You are an expert technical interviewer conducting a ${interviewType} mock interview for the role of ${role || 'Software Engineer'}${company ? ` at ${company}` : ''}.

Rules:
- Ask ONE question at a time, never multiple
- Wait for the candidate's answer before asking the next question
- After their answer, give brief (1-2 sentence) constructive feedback, then ask the next question
- Keep questions realistic and progressively challenging
- After exactly 6 questions, say "INTERVIEW_COMPLETE" and give a final summary with strengths, areas to improve, and an overall rating out of 10
- Be encouraging but honest, like a real interviewer
- Keep your responses concise`

  const startInterview = async () => {
    setSetupDone(true)
    setLoading(true)
    try {
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: "Hi, I'm ready to start the mock interview." }] })
      const reply = data.content?.[0]?.text || 'Welcome! Let\'s begin.'
      setMessages([{ role: 'assistant', content: reply }])
      setQuestionCount(1)
    } catch { toast.error('Failed to start interview') } finally { setLoading(false) }
  }

  const sendAnswer = async () => {
    if (!input.trim()) return
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const history = [...messages, { role: 'user', content: userMsg }]
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: history })
      const reply = data.content?.[0]?.text || ''

      if (reply.includes('INTERVIEW_COMPLETE')) {
        setFinished(true)
        setFeedback(reply.replace('INTERVIEW_COMPLETE', '').trim())
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        setQuestionCount(prev => prev + 1)
      }
    } catch { toast.error('Failed to get response') } finally { setLoading(false) }
  }

  const handleRestart = () => {
    setSetupDone(false)
    setMessages([])
    setQuestionCount(0)
    setFinished(false)
    setFeedback(null)
  }

  if (!setupDone) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles size={20} className="text-white" /></div>
            <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Mock Interview</h1><p className="text-xs text-gray-500 dark:text-gray-400">Practice with AI, get real feedback</p></div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Interview Type</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {interviewTypes.map(t => (
                <button key={t.id} onClick={() => setInterviewType(t.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${interviewType === t.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-800'}`}>
                  <t.icon size={16} className="text-purple-500" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t.label}</span>
                  <span className="text-[10px] text-gray-400">{t.desc}</span>
                </button>
              ))}
            </div>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Target role (e.g. SDE-1)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3" />
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Target company (optional)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4" />
            <button onClick={startInterview} className="w-full py-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 font-semibold transition-opacity">
              Start Mock Interview
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (finished) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4"><CheckCircle size={20} className="text-green-500" /><h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Interview Complete!</h2></div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">{feedback}</div>
            <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors">
              <RotateCcw size={14} /> Practice Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles size={16} className="text-white" /></div>
            <div><p className="text-sm font-bold text-gray-900 dark:text-gray-100">Mock Interview</p><p className="text-xs text-gray-400">Question {questionCount}/6</p></div>
          </div>
          <button onClick={handleRestart} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"><X size={13} /> End</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Bot size={14} className="text-white" /></div>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 flex gap-1">
                {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer() } }}
            placeholder="Type your answer..." rows={2} disabled={loading}
            className="w-full text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none placeholder-gray-400" />
          <div className="flex justify-end mt-2">
            <button onClick={sendAnswer} disabled={loading || !input.trim()}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}