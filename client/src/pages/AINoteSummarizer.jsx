import { useSection } from '../hooks/useSection'
import { useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  FileText, Sparkles, Loader,
  Copy, Check, BookOpen } from 'lucide-react'

const outputTypes = [
  { id: 'summary', label: 'Summary', desc: 'Concise overview' },
  { id: 'bullets', label: 'Key Points', desc: 'Bullet points' },
  { id: 'flashcards', label: 'Flashcards', desc: 'Q&A format' },
  { id: 'mindmap', label: 'Mind Map', desc: 'Hierarchical outline' },
]

export default function AINoteSummarizer() {
  useSection('notes')
  const [text, setText] = useState('')
  const [outputType, setOutputType] = useState('summary')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [loadingNotes, setLoadingNotes] = useState(false)

  const fetchMyNotes = async () => {
    setLoadingNotes(true)
    try {
      const { data } = await api.get('/notes/user/my-notes')
      setNotes(data.notes || [])
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoadingNotes(false)
    }
  }

  const systemPrompts = {
    summary: 'Summarize the following academic notes into a clear, concise paragraph. Highlight the most important concepts.',
    bullets: 'Extract the key points from these notes as a well-organized bullet list. Use sub-bullets for details.',
    flashcards: 'Convert these notes into 8-10 flashcard-style Q&A pairs. Format as:\nQ: question\nA: answer\n',
    mindmap: 'Create a hierarchical text-based mind map outline from these notes. Use indentation to show hierarchy.' }

  const handleSummarize = async () => {
    if (!text.trim()) return toast.error('Please enter or paste some notes')
    setLoading(true)
    setResult('')

    try {
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'You are an expert academic note processor for college students. Process notes clearly and helpfully.',
        messages: [
          {
            role: 'user',
            content: `${systemPrompts[outputType]}\n\nNotes:\n${text}` }
        ] })

      setResult(data.content?.[0]?.text || 'No result generated.')
    } catch {
      toast.error('Failed to process notes')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Note Summarizer</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Transform your notes with AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Input Notes
              </h3>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste your notes here, or select from your uploaded notes below..."
                rows={10}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                {text.length} characters
              </p>
            </div>

            {/* Output type */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Output Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {outputTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setOutputType(type.id)}
                    className={`p-3 rounded-xl border text-left transition-all
                      ${outputType === type.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                  >
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{type.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? <><Loader size={15} className="animate-spin" /> Processing...</>
                : <><Sparkles size={15} /> Process Notes</>
              }
            </button>
          </div>

          {/* Output */}
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 min-h-64">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Result</h3>
                {result && (
                  <button onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded"
                      style={{ width: `${70 + Math.random() * 30}%` }} />
                  ))}
                </div>
              ) : result ? (
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {result}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <FileText size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Your processed notes will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}