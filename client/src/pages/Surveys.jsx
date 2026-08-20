import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  ClipboardList, Plus, X, CheckCircle, Clock,
  BarChart2, Users, Star, Shield, Trash2,
  Send, Loader, Lock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const categoryConfig = {
  academic: { label: '📚 Academic', color: '#6366f1' },
  infrastructure: { label: '🏗️ Infrastructure', color: '#f59e0b' },
  events: { label: '🎉 Events', color: '#10b981' },
  food: { label: '🍽️ Food & Mess', color: '#ef4444' },
  transport: { label: '🚌 Transport', color: '#3b82f6' },
  general: { label: '📋 General', color: '#8b5cf6' },
  feedback: { label: '💬 Feedback', color: '#ec4899' } }

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6']

// ─── CREATE SURVEY MODAL ───────────────────────────────────────────
function CreateSurveyModal({ onClose, onCreated, canCreateOfficial }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [targetAudience, setTargetAudience] = useState('everyone')
  const [targetBranch, setTargetBranch] = useState('')
  const [targetYear, setTargetYear] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isOfficial, setIsOfficial] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [questions, setQuestions] = useState([{ questionText: '', type: 'single-choice', options: ['', ''], required: true }])
  const [loading, setLoading] = useState(false)

  const addQuestion = () => setQuestions(prev => [...prev, { questionText: '', type: 'single-choice', options: ['', ''], required: true }])
  const removeQuestion = (i) => setQuestions(prev => prev.filter((_, idx) => idx !== i))
  const updateQuestion = (i, field, value) => setQuestions(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n })
  const updateOption = (qi, oi, value) => setQuestions(prev => { const n = [...prev]; n[qi].options[oi] = value; return n })
  const addOption = (qi) => setQuestions(prev => { const n = [...prev]; n[qi].options.push(''); return n })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !endDate) return toast.error('Title and end date required')
    setLoading(true)
    try {
      await api.post('/surveys', {
        title, description, category, targetAudience, targetBranch, targetYear,
        isAnonymous, isOfficial, endDate,
        questions: JSON.stringify(questions.map(q => ({
          ...q, options: ['single-choice', 'multi-choice'].includes(q.type) ? q.options.filter(o => o.trim()) : [] }))) })
      toast.success('Survey created!')
      onCreated()
      onClose()
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create Survey</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Survey title *" required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Description"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

            <div className="grid grid-cols-2 gap-3">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input type="date" value={endDate} required onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option value="everyone">Everyone</option><option value="branch">Specific Branch</option><option value="year">Specific Year</option>
              </select>
              {targetAudience === 'branch' && <input value={targetBranch} onChange={e => setTargetBranch(e.target.value)} placeholder="e.g. CSE" className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />}
              {targetAudience === 'year' && (
                <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded accent-indigo-600" /><span className="text-sm text-gray-700 dark:text-gray-300">Anonymous responses</span></label>
              {canCreateOfficial && (
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isOfficial} onChange={e => setIsOfficial(e.target.checked)} className="rounded accent-indigo-600" /><span className="text-sm text-gray-700 dark:text-gray-300">🛡️ Official survey</span></label>
              )}
            </div>

            {/* Questions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Questions</p>
              {questions.map((q, qi) => (
                <div key={qi} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Q{qi + 1}</span>
                    {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qi)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>}
                  </div>
                  <input value={q.questionText} onChange={e => updateQuestion(qi, 'questionText', e.target.value)} placeholder="Question text"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 mb-2 focus:outline-none">
                    <option value="single-choice">Single Choice</option>
                    <option value="multi-choice">Multiple Choice</option>
                    <option value="rating">Rating (1-5)</option>
                    <option value="yes-no">Yes/No</option>
                    <option value="text">Text Answer</option>
                  </select>
                  {['single-choice', 'multi-choice'].includes(q.type) && (
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <input key={oi} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`}
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      ))}
                      <button type="button" onClick={() => addOption(qi)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">+ Add option</button>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addQuestion} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+ Add Question</button>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">{loading ? 'Creating...' : 'Create Survey'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── TAKE SURVEY MODAL ─────────────────────────────────────────────
function TakeSurveyModal({ survey, onClose, onSubmitted }) {
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const requiredMissing = survey.questions.some((q, i) => q.required && !answers[i])
    if (requiredMissing) return toast.error('Please answer all required questions')

    setLoading(true)
    try {
      const answerArray = Object.entries(answers).map(([qIndex, answer]) => ({ questionIndex: Number(qIndex), answer }))
      await api.post(`/surveys/${survey._id}/responses`, { answers: answerArray })
      toast.success('Response submitted!')
      onSubmitted()
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{survey.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>
          {survey.isAnonymous && <p className="text-xs text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-1"><Lock size={11} /> Your response is anonymous</p>}
          {survey.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{survey.description}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {survey.questions.map((q, qi) => (
              <div key={qi}>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{qi + 1}. {q.questionText} {q.required && <span className="text-red-500">*</span>}</p>

                {q.type === 'single-choice' && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <button key={oi} type="button" onClick={() => setAnswers(a => ({ ...a, [qi]: opt }))}
                        className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${answers[qi] === opt ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'multi-choice' && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const selected = (answers[qi] || []).includes(opt)
                      return (
                        <button key={oi} type="button" onClick={() => {
                          const current = answers[qi] || []
                          setAnswers(a => ({ ...a, [qi]: selected ? current.filter(x => x !== opt) : [...current, opt] }))
                        }}
                          className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${selected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                          {selected ? '✓ ' : ''}{opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setAnswers(a => ({ ...a, [qi]: n }))}
                        className="transition-transform hover:scale-110">
                        <Star size={28} className={n <= (answers[qi] || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'} />
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'yes-no' && (
                  <div className="flex gap-2">
                    {['Yes', 'No'].map(opt => (
                      <button key={opt} type="button" onClick={() => setAnswers(a => ({ ...a, [qi]: opt }))}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${answers[qi] === opt ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'text' && (
                  <textarea value={answers[qi] || ''} onChange={e => setAnswers(a => ({ ...a, [qi]: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2">
              {loading ? 'Submitting...' : <><Send size={14} /> Submit Response</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── RESULTS MODAL ─────────────────────────────────────────────────
function ResultsModal({ survey, onClose }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/surveys/${survey._id}/results`)
        setResults(data)
      } catch { toast.error('Failed to load results') } finally { setLoading(false) }
    }
    fetch()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{results?.survey?.title || survey.title}</h2>
              {results && <p className="text-xs text-gray-400">{results.survey.totalResponses} responses</p>}</div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>
          ) : (
            <div className="space-y-6">
              {results?.results.map((r, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{r.question}</p>

                  {(r.type === 'single-choice' || r.type === 'multi-choice' || r.type === 'yes-no') && (
                    <ResponsiveContainer width="100%" height={Math.max(r.data.length * 35, 80)}>
                      <BarChart data={r.data} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="option" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {r.data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {r.type === 'rating' && (
                    <div>
                      <p className="text-2xl font-bold text-amber-500 mb-2">⭐ {r.average}/5</p>
                      <div className="flex gap-1">
                        {r.distribution.map(d => (
                          <div key={d.rating} className="flex-1 text-center">
                            <div className="bg-amber-100 dark:bg-amber-900/30 rounded h-12 flex items-end justify-center">
                              <div className="w-full bg-amber-400 rounded" style={{ height: `${(d.count / Math.max(...r.distribution.map(x => x.count), 1)) * 100}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{d.rating}★ ({d.count})</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.type === 'text' && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {r.textResponses.map((t, ti) => <p key={ti} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">{t}</p>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function Surveys() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [takingSurvey, setTakingSurvey] = useState(null)
  const [viewingResults, setViewingResults] = useState(null)
  const [filter, setFilter] = useState('active')

  const canCreateOfficial = ['admin', 'faculty'].includes(user?.role)

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/surveys?status=${filter}`)
      setSurveys(data.surveys)
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { fetchSurveys() }, [filter])

  const handleClose = async (id) => {
    if (!confirm('Close this survey?')) return
    try { await api.patch(`/surveys/${id}/close`); toast.success('Closed!'); fetchSurveys() } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this survey?')) return
    try { await api.delete(`/surveys/${id}`); toast.success('Deleted!'); fetchSurveys() } catch { toast.error('Failed') }
  }

  return (
    <Layout>
      <AnimatePresence>
        {showCreate && <CreateSurveyModal canCreateOfficial={canCreateOfficial} onClose={() => setShowCreate(false)} onCreated={fetchSurveys} />}
        {takingSurvey && <TakeSurveyModal survey={takingSurvey} onClose={() => setTakingSurvey(null)} onSubmitted={fetchSurveys} />}
        {viewingResults && <ResultsModal survey={viewingResults} onClose={() => setViewingResults(null)} />}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Polls & Surveys</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Student Council feedback & decisions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all" style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} /> Create Survey
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ id: 'active', label: 'Active' }, { id: 'ended', label: 'Ended' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${filter === f.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <ClipboardList size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No surveys found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => {
            const conf = categoryConfig[survey.category]
            const canViewResults = survey.createdBy?._id === user?.id || user?.role === 'admin'
            const isOwn = survey.createdBy?._id === user?.id
            return (
              <div key={survey._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {survey.isOfficial && <span className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full"><Shield size={9} /> Official</span>}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${conf.color}15`, color: conf.color }}>{conf.label}</span>
                  </div>
                  {survey.hasResponded && <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400"><CheckCircle size={11} /> Responded</span>}
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{survey.title}</p>
                {survey.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{survey.description}</p>}
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Users size={10} /> {survey.responseCount} responses</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Ends {new Date(survey.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!survey.hasResponded && filter === 'active' && (
                    <button onClick={() => setTakingSurvey(survey)} className="flex-1 text-xs font-semibold bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">Take Survey</button>
                  )}
                  {canViewResults && (
                    <button onClick={() => setViewingResults(survey)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><BarChart2 size={13} /> View Results</button>
                  )}
                  {isOwn && filter === 'active' && (
                    <button onClick={() => handleClose(survey._id)} className="text-xs text-gray-400 hover:text-amber-500 px-2 transition-colors">Close</button>
                  )}
                  {isOwn && (
                    <button onClick={() => handleDelete(survey._id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}