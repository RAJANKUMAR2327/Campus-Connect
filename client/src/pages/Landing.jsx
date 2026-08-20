import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AnimatedCounter from '../components/AnimatedCounter'
import {
  Brain,
  FileQuestion,
  Briefcase,
  NotebookPen,
  Users,
  GraduationCap,
  FileText,
  Zap,
  Sparkles,
  ArrowRight,
  Calendar,
  StickyNote,
  Megaphone,
  Search,
  ShoppingBag,
  ChevronDown
} from 'lucide-react'

const slogans = ['Connect • Collaborate • Grow', 'Your Digital Campus Hub', 'Everything Campus, One App']

const floatingIcons = [
  { icon: Users, label: 'Clubs', top: '15%', left: '8%', delay: 0 },
  { icon: Calendar, label: 'Events', top: '65%', left: '6%', delay: 0.5 },
  { icon: StickyNote, label: 'Notes', top: '20%', left: '90%', delay: 1 },
  { icon: Briefcase, label: 'Placements', top: '70%', left: '88%', delay: 1.5 },
  { icon: Megaphone, label: 'Announcements', top: '42%', left: '4%', delay: 2 },
]

const features = [
  { 
    icon: FileText, 
    title: 'Notes Sharing', 
    desc: 'Upload and discover study materials from fellow students', 
    color: 'from-indigo-500 to-purple-600', 
    badgeText: 'Organized by branch & year' 
  },
  { 
    icon: Search, 
    title: 'Lost & Found', 
    desc: 'Report and recover lost items on your campus', 
    color: 'from-amber-500 to-orange-600', 
    badgeText: 'Campus-wide reporting' 
  },
  { 
    icon: Calendar, 
    title: 'Events', 
    desc: 'Discover and attend exciting campus events', 
    color: 'from-green-500 to-teal-600', 
    badgeText: 'RSVPs & reminders built in' 
  },
  { 
    icon: ShoppingBag, 
    title: 'Marketplace', 
    desc: 'Buy and sell within your college community', 
    color: 'from-pink-500 to-rose-600', 
    badgeText: 'Buy & sell with your campus' 
  },
  { 
    icon: Briefcase, 
    title: 'Placements', 
    desc: 'Share jobs, internships and interview experiences', 
    color: 'from-blue-500 to-cyan-600', 
    badgeText: 'Real interview experiences' 
  },
  { 
    icon: Brain, 
    title: 'AI Hub', 
    desc: 'Get instant explanations, practice quizzes, and assistance', 
    color: 'from-fuchsia-500 to-pink-600', 
    badgeText: '24/7 AI Assistance' 
  },
]

// NEW: these were previously fabricated usage numbers ("10K+ Students",
// "500+ Notes Shared", etc.) with nothing behind them — a real trust
// problem for a platform asking people to sign up. Replaced with honest
// capability statements that don't claim scale the product doesn't have.
const heroStats = [
  { value: 'Every', label: 'Branch & year' },
  { value: 'Built-in', label: 'AI assistance' },
  { value: 'Real-time', label: 'Chat & calls' },
  { value: 'Privacy-first', label: 'By design' },
]

const aiFeatures = [
  {
    title: "AI Study Assistant",
    desc: "Instant explanations and answers for any topic.",
    icon: Brain,
    color: "from-fuchsia-500 to-pink-500",
    glow: "shadow-fuchsia-500/30"
  },
  {
    title: "Quiz Generator",
    desc: "Generate MCQs and practice tests instantly.",
    icon: FileQuestion,
    color: "from-cyan-500 to-blue-500",
    glow: "shadow-cyan-500/30"
  },
  {
    title: "Career Assistant",
    desc: "Personalized guidance and roadmaps.",
    icon: Briefcase,
    color: "from-emerald-500 to-green-500",
    glow: "shadow-emerald-500/30"
  },
  {
    title: "Smart Notes",
    desc: "Flashcards, summaries and mind maps.",
    icon: NotebookPen,
    color: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/30"
  }
]

// NEW: previously fabricated usage numbers ("50K+ Questions Answered",
// "10K+ Students Assisted", etc.) — replaced with honest capability
// statements, same fix as heroStats above.
const aiStats = [
  {
    icon: Users,
    value: "Instant",
    label: "Answers & explanations"
  },
  {
    icon: GraduationCap,
    value: "Every",
    label: "Subject & topic"
  },
  {
    icon: FileText,
    value: "Auto-generated",
    label: "Practice quizzes"
  },
  {
    icon: Zap,
    value: "24/7",
    label: "AI Support"
  }
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Landing() {
  const [sloganIndex, setSloganIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = slogans[sloganIndex]
    const speed = isDeleting ? 35 : 60

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typedText.length < current.length) {
          setTypedText(current.slice(0, typedText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 1800) // pause before deleting
        }
      } else {
        if (typedText.length > 0) {
          setTypedText(current.slice(0, typedText.length - 1))
        } else {
          setIsDeleting(false)
          setSloganIndex((sloganIndex + 1) % slogans.length)
        }
      }
    }, speed)

    return () => clearTimeout(timeout)
  }, [typedText, isDeleting, sloganIndex])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">
              CC
            </div>
            <span className="font-bold text-white">CampusConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link to="/register"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all duration-200"
              style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        {/* Floating feature icons */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none">
          {floatingIcons.map(({ icon: Icon, label, top, left, delay }) => (
            <motion.div
              key={label}
              className="absolute flex flex-col items-center gap-1.5"
              style={{ top, left }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -14, 0] }}
              transition={{
                opacity: { duration: 0.6, delay },
                y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
              }}
            >
              <div className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center">
                <Icon size={18} className="text-indigo-300" />
              </div>
              <span className="text-[10px] text-gray-500">{label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto px-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
            bg-gradient-to-r from-purple-500/20 to-pink-500/20
            backdrop-blur-md
            border border-purple-500/30
            text-sm text-white
            shadow-lg shadow-purple-500/20">
              <Sparkles size={14} className="text-pink-400" />
              Built for Students, By Developers Who Understand Students
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6"
          >
            Your Digital
            <br />
            <span className="gradient-text">Campus Community</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-indigo-300 text-base sm:text-lg font-medium mb-4 h-7"
          >
            {typedText}
            <span className="inline-block w-0.5 h-5 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Everything your campus needs — notes, events, communities, marketplace, and AI-powered learning support in one platform.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register"
              className="btn-primary text-base px-8 py-4 rounded-2xl"
              style={{ boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="btn-secondary text-base px-8 py-4 rounded-2xl border-white/10 text-gray-300 bg-white/5 hover:bg-white/10">
              Sign In
            </Link>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {heroStats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            variants={fadeUp}
            className="flex justify-center mt-16"
          >
            <div className="animate-bounce text-gray-600">
              <ChevronDown size={24} />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Every 
              <span className="gradient-text"> Moment of College Life</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From notes to placements, we've got every aspect of your campus experience covered.
            </p>
          </motion.div>

          {/* Premium 3-Column / 2-Row Features Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color, badgeText }) => (
              <div
                key={title}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:-translate-y-3 hover:border-indigo-500/50 hover:shadow-[0_0_50px_rgba(99,102,241,0.25)] transition-all duration-500 cursor-pointer"
              >
                {/* Glow Blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full group-hover:scale-150 transition-all duration-700 pointer-events-none" />

                {/* Animated Gradient Border */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-purple-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Premium Icon Container with interactive rotation/scale */}
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-6`}>
                  <Icon size={30} className="text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>

                {/* Custom Statistics Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mt-4">
                  {badgeText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                {/* Live Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 backdrop-blur-xl">
                  <Sparkles size={14} />
                  Powered By Students
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-6 mb-4">
                  Study smarter with
                  <span className="gradient-text"> Campus AI</span>
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Get instant answers, generate quizzes, organize notes, and prepare for your career with your personal AI study companion.
                </p>
                
                {/* Left Side Feature Grid */}
                <div className="grid grid-cols-2 gap-5 mt-10">
                  {aiFeatures.map((feature) => (
                    <motion.div
                      key={feature.title}
                      whileHover={{
                        scale: 1.04,
                        y: -8
                      }}
                      transition={{ duration: 0.25 }}
                      className="group relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 hover:border-indigo-500/40 hover:shadow-2xl transition-all duration-500"
                    >
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-xl ${feature.glow} mb-5`}>
                        <feature.icon size={30} className="text-white" />
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-2">
                        {feature.title}
                      </h3>

                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.desc}
                      </p>

                      <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 blur-3xl group-hover:scale-150 transition-all duration-700" />
                    </motion.div>
                  ))}
                </div>

                {/* Premium Stats Row */}
                <div className="grid grid-cols-4 gap-6 mt-12">
                  {aiStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 text-center"
                    >
                      <stat.icon
                        size={24}
                        className="mx-auto text-indigo-400 mb-3"
                      />
                      <div className="text-3xl font-bold gradient-text">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to="/register"
                  className="inline-flex items-center gap-2 mt-8 btn-primary rounded-xl">
                  Try AI Features <ArrowRight size={16} />
                </Link>
              </div>

              {/* AI Chat preview (Premium Stylings) */}
              <div className="flex-1 w-full max-w-md">
                <div className="bg-slate-950/70 backdrop-blur-2xl border border-indigo-500/20 rounded-[32px] p-6 shadow-[0_0_80px_rgba(99,102,241,0.15)]">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500 ml-2">AI Study Assistant</span>
                  </div>
                  {[
                    { role: 'user', text: 'Explain deadlocks in OS with example' },
                    { role: 'ai', text: 'A deadlock occurs when 4 conditions hold simultaneously: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait...' },
                    { role: 'user', text: 'Generate 3 MCQs on this topic' },
                    { role: 'ai', text: 'Q1. Which condition is NOT necessary for deadlock?\nA) Mutual Exclusion\nB) Preemption ✓\nC) Hold & Wait...' },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                      className={`flex gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                        ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                        {msg.role === 'user' ? 'U' : 'AI'}
                      </div>
                      <div className={`text-xs rounded-xl px-3 py-2 max-w-[75%] leading-relaxed
                        ${msg.role === 'user'
                          ? 'bg-indigo-600/80 text-white rounded-tr-sm'
                          : 'bg-white/5 text-gray-300 rounded-tl-sm border border-white/5'}`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {/* AI Typing Indicator */}
                  <div className="flex items-center gap-3 mt-5">
                    <div className="text-xs text-gray-500">
                      AI is typing
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0s]"/>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.15s]"/>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.3s]"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="gradient-bg rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 rounded-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to join your campus community?
              </h2>
              <p className="text-white/80 mb-8">
                Join thousands of students already using CampusConnect
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 text-base"
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                Get Started Free <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-bg" />
            <span className="text-sm font-semibold text-gray-400">CampusConnect</span>
          </div>
          <p className="text-xs text-gray-600">
            Built with ❤️ for Indian college students ·
          </p>
        </div>
      </footer>
    </div>
  )
}