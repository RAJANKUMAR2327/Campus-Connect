import { useState } from 'react'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { PenTool, Sparkles, Loader, Copy, Check } from 'lucide-react'

const actions = [
  { id: 'improve', label: '✨ Improve Writing' },
  { id: 'grammar', label: '✓ Fix Grammar' },
  { id: 'shorten', label: '📉 Make Shorter' },
  { id: 'expand', label: '📈 Make Longer' },
  { id: 'formal', label: '🎓 Make Formal' },
  { id: 'simplify', label: '💡 Simplify' },
]

export default function AIEssayHelper() {
  useSection('notes')
  const [text, setText] = useState('')
  const [action, setAction] = useState('improve')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const prompts = {
    improve: 'Improve this writing for clarity, flow, and impact while keeping the original meaning.',
    grammar: 'Fix all grammar, spelling, and punctuation errors. Keep the original style.',
    shorten: 'Make this more concise without losing key information.',
    expand: 'Expand this with more detail, examples, and explanation.',
    formal: 'Rewrite this in a formal, academic tone suitable for an essay or assignment.',
    simplify: 'Simplify this text to make it easier to understand.' }

  const handleProcess = async () => {
    if (!text.trim()) return toast.error('Enter some text first')
    setLoading(true)
    setResult('')
    try {
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'You are a writing assistant for college students. Return ONLY the revised text, no explanations or preamble.',
        messages: [{ role: 'user', content: `${prompts[action]}\n\nText:\n${text}` }] })
      setResult(data.content?.[0]?.text || 'Could not process text.')
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
            <PenTool size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Essay Helper</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Improve your writing instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
                placeholder="Paste your essay, paragraph, or any text you want to improve..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{text.length} characters</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">What do you want to do?</p>
              <div className="grid grid-cols-2 gap-2">
                {actions.map(a => (
                  <button key={a.id} onClick={() => setAction(a.id)}
                    className={`text-xs font-medium px-3 py-2 rounded-xl transition-all ${action === a.id ? 'bg-red-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleProcess} disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? <><Loader size={15} className="animate-spin" /> Processing...</> : <><Sparkles size={15} /> Apply</>}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 min-h-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Result</h3>
              {result && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(6)].map((_, i) => <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded" style={{ width: `${60 + Math.random()*35}%` }} />)}
              </div>
            ) : result ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <PenTool size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-600">Result will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}