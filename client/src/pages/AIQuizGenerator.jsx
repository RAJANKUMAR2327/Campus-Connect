import { useSection } from '../hooks/useSection'
import { useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  Sparkles, CheckCircle, XCircle,
  RefreshCw, Trophy, Loader, ChevronRight } from 'lucide-react'

export default function AIQuizGenerator() {
  useSection('notes')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const generateQuiz = async () => {
    if (!topic.trim()) return toast.error('Please enter a topic')
    setLoading(true)
    setQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are a quiz generator for college students. 
Generate exactly ${count} MCQ questions on the given topic.
Difficulty: ${difficulty}
Return ONLY a valid JSON array with no other text, markdown, or explanation.
Format: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."}]
The answer field must be just the letter: A, B, C, or D.`,
        messages: [
          {
            role: 'user',
            content: `Generate ${count} ${difficulty} difficulty MCQ questions on: ${topic}`
          }
        ] })

      const text = data.content?.[0]?.text || '[]'

      // Clean and parse JSON
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setQuestions(parsed)
      toast.success(`${parsed.length} questions generated!`)
    } catch (err) {
      toast.error('Failed to generate quiz. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (qIndex, option) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qIndex]: option.charAt(0) }))
  }

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      return toast.error('Please answer all questions')
    }
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++
    })
    setScore(correct)
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  const getOptionClass = (qIndex, option) => {
    const letter = option.charAt(0)
    const selected = answers[qIndex] === letter
    const correct = questions[qIndex]?.answer === letter

    if (!submitted) {
      return selected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'
    }

    if (correct) return 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    if (selected && !correct) return 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    return 'border-gray-200 dark:border-gray-700 opacity-60'
  }

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Quiz Generator</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generate practice questions on any topic</p>
          </div>
        </div>

        {/* Config */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Topic</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Operating Systems, DBMS Normalization, Data Structures..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={e => e.key === 'Enter' && generateQuiz()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map(d => (
                    <button key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                        ${difficulty === d
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Number of Questions: <span className="text-indigo-600 font-bold">{count}</span>
                </label>
                <input type="range" min={3} max={10} value={count}
                  onChange={e => setCount(Number(e.target.value))}
                  className="w-full accent-indigo-600" />
              </div>
            </div>

            <button
              onClick={generateQuiz}
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? <><Loader size={15} className="animate-spin" /> Generating Quiz...</>
                : <><Sparkles size={15} /> Generate Quiz</>
              }
            </button>
          </div>
        </div>

        {/* Score banner */}
        {submitted && (
          <div className={`rounded-2xl p-5 mb-6 text-center
            ${percentage >= 70
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900'
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900'}`}>
            <Trophy size={32} className={`mx-auto mb-2 ${percentage >= 70 ? 'text-green-500' : 'text-amber-500'}`} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {score}/{questions.length}
            </h2>
            <p className={`text-sm font-medium mt-1 ${percentage >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {percentage}% · {percentage >= 80 ? 'Excellent! 🎉' : percentage >= 60 ? 'Good job! 👍' : 'Keep studying! 📚'}
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <RefreshCw size={13} /> Try Again
              </button>
              <button onClick={generateQuiz}
                className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                <Sparkles size={13} /> New Quiz
              </button>
            </div>
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {qi + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                    {q.question}
                  </p>
                </div>

                <div className="space-y-2 ml-10">
                  {q.options.map((option, oi) => {
                    const letter = option.charAt(0)
                    const isCorrect = submitted && q.answer === letter
                    const isWrong = submitted && answers[qi] === letter && !isCorrect

                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, option)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all
                          ${getOptionClass(qi, option)}`}
                      >
                        <span className="font-semibold shrink-0">{letter}</span>
                        <span>{option.substring(3)}</span>
                        {isCorrect && <CheckCircle size={15} className="ml-auto text-green-500 shrink-0" />}
                        {isWrong && <XCircle size={15} className="ml-auto text-red-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {submitted && q.explanation && (
                  <div className="ml-10 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      <span className="font-semibold">Explanation: </span>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {!submitted && (
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Submit Answers <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}