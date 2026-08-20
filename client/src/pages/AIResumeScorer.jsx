import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  FileSearch, Sparkles, Loader, Upload,
  CheckCircle, AlertTriangle,
  TrendingUp, Target, Briefcase } from 'lucide-react'

const scoreCategories = [
  { key: 'formatting', label: 'Formatting & Structure', icon: FileSearch },
  { key: 'content', label: 'Content Quality', icon: Target },
  { key: 'keywords', label: 'ATS Keywords', icon: TrendingUp },
  { key: 'impact', label: 'Impact & Metrics', icon: Briefcase },
]

export default function AIResumeScorer() {
  useSection('placement')
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type === 'text/plain') {
      const text = await file.text()
      setResumeText(text)
    } else {
      toast.error('Please paste your resume text, or upload a .txt file. PDF parsing coming soon.')
    }
  }

  const handleScore = async () => {
    if (!resumeText.trim()) return toast.error('Paste your resume text first')
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are an expert ATS (Applicant Tracking System) resume reviewer for Indian tech recruitment.
Analyze the resume and return ONLY valid JSON (no markdown, no preamble) with this exact structure:
{
  "overallScore": <0-100>,
  "categories": {
    "formatting": {"score": <0-100>, "feedback": "..."},
    "content": {"score": <0-100>, "feedback": "..."},
    "keywords": {"score": <0-100>, "feedback": "..."},
    "impact": {"score": <0-100>, "feedback": "..."}
  },
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "missingKeywords": ["...", "..."],
  "summary": "2-3 sentence overall assessment"
}`,
        messages: [{
          role: 'user',
          content: `Target role: ${targetRole || 'General Software Engineer'}\n\nResume:\n${resumeText}` }] })
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
    } catch (err) {
      toast.error('Failed to analyze resume')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <FileSearch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Resume Scorer</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered ATS analysis</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Your Resume Text</label>
            <button onClick={() => fileRef.current.click()} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              <Upload size={12} /> Upload .txt
            </button>
            <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
          </div>
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={10}
            placeholder="Paste your complete resume text here..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3" />

          <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
            placeholder="Target role (e.g. SDE Intern at Google)"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />

          <button onClick={handleScore} disabled={loading || !resumeText.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? <><Loader size={15} className="animate-spin" /> Analyzing...</> : <><Sparkles size={15} /> Score My Resume</>}
          </button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Overall score */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={getScoreColor(result.overallScore)} strokeWidth="10"
                    strokeDasharray={`${result.overallScore * 2.64} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: getScoreColor(result.overallScore) }}>{result.overallScore}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.summary}</p>
            </div>

            {/* Category scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scoreCategories.map(cat => {
                const data = result.categories?.[cat.key]
                if (!data) return null
                return (
                  <div key={cat.key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><cat.icon size={14} className="text-gray-400" /><span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.label}</span></div>
                      <span className="text-sm font-bold" style={{ color: getScoreColor(data.score) }}>{data.score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${data.score}%`, background: getScoreColor(data.score) }} />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{data.feedback}</p>
                  </div>
                )
              })}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5"><CheckCircle size={13} /> Strengths</p>
                <ul className="space-y-1.5">
                  {result.strengths?.map((s, i) => <li key={i} className="text-xs text-green-800 dark:text-green-300 flex gap-1.5"><span>•</span>{s}</li>)}
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5"><AlertTriangle size={13} /> Improvements</p>
                <ul className="space-y-1.5">
                  {result.improvements?.map((s, i) => <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-1.5"><span>•</span>{s}</li>)}
                </ul>
              </div>
            </div>

            {result.missingKeywords?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Missing Keywords for "{targetRole || 'this role'}"</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((kw, i) => <span key={i} className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-1 rounded-full">{kw}</span>)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  )
}