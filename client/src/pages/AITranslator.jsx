import { useState } from 'react'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Languages, ArrowRightLeft, Loader, Copy, Check } from 'lucide-react'

const languages = ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Kannada', 'Malayalam', 'Spanish', 'French']

export default function AITranslator() {
  useSection('notes')
  const [text, setText] = useState('')
  const [fromLang, setFromLang] = useState('English')
  const [toLang, setToLang] = useState('Hindi')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleTranslate = async () => {
    if (!text.trim()) return toast.error('Enter text to translate')
    setLoading(true)
    setResult('')
    try {
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are a professional translator. Translate from ${fromLang} to ${toLang}. Preserve academic/technical terms accurately. Return ONLY the translation, no explanations.`,
        messages: [{ role: 'user', content: text }] })
      setResult(data.content?.[0]?.text || 'Could not translate.')
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const swapLanguages = () => {
    setFromLang(toLang)
    setToLang(fromLang)
    setText(result)
    setResult('')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">
            <Languages size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Note Translator</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Translate notes to any language</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-3 mb-4">
          <select value={fromLang} onChange={e => setFromLang(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={swapLanguages} className="p-2.5 text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors shrink-0">
            <ArrowRightLeft size={16} />
          </button>
          <select value={toLang} onChange={e => setToLang(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{fromLang}</p>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
              placeholder="Paste your notes here..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{toLang}</p>
              {result && (
                <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1">
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded" style={{ width: `${60+Math.random()*30}%` }} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-32">{result || <span className="text-gray-300 dark:text-gray-700">Translation will appear here</span>}</p>
            )}
          </div>
        </div>

        <button onClick={handleTranslate} disabled={loading || !text.trim()}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          {loading ? <><Loader size={15} className="animate-spin" /> Translating...</> : 'Translate'}
        </button>
      </div>
    </Layout>
  )
}