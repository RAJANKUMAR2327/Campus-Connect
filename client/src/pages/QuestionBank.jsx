import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  BookOpen, Plus, Search,
  ThumbsUp,
  Bookmark, Eye, EyeOff,
  Clock, X, Upload,
  Download, FileText, Play,
  CheckCircle, XCircle, BarChart2,
  Loader, ArrowLeft } from 'lucide-react'

const difficultyConfig = {
  easy: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Easy' },
  medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Medium' },
  hard: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Hard' } }

const typeConfig = {
  mcq: { label: 'MCQ', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
  short: { label: 'Short', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  long: { label: 'Long', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  numerical: { label: 'Numerical', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
  coding: { label: 'Coding', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' } }

// ─── ADD QUESTION MODAL ───────────────────────────────────────────
function AddQuestionModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    subject: '', topic: '', branch: '', year: '',
    semester: '', examYear: new Date().getFullYear(),
    examType: 'practice', type: 'mcq',
    question: '', options: ['', '', '', ''],
    answer: '', explanation: '', difficulty: 'medium',
    marks: 1, tags: '' })
  const [loading, setLoading] = useState(false)

  const updateOption = (i, val) => {
    const opts = [...form.options]
    opts[i] = val
    setForm(f => ({ ...f, options: opts }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'options') fd.append(k, JSON.stringify(v.filter(o => o.trim())))
        else if (k === 'tags') fd.append(k, JSON.stringify(v.split(',').map(t => t.trim()).filter(Boolean)))
        else fd.append(k, v)
      })
      await api.post('/questions', fd)
      toast.success('Question added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Question</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Question Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeConfig).map(([type, config]) => (
                  <button key={type} type="button"
                    onClick={() => setForm(f => ({ ...f, type }))}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all
                      ${form.type === type ? config.color + ' ring-1 ring-current' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject *</label>
                <input value={form.subject} required
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Operating Systems"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Topic</label>
                <input value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Deadlocks"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Branch</label>
                <input value={form.branch}
                  onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                  placeholder="CSE"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Year</label>
                <select value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Any</option>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Y{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Exam Year</label>
                <input type="number" value={form.examYear}
                  onChange={e => setForm(f => ({ ...f, examYear: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Marks</label>
                <input type="number" value={form.marks} min={1}
                  onChange={e => setForm(f => ({ ...f, marks: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Exam Type</label>
                <select value={form.examType}
                  onChange={e => setForm(f => ({ ...f, examType: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['mid-sem','end-sem','quiz','assignment','practice'].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Difficulty</label>
                <select value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</label>
                <input value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="important, unit-4"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Question text */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Question *</label>
              <textarea value={form.question} required rows={3}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="Enter the question..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* MCQ options */}
            {form.type === 'mcq' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Options (mark correct answer)
                </label>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((letter, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, answer: letter }))}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0
                          ${form.answer === letter
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600'}`}>
                        {letter}
                      </button>
                      <input value={form.options[i]}
                        onChange={e => updateOption(i, e.target.value)}
                        placeholder={`Option ${letter}`}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Click a letter to mark it as correct answer</p>
              </div>
            )}

            {/* Answer for non-MCQ */}
            {form.type !== 'mcq' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Answer / Solution</label>
                <textarea value={form.answer} rows={3}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  placeholder="Provide the answer or solution..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Explanation (optional)</label>
              <textarea value={form.explanation} rows={2}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="Explain why this is the correct answer..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
                {loading ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── QUESTION CARD ────────────────────────────────────────────────
function QuestionCard({ q, onUpvote, onBookmark, mode, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const diff = difficultyConfig[q.difficulty]
  const typeConf = typeConfig[q.type]
  const accuracy = q.attempts > 0
    ? Math.round((q.correctAttempts / q.attempts) * 100)
    : null

  return (
    <motion.div
      layout
      className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-300
        ${selected
          ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900'
          : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConf?.color}`}>
              {typeConf?.label}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
              {diff.label}
            </span>
            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {q.examType}
            </span>
            {q.marks && (
              <span className="text-[10px] text-gray-400 dark:text-gray-600">
                {q.marks} mark{q.marks > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {mode === 'quiz' && (
            <input type="checkbox" checked={selected} onChange={() => onSelect(q._id)}
              className="w-4 h-4 accent-indigo-600 shrink-0 mt-0.5"
            />
          )}
        </div>

        {/* Subject + Topic */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{q.subject}</span>
          {q.topic && <span className="text-xs text-gray-400">· {q.topic}</span>}
          {q.examYear && <span className="text-xs text-gray-400">· {q.examYear}</span>}
        </div>

        {/* Question */}
        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed mb-3">
          {q.question}
        </p>

        {/* MCQ Options */}
        {q.type === 'mcq' && q.options?.length > 0 && (
          <div className="space-y-2 mb-3">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = selectedOption === letter
              const isCorrect = showAnswer && q.answer === letter
              const isWrong = showAnswer && isSelected && !isCorrect

              return (
                <button key={i}
                  onClick={() => { if (!showAnswer) setSelectedOption(letter) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition-all
                    ${isCorrect ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : isWrong ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : isSelected ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0
                    border-current">{letter}</span>
                  <span className="flex-1">{opt}</span>
                  {isCorrect && <CheckCircle size={15} className="text-green-500 shrink-0" />}
                  {isWrong && <XCircle size={15} className="text-red-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Show answer button */}
        {(q.answer || q.explanation) && (
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-3"
          >
            {showAnswer ? <EyeOff size={13} /> : <Eye size={13} />}
            {showAnswer ? 'Hide' : 'Show'} Answer
          </button>
        )}

        {/* Answer + Explanation */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {q.type !== 'mcq' && q.answer && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-2">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">✅ Answer</p>
                  <p className="text-sm text-green-800 dark:text-green-300">{q.answer}</p>
                </div>
              )}
              {q.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">💡 Explanation</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags */}
        {q.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-3">
            {q.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={() => onUpvote(q._id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <ThumbsUp size={13} /> {q.upvotes?.length || 0}
            </button>
            <button onClick={() => onBookmark(q._id)}
              className="text-gray-400 hover:text-amber-500 transition-colors">
              <Bookmark size={13} />
            </button>
            {accuracy !== null && (
              <span className="text-[10px] text-gray-400 dark:text-gray-600">
                {accuracy}% accuracy · {q.attempts} attempts
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full overflow-hidden">
              {q.postedBy?.avatar
                ? <img src={q.postedBy.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">{q.postedBy?.name?.charAt(0)}</div>
              }
            </div>
            <span className="text-[10px] text-gray-400">{q.postedBy?.name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── QUIZ MODE ────────────────────────────────────────────────────
function QuizMode({ questions, onExit }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(questions.length * 90) // 90s per question
  const [startTime] = useState(Date.now())
  const timerRef = useRef()

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    clearInterval(timerRef.current)
    setLoading(true)
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000)
      const answerData = questions.map(q => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || '',
        timeTaken: 0 }))

      const { data } = await api.post('/questions/attempt', {
        answers: answerData,
        subject: questions[0]?.subject,
        timeTaken })
      setResult(data)
      setSubmitted(true)
    } catch { toast.error('Failed to submit') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100
  const isLowTime = timeLeft < 60

  if (submitted && result) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center"
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl
            ${result.score >= 70 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            {result.score >= 80 ? '🏆' : result.score >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {result.score}%
          </h2>
          <p className={`text-base font-semibold mb-1 ${result.score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {result.correct}/{result.total} correct
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            {result.score >= 80 ? 'Excellent! You\'re well prepared!' : result.score >= 60 ? 'Good job! Keep practicing!' : 'Keep studying! You\'ll get there!'}
          </p>

          {/* Per-question results */}
          <div className="space-y-2 mb-6 text-left max-h-60 overflow-y-auto">
            {result.results?.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl
                ${r.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                {r.isCorrect
                  ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                  : <XCircle size={16} className="text-red-500 shrink-0" />
                }
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  Q{i + 1}: {questions[i]?.question?.slice(0, 50)}...
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onExit}
              className="flex-1 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Back to Bank
            </button>
            <button onClick={() => { setSubmitted(false); setAnswers({}); setCurrent(0); setResult(null) }}
              className="flex-1 py-3 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Quiz header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (confirm('Exit quiz? Progress will be lost.')) onExit() }}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft size={16} /> Exit Quiz
        </button>
        <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl
          ${isLowTime ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
          <Clock size={15} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mb-2">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-indigo-600 rounded-full"
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4"
        >
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig[q.type]?.color}`}>
              {typeConfig[q.type]?.label}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyConfig[q.difficulty]?.bg} ${difficultyConfig[q.difficulty]?.color}`}>
              {difficultyConfig[q.difficulty]?.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-600">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
          </div>

          <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-5">
            {q.question}
          </p>

          {/* MCQ Options */}
          {q.type === 'mcq' && q.options?.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = answers[q._id] === letter

            return (
              <button key={i}
                onClick={() => handleAnswer(q._id, letter)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left mb-2 transition-all
                  ${isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0
                  ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                  {letter}
                </span>
                {opt}
              </button>
            )
          })}

          {/* Text answer for non-MCQ */}
          {q.type !== 'mcq' && (
            <textarea
              value={answers[q._id] || ''}
              onChange={e => handleAnswer(q._id, e.target.value)}
              placeholder="Write your answer..."
              rows={4}
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent(prev => Math.max(0, prev - 1))}
          disabled={current === 0}
          className="flex-1 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          ← Previous
        </button>

        {/* Question dots */}
        <div className="flex gap-1">
          {questions.slice(Math.max(0, current - 2), Math.min(questions.length, current + 3)).map((_, i) => {
            const actualIdx = Math.max(0, current - 2) + i
            return (
              <button key={actualIdx}
                onClick={() => setCurrent(actualIdx)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all
                  ${actualIdx === current ? 'bg-indigo-600 text-white' : answers[questions[actualIdx]?._id] ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {actualIdx + 1}
              </button>
            )
          })}
        </div>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex-1 py-3 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? <Loader size={15} className="animate-spin mx-auto" /> : '✓ Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── PAPERS TAB ───────────────────────────────────────────────────
function PapersTab() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({
    title: '', subject: '', branch: '', year: '',
    semester: '', examYear: new Date().getFullYear(),
    examType: 'end-sem', duration: '', totalMarks: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()
  const [filters, setFilters] = useState({ subject: '', examType: '' })

  const fetchPapers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const { data } = await api.get(`/questions/papers?${params}`)
      setPapers(data.papers)
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPapers() }, [filters])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    setUploading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('file', file)
      await api.post('/questions/papers', fd)
      toast.success('Paper uploaded!')
      setShowUpload(false)
      setFile(null)
      fetchPapers()
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleDownload = async (paper) => {
    try {
      await api.patch(`/questions/papers/${paper._id}/download`)
      window.open(paper.fileUrl, '_blank')
    } catch {}
  }

  const examTypeColors = {
    'mid-sem': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    'end-sem': 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    'quiz': 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    'assignment': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{papers.length} papers available</p>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Upload size={14} /> Upload Paper
        </button>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleUpload}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Paper</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {[
                  { key: 'title', label: 'Title *', placeholder: 'OS End-Sem 2023', required: true },
                  { key: 'subject', label: 'Subject *', placeholder: 'Operating Systems', required: true },
                  { key: 'branch', label: 'Branch', placeholder: 'CSE' },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <input value={form[key]} required={required}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                {[
                  { key: 'year', label: 'Student Year', type: 'select', options: [1,2,3,4,5].map(y => ({ value: y, label: `Y${y}` })) },
                  { key: 'examType', label: 'Exam Type', type: 'select', options: ['mid-sem','end-sem','quiz','assignment'].map(t => ({ value: t, label: t })) },
                  { key: 'examYear', label: 'Exam Year', type: 'number', placeholder: '2023' },
                ].map(({ key, label, type, options, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    {type === 'select' ? (
                      <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Any</option>
                        {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={type || 'text'} value={form[key]} placeholder={placeholder}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* File upload */}
              <div
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer mb-3 transition-all
                  ${file ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                {file ? (
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{file.name}</p>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-500">Upload PDF (max 20MB)</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                  onChange={e => setFile(e.target.files[0])} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Papers grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-40 animate-pulse" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No papers uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map(paper => (
            <motion.div key={paper._id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-md">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{paper.title}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{paper.subject}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${examTypeColors[paper.examType]}`}>
                  {paper.examType}
                </span>
                {paper.branch && (
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {paper.branch}
                  </span>
                )}
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {paper.examYear}
                </span>
                {paper.totalMarks && (
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {paper.totalMarks} marks
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  {paper.downloads} downloads
                </span>
                {paper.fileUrl ? (
                  <button onClick={() => handleDownload(paper)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"
                    style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                    <Download size={12} /> Download
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-600">No file</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function QuestionBank() {
  useSection('notes')
  const { user } = useAuthStore()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('bank') // bank | papers | bookmarks | attempts
  const [quizMode, setQuizMode] = useState(false)
  const [selectedForQuiz, setSelectedForQuiz] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    subject: '', branch: '', year: '',
    examType: '', type: '', difficulty: '' })
  const [subjects, setSubjects] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })

  const fetchQuestions = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (search) params.append('search', search)
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })

      const { data } = await api.get(`/questions?${params}`)
      setQuestions(data.questions)
      setPagination(data.pagination)
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/questions/subjects')
      setSubjects(data.subjects)
    } catch {}
  }

  useEffect(() => { fetchQuestions(); fetchSubjects() }, [search, filters])

  const handleUpvote = async (id) => {
    try {
      await api.patch(`/questions/${id}/upvote`)
      fetchQuestions(pagination.page)
    } catch {}
  }

  const handleBookmark = async (id) => {
    try {
      await api.patch(`/questions/${id}/bookmark`)
      toast.success('Bookmark updated!')
    } catch {}
  }

  const toggleQuizSelect = (id) => {
    setSelectedForQuiz(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const startQuiz = () => {
    if (selectedForQuiz.length < 1) return toast.error('Select at least 1 question')
    const quizQuestions = questions.filter(q => selectedForQuiz.includes(q._id))
    setQuizMode(quizQuestions)
  }

  if (quizMode && quizMode.length > 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-4">
          <QuizMode questions={quizMode} onExit={() => { setQuizMode(false); setSelectedForQuiz([]) }} />
        </div>
      </Layout>
    )
  }

  const tabs = [
    { id: 'bank', label: '📚 Question Bank' },
    { id: 'papers', label: '📄 Previous Papers' },
    { id: 'bookmarks', label: '🔖 Bookmarks' },
    { id: 'attempts', label: '📊 My Attempts' },
  ]

  return (
    <Layout>
      <AnimatePresence>
        {showAdd && (
          <AddQuestionModal
            onClose={() => setShowAdd(false)}
            onAdded={fetchQuestions}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Question Bank</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {pagination.total} questions · Previous year papers · Practice quizzes
          </p>
        </div>
        <div className="flex gap-2">
          {selectedForQuiz.length > 0 && (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={startQuiz}
              className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
              <Play size={14} /> Quiz ({selectedForQuiz.length})
            </motion.button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
            style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all
              ${tab === t.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'papers' ? (
        <PapersTab />
      ) : tab === 'bookmarks' ? (
        <BookmarksTab onUpvote={handleUpvote} onBookmark={handleBookmark} />
      ) : tab === 'attempts' ? (
        <AttemptsTab />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Search size={15} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions, topics, subjects..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Subject filter */}
              <select value={filters.subject}
                onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Difficulty filter */}
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d}
                  onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === d ? '' : d }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all font-medium
                    ${filters.difficulty === d
                      ? d === 'easy' ? 'bg-green-500 text-white border-green-500'
                        : d === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {d}
                </button>
              ))}

              {/* Type filter */}
              <select value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option value="">All Types</option>
                {['mcq','short','long','numerical','coding'].map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>

              {/* Exam type */}
              <select value={filters.examType}
                onChange={e => setFilters(f => ({ ...f, examType: e.target.value }))}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
                <option value="">All Exams</option>
                {['mid-sem','end-sem','quiz','assignment','practice'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Clear filters */}
              {Object.values(filters).some(Boolean) && (
                <button
                  onClick={() => setFilters({ subject:'', branch:'', year:'', examType:'', type:'', difficulty:'' })}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Quiz mode hint */}
            {questions.length > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3 flex items-center gap-1">
                <Play size={11} /> Click checkboxes on questions to select for quiz mode
              </p>
            )}
          </div>

          {/* Questions */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse h-36" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <BookOpen size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No questions found</p>
              <button onClick={() => setShowAdd(true)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Add the first question!
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {questions.map(q => (
                  <QuestionCard
                    key={q._id}
                    q={q}
                    onUpvote={handleUpvote}
                    onBookmark={handleBookmark}
                    mode="quiz"
                    selected={selectedForQuiz.includes(q._id)}
                    onSelect={toggleQuizSelect}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {[...Array(Math.min(pagination.pages, 7))].map((_, i) => (
                    <button key={i}
                      onClick={() => fetchQuestions(i + 1)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                        ${pagination.page === i + 1
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  )
}

// ─── BOOKMARKS TAB ────────────────────────────────────────────────
function BookmarksTab({ onUpvote, onBookmark }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/questions/bookmarked')
        setQuestions(data.questions)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>

  return questions.length === 0 ? (
    <div className="text-center py-16">
      <Bookmark size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
      <p className="text-gray-500 dark:text-gray-400">No bookmarked questions yet</p>
    </div>
  ) : (
    <div className="space-y-4">
      {questions.map(q => (
        <QuestionCard key={q._id} q={q} onUpvote={onUpvote} onBookmark={onBookmark} mode="view" />
      ))}
    </div>
  )
}

// ─── ATTEMPTS TAB ─────────────────────────────────────────────────
function AttemptsTab() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/questions/my-attempts')
        setAttempts(data.attempts)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0

  return attempts.length === 0 ? (
    <div className="text-center py-16">
      <BarChart2 size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
      <p className="text-gray-500 dark:text-gray-400">No quiz attempts yet</p>
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Select questions and start a quiz!</p>
    </div>
  ) : (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Attempts', value: attempts.length, icon: '🎯' },
          { label: 'Average Score', value: `${avgScore}%`, icon: '📊' },
          { label: 'Best Score', value: `${Math.max(...attempts.map(a => a.score))}%`, icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attempt list */}
      <div className="space-y-3">
        {attempts.map(attempt => (
          <div key={attempt._id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0
              ${attempt.score >= 70 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : attempt.score >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
              {attempt.score}%
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {attempt.subject || 'Mixed Quiz'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {attempt.correctAnswers}/{attempt.totalQuestions} correct ·{' '}
                {new Date(attempt.completedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${attempt.score}%`,
                    background: attempt.score >= 70 ? '#22c55e' : attempt.score >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}