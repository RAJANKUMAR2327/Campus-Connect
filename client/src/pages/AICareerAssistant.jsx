import { useSection } from '../hooks/useSection'
import { useState } from 'react'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import api from '../api/axios'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Briefcase, Sparkles, Loader,
  Target, TrendingUp, FileText, Star } from 'lucide-react'

const careerTools = [
  {
    id: 'roadmap',
    icon: TrendingUp,
    title: 'Career Roadmap',
    description: 'Get a personalized learning roadmap for your dream role',
    color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    prompt: (user, input) =>
      `Create a detailed career roadmap for a ${user?.branch || 'CS'} student in Year ${user?.year || 3} who wants to become a ${input}. Include: current skills to build, timeline (semester-wise), resources, projects to build, and companies to target. Be specific and actionable.` },
  {
    id: 'skillgap',
    icon: Target,
    title: 'Skill Gap Analysis',
    description: 'Find what skills you need for your target role',
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    prompt: (user, input) =>
      `Analyze the skill gap for a ${user?.branch || 'CS'} Year ${user?.year || 3} student targeting: ${input}. List: required skills, skills they likely have, skills to learn urgently, and a 30-60-90 day learning plan. Be practical.` },
  {
    id: 'resume',
    icon: FileText,
    title: 'Resume Review',
    description: 'Get AI feedback on your resume summary',
    color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    prompt: (user, input) =>
      `Review this resume/profile summary for an Indian college student and give specific, actionable feedback: "${input}". Rate it out of 10, list what's good, what's missing, and provide an improved version.` },
  {
    id: 'interview',
    icon: Star,
    title: 'Interview Prep',
    description: 'Get likely interview questions for any role',
    color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    prompt: (user, input) =>
      `Generate likely interview questions for: ${input}. Include: technical questions, behavioral questions, HR questions, and suggested answers. Format clearly with sections.` },
]

export default function AICareerAssistant() {
  useSection('placement')
  const { user } = useAuthStore()
  const [activeTool, setActiveTool] = useState(null)
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) return toast.error('Please enter some input')
    setLoading(true)
    setResult('')

    try {
      const tool = careerTools.find(t => t.id === activeTool)
      const prompt = tool.prompt(user, input)

      const { data } = await api.post('/ai/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are an expert career counselor for Indian college students.
You have deep knowledge of:
- Indian tech industry and placement processes
- Top companies: Google, Microsoft, Amazon, Flipkart, etc.
- Competitive programming and DSA
- System design interviews
- Campus placement preparation
Be specific, practical, and encouraging.`,
        messages: [{ role: 'user', content: prompt }] })

      const text = data.content?.[0]?.text || 'Could not generate response.'
      setResult(text)
    } catch {
      toast.error('Failed to generate. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const placeholders = {
    roadmap: 'e.g. Software Engineer at Google, Data Scientist, Product Manager...',
    skillgap: 'e.g. Backend Developer at Flipkart, ML Engineer, DevOps Engineer...',
    resume: 'Paste your resume summary or LinkedIn about section here...',
    interview: 'e.g. SWE Intern at Microsoft, Data Analyst at Amazon...' }

  const labels = {
    roadmap: 'Target Role',
    skillgap: 'Target Role / Company',
    resume: 'Your Resume Summary',
    interview: 'Role / Company' }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Career Assistant</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Personalized career guidance for {user?.name?.split(' ')[0] || 'you'}
            </p>
          </div>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {careerTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(''); setInput('') }}
              className={`p-4 rounded-2xl border-2 text-left transition-all
                ${activeTool === tool.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tool.color}`}>
                <tool.icon size={18} />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{tool.title}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 leading-tight">
                {tool.description}
              </p>
            </button>
          ))}
        </div>

        {/* Input area */}
        {activeTool && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels[activeTool]}
            </label>
            {activeTool === 'resume' ? (
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={placeholders[activeTool]}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            ) : (
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={placeholders[activeTool]}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? <><Loader size={15} className="animate-spin" /> Analyzing...</>
                : <><Sparkles size={15} /> Generate Insights</>
              }
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {careerTools.find(t => t.id === activeTool)?.title} Results
              </h3>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
            <button
              onClick={handleGenerate}
              className="mt-4 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          </div>
        )}

        {/* Empty state */}
        {!activeTool && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-amber-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Choose a career tool above
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              Get personalized career guidance powered by Claude AI
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}