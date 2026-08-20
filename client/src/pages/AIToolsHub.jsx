import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import {
  Bot, Sparkles, TrendingUp, BookOpen,
  FileSearch, Languages, Lightbulb, PenTool } from 'lucide-react'

const tools = [
  { to: '/ai-study', icon: Bot, title: 'Study Assistant', desc: 'Chat about any academic topic', gradient: 'from-indigo-500 to-blue-500' },
  { to: '/ai-quiz', icon: Sparkles, title: 'Quiz Generator', desc: 'Generate MCQs on any subject', gradient: 'from-amber-500 to-orange-500' },
  { to: '/ai-career', icon: TrendingUp, title: 'Career Assistant', desc: 'Roadmaps, skill gaps, interview prep', gradient: 'from-blue-500 to-cyan-500' },
  { to: '/ai-notes', icon: BookOpen, title: 'Note Summarizer', desc: 'Summaries, flashcards, mind maps', gradient: 'from-green-500 to-teal-500' },
  { to: '/ai-explain', icon: Lightbulb, title: 'Concept Explainer', desc: 'Explain anything, any level', gradient: 'from-purple-500 to-pink-500' },
  { to: '/ai-essay', icon: PenTool, title: 'Essay Helper', desc: 'Improve writing, fix grammar', gradient: 'from-red-500 to-rose-500' },
  { to: '/ai-research', icon: FileSearch, title: 'Research Assistant', desc: 'Find sources, summarize papers', gradient: 'from-cyan-500 to-blue-500' },
  { to: '/ai-translate', icon: Languages, title: 'Translator', desc: 'Translate notes to any language', gradient: 'from-teal-500 to-green-500' },
]

export default function AIToolsHub() {
  useSection('notes')

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-3">
            <Sparkles size={12} /> Powered by Claude AI
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Tools</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal AI study companion</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool, i) => (
            <motion.div key={tool.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Link to={tool.to}
                className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300 h-full">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4`}>
                  <tool.icon size={20} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{tool.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tool.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}