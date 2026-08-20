import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, FileText, Calendar as CalendarIcon, Target } from 'lucide-react'
import useAuthStore from '../store/authStore'

const actions = [
  { label: 'Summarize my notes', to: '/ai-notes', icon: FileText },
  { label: 'Find events for me', to: '/events', icon: CalendarIcon },
  { label: 'Help with study plan', to: '/ai-study', icon: Target },
]

export default function AIAssistantPanel() {
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="relative rounded-2xl overflow-hidden border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-purple-950/30 p-5">
      {/* ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-2xl" />

      <div className="relative flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
          <Sparkles size={15} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">AI Assistant</h3>
      </div>

      <p className="relative text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
        Hi {firstName}! I'm your AI assistant. How can I help you today?
      </p>

      <div className="relative flex flex-col gap-2">
        {actions.map(({ label, to, icon: Icon }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              to={to}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-indigo-100 dark:border-indigo-900/50 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <Icon size={13} className="shrink-0" />
              {label}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
