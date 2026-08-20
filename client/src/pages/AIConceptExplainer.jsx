import { useState } from 'react'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Lightbulb, Sparkles, Loader, BookOpen } from 'lucide-react'

const levels = [
  { id: 'child', label: '🧒 Like I\'m 10' },
  { id: 'beginner', label: '🌱 Beginner' },
  { id: 'intermediate', label: '📘 Intermediate' },
  { id: 'expert', label: '🎓 Expert/Technical' },
]

export default function AIConceptExplainer() {
  useSection('notes')
  const [concept, setConcept] = useState('')
  const [level, setLevel] = useState('intermediate')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExplain = async () => {
    if (!concept.trim()) return toast.error('Enter a concept to explain')
    setLoading(true)
    setResult('')
    try {
      const levelPrompts = {
        child: 'Explain this like you would to a 10-year-old, using simple words and fun analogies.',
        beginner: 'Explain this for someone with no prior knowledge, using simple language and examples.',
        intermediate: 'Explain this for a college student with some background, using proper terminology with context.',
        expert: 'Give a technical, in-depth explanation using proper academic/technical terminology.' }

      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are an expert teacher. ${levelPrompts[level]} Use analogies, examples, and structure your response clearly. End with a one-sentence summary.`,
        messages: [{ role: 'user', content: `Explain: ${concept}` }] })
      setResult(data.content?.[0]?.text || 'Could not generate explanation.')
    } catch { toast.error('Failed to explain') }
    finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Lightbulb size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Concept Explainer</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Understand anything, at any level</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">What do you want to understand?</label>
          <input value={concept} onChange={e => setConcept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExplain()}
            placeholder="e.g. Quantum entanglement, Recursion, Photosynthesis, Blockchain..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />

          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Explain it at this level:</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {levels.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)}
                className={`text-sm font-medium px-3 py-2 rounded-xl transition-all ${level === l.id ? 'bg-purple-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {l.label}
              </button>
            ))}
          </div>

          <button onClick={handleExplain} disabled={loading || !concept.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? <><Loader size={15} className="animate-spin" /> Explaining...</> : <><Sparkles size={15} /> Explain This</>}
          </button>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <BookOpen size={16} className="text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Explanation</h3>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </Layout>
  )
}