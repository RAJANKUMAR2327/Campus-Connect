import { useState, useEffect} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import {
  Award, Plus, X, CheckCircle, Shield,
  ThumbsUp, Trash2,
  Loader, Search, Share2, Check } from 'lucide-react'

const proficiencyColors = {
  beginner: '#94a3b8', intermediate: '#3b82f6',
  advanced: '#8b5cf6', expert: '#f59e0b' }

const methodConfig = {
  none: { label: 'Self-reported', icon: '○' },
  quiz: { label: 'Quiz Verified', icon: '📝' },
  'peer-endorsement': { label: 'Peer Verified', icon: '🤝' },
  admin: { label: 'Admin Verified', icon: '✓' },
  'certificate-upload': { label: 'Certificate Verified', icon: '📜' } }

// ─── ADD SKILL MODAL ────────────────────────────────────────────────
function AddSkillModal({ onClose, onAdded, allSkills }) {
  const [search, setSearch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [proficiency, setProficiency] = useState('intermediate')
  const [loading, setLoading] = useState(false)

  const filtered = allSkills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSkill) return toast.error('Select a skill')
    setLoading(true)
    try {
      await api.post('/skills/user', { skillId: selectedSkill._id, proficiency })
      toast.success('Skill added!')
      onAdded()
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Skill</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-4">
            {filtered.map(skill => (
              <button key={skill._id} type="button" onClick={() => setSelectedSkill(skill)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all
                  ${selectedSkill?._id === skill._id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}>
                <span className="text-xl">{skill.icon}</span>
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">{skill.name}</span>
              </button>
            ))}
          </div>

          {selectedSkill && (
            <form onSubmit={handleSubmit}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Proficiency Level</p>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {Object.entries(proficiencyColors).map(([key, color]) => (
                  <button key={key} type="button" onClick={() => setProficiency(key)}
                    className="py-2 rounded-lg text-[10px] font-medium capitalize transition-all"
                    style={proficiency === key ? { background: `${color}20`, color, border: `1px solid ${color}` } : { border: '1px solid #e5e7eb', color: '#6b7280' }}>
                    {key}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                {loading ? 'Adding...' : `Add ${selectedSkill.name}`}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── QUIZ MODAL ─────────────────────────────────────────────────────
function QuizModal({ skill, onClose, onPassed }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/skills/quiz/${skill.skill._id}`)
        setQuiz(data.quiz)
      } catch (err) { toast.error(err.response?.data?.message || 'No quiz available'); onClose() }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const answerArray = quiz.questions.map((_, i) => answers[i] || '')
      const { data } = await api.post('/skills/quiz/submit', { skillId: skill.skill._id, answers: answerArray })
      setResult(data)
      if (data.passed) onPassed()
    } catch { toast.error('Failed to submit') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{skill.skill?.icon} {skill.skill?.name} Quiz</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-400" /></div>
          ) : result ? (
            <div className="text-center py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                {result.passed ? '🎉' : '😔'}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.score}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{result.correct}/{result.total} correct</p>
              <p className={`text-sm font-semibold mb-6 ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {result.passed ? `Passed! You're now verified in ${skill.skill?.name}` : `Needed ${result.passingScore}% to pass`}
              </p>
              <button onClick={onClose} className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">
                {result.passed ? 'Awesome!' : 'Try Again Later'}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {quiz?.questions.map((q, qi) => (
                  <div key={qi} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const letter = String.fromCharCode(65 + oi)
                        return (
                          <button key={oi} onClick={() => setAnswers(a => ({ ...a, [qi]: letter }))}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${answers[qi] === letter ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'}`}>
                            <span className="font-semibold mr-2">{letter}</span>{opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < quiz?.questions.length}
                className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── SKILL CARD ─────────────────────────────────────────────────────
function SkillCard({ userSkill, isOwnProfile, onEndorse, onRemove, onTakeQuiz, currentUserId }) {
  const conf = methodConfig[userSkill.verificationMethod]
  const hasEndorsed = userSkill.endorsements?.some(e => e.endorser._id === currentUserId)

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={`bg-white dark:bg-gray-900 rounded-xl border p-4 ${userSkill.isVerified ? 'border-green-200 dark:border-green-800' : 'border-gray-100 dark:border-gray-800'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{userSkill.skill?.icon}</span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{userSkill.skill?.name}</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize"
              style={{ background: `${proficiencyColors[userSkill.proficiency]}15`, color: proficiencyColors[userSkill.proficiency] }}>
              {userSkill.proficiency}
            </span>
          </div>
        </div>
        {userSkill.isVerified && <CheckCircle size={16} className="text-green-500 shrink-0" />}
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-3 flex items-center gap-1">
        {conf.icon} {conf.label}
        {userSkill.quizScore && ` (${userSkill.quizScore}%)`}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-1">
          <ThumbsUp size={11} className="text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{userSkill.endorsements?.length || 0} endorsements</span>
        </div>
        {isOwnProfile ? (
          <div className="flex gap-2">
            {!userSkill.isVerified && (
              <button onClick={() => onTakeQuiz(userSkill)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Verify
              </button>
            )}
            <button onClick={() => onRemove(userSkill._id)} className="text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <button onClick={() => onEndorse(userSkill._id)} disabled={hasEndorsed}
            className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${hasEndorsed ? 'text-green-500' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
            {hasEndorsed ? '✓ Endorsed' : 'Endorse'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function SkillsHub() {
  useSection('placement')
  const { user } = useAuthStore()
  const [userSkills, setUserSkills] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [quizSkill, setQuizSkill] = useState(null)
  const [tab, setTab] = useState('skills')
  const [copiedCode, setCopiedCode] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [skillsRes, allRes, credsRes] = await Promise.all([
        api.get('/skills/user'),
        api.get('/skills'),
        api.get('/skills/credentials'),
      ])
      setUserSkills(skillsRes.data.skills)
      setAllSkills(allRes.data.skills)
      setCredentials(credsRes.data.credentials)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleRemove = async (id) => {
    try {
      await api.delete(`/skills/user/${id}`)
      toast.success('Removed!')
      fetchData()
    } catch { toast.error('Failed') }
  }

  const handleCopyCode = (code) => {
    const url = `${window.location.origin}/verify/${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    toast.success('Verification link copied!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <Layout>
      <AnimatePresence>
        {showAdd && <AddSkillModal allSkills={allSkills} onClose={() => setShowAdd(false)} onAdded={fetchData} />}
        {quizSkill && <QuizModal skill={quizSkill} onClose={() => { setQuizSkill(null); fetchData() }} onPassed={fetchData} />}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Skills & Credentials</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Build your verified professional profile</p>
          </div>
          <div className="flex gap-2">
            <Link to="/certificate"
              className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <Shield size={15} /> Verify with Certificate
            </Link>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
              style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Plus size={15} /> Add Skill
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {[{ id: 'skills', label: `Skills (${userSkills.length})` }, { id: 'credentials', label: `Credentials (${credentials.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
        ) : tab === 'skills' ? (
          userSkills.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Award size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-1">No skills added yet</p>
              <button onClick={() => setShowAdd(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Add your first skill
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userSkills.map(us => (
                <SkillCard key={us._id} userSkill={us} isOwnProfile currentUserId={user?.id}
                  onRemove={handleRemove} onTakeQuiz={setQuizSkill} />
              ))}
            </div>
          )
        ) : (
          credentials.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Shield size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-1">No verified credentials yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-600">Pass a skill quiz or get 5 peer endorsements to earn one</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {credentials.map(c => (
                <div key={c._id} className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{c.skill?.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{c.skill?.name}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 capitalize">{methodConfig[c.verificationMethod]?.label}</p>
                    </div>
                  </div>
                  {c.score && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Score: {c.score}%</p>}
                  <p className="text-[10px] text-gray-400 mb-3">Issued {new Date(c.issuedAt).toLocaleDateString()}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleCopyCode(c.verificationCode)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-200 dark:border-indigo-800">
                      {copiedCode === c.verificationCode ? <Check size={12} /> : <Share2 size={12} />}
                      {copiedCode === c.verificationCode ? 'Copied!' : 'Share'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Layout>
  )
}