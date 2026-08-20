import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Asset Imports
// IMAGE-SIZE FIX: these were originally 8.9MB/2.0MB PNGs at 2528x1684 /
// 1024x1024 — far larger than needed for a 60%-viewport-width background
// (campus-night) and a 36x36px logo, and the two largest were the exact
// cause of the PWA precache build failure (workbox's 2MB per-file
// default). Resized to a realistic display size and converted to WebP:
// campus-night 8.9MB → 382KB, logo-glow 2.0MB → 19KB, both visually
// verified against the originals before replacing.
import campusImage from "../assets/campus-night.webp"
import logo from "../assets/logo-glow.webp"

// =========================================================================
// SUB-COMPONENTS
// =========================================================================

function FeatureCard({ icon, title, subtitle }) {
  return (
    <div className="bg-[#0b0f19]/60 border border-white/5 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 hover:border-purple-500/30">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-white font-semibold text-sm">{title}</h4>
      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{subtitle}</p>
    </div>
  )
}

function StatsCard({ number, label }) {
  return (
    <div className="text-left px-6 border-r border-white/10 last:border-none">
      <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
        {number}
      </div>
      <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
    </div>
  )
}

function SocialButton({ text }) {
  const getIcon = () => {
    if (text === "Google") {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.97 1 12 1 7.24 1 3.2 3.74 1.24 7.72l3.8 2.95C5.97 7.54 8.74 5.04 12 5.04z"/>
          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.48z"/>
          <path fill="#FBBC05" d="M5.04 14.67c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.24 7.1C.45 8.67 0 10.42 0 12s.45 3.33 1.24 4.9l3.8-2.23z"/>
          <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.52 1.18-4.3 1.18-3.26 0-6.03-2.5-7.02-5.63l-3.8 2.95C3.2 20.26 7.24 23 12 23z"/>
        </svg>
      )
    }
    if (text === "Microsoft") {
      return (
        <svg className="w-5 h-5" viewBox="0 0 23 23">
          <path fill="#f25022" d="M0 0h11v11H0z" />
          <path fill="#7fba00" d="M12 0h11v11H12z" />
          <path fill="#00a4ef" d="M0 12h11v11H0z" />
          <path fill="#ffb900" d="M12 12h11v11H12z" />
        </svg>
      )
    }
    return null
  }

  return (
    <button
      type="button"
      className="flex items-center justify-center gap-3 h-14 w-full bg-[#0b0e24] border border-white/5 rounded-xl text-white font-medium transition-all duration-300 hover:bg-white/5 hover:border-white/10"
    >
      {getIcon()}
      <span className="text-sm text-gray-300">Continue with {text}</span>
    </button>
  )
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function Login() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      setAuth(data.token, data.user)
      // NEW: distinguish a normal login from one that just reactivated a
      // deactivated account, so the person knows what happened.
      toast.success(
        data.reactivated
          ? `Welcome back, ${data.user.name.split(' ')[0]}! Your account has been reactivated.`
          : `Welcome back, ${data.user.name.split(' ')[0]}!`
      )
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#030307] relative overflow-hidden flex items-center justify-center px-6 py-12 lg:py-16">
      
      {/* ========================================================================= */}
      {/* PERFECTED LEFT-ALIGNED BACKDROP IMAGE & COSMIC FADE FLUIDITY              */}
      {/* ========================================================================= */}
      <div className="absolute top-0 left-0 w-full lg:w-[60%] h-full z-0 pointer-events-none">
        <img 
          src={campusImage} 
          className="w-full h-full object-cover object-left opacity-75 select-none" 
          alt="Cosmic Campus Left Visual" 
        />
        {/* Soft edge masks to fade perfectly to black before hitting the right column */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#030307]/40 to-[#030307]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030307] via-transparent to-transparent" />
      </div>

      {/* Outer ambient glow circles matching target */}
      <div className="absolute top-[15%] left-[30%] w-[550px] h-[550px] rounded-full border border-purple-500/10 pointer-events-none shadow-[0_0_100px_rgba(147,51,234,0.08)]" />
      <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Utilities Layer (Theme Toggle Mock) */}
      <div className="absolute top-6 right-8 z-30 flex items-center gap-2 bg-black/40 border border-white/5 rounded-full p-1 backdrop-blur-md">
        <button className="p-2 text-gray-500"><span className="text-sm">☀️</span></button>
        <button className="p-2 bg-purple-600/20 text-purple-400 rounded-full shadow-inner"><span className="text-sm">🌙</span></button>
      </div>

      {/* ========================================================================= */}
      {/* INTERFACE CONTENT ARCHITECTURE                                             */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-7xl w-full grid lg:grid-cols-2 gap-12 xl:gap-20 items-center"
      >
        
        {/* LEFT COLUMN PANEL */}
        <div className="hidden lg:block relative z-20">
          <div className="flex items-center gap-3 mb-10">
            <img src={logo} className="w-9 h-9 object-contain" alt="Campus Connect Logo" />
            <span className="text-white font-bold text-xl tracking-tight">Campus<span className="text-purple-400">Connect</span></span>
          </div>

          <div className="inline-flex px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 mb-6 font-semibold text-xs tracking-wider">
            WELCOME BACK
          </div>

          <h1 className="text-7xl xl:text-8xl font-black leading-[0.95] text-white tracking-tight">
            Welcome
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Back
            </span>
          </h1>

          <p className="text-base text-gray-400 max-w-md mt-6 leading-relaxed">
            Continue your journey, connect with your campus community and discover endless opportunities.
          </p>

          {/* Feature Matrix */}
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl">
            <FeatureCard icon="🎓" title="Smart Campus" subtitle="All your campus needs in one place" />
            <FeatureCard icon="👥" title="Connect & Collaborate" subtitle="Build connections that last forever" />
            <FeatureCard icon="🛡️" title="Secure & Private" subtitle="Your data is safe with us" />
          </div>

          {/* Metrics Horizontal Container */}
          {/* NEW: previously fabricated numbers ("50K+ Students", "250+
              Campuses", etc.) with nothing behind them. Replaced with
              honest capability statements — see the improvement report
              for why this matters for a platform asking people to sign up. */}
          <div className="grid grid-cols-4 gap-2 mt-12 bg-[#040612]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-md max-w-xl w-full">
            <StatsCard number="Real-time" label="Chat & alerts" />
            <StatsCard number="All-in-one" label="Campus tools" />
            <StatsCard number="AI-powered" label="Study help" />
            <StatsCard number="Private" label="By default" />
          </div>
        </div>

        {/* RIGHT COLUMN PANEL: BRIGHT GLOWING CARD HOUSING */}
        <div className="w-full flex flex-col items-center">
          
          {/* Glass Card Container with Target Vibrant Border Effect */}
          <div className="relative w-full max-w-xl bg-[#050713]/70 backdrop-blur-3xl rounded-[32px] p-8 sm:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-purple-500/30 shadow-[0_0_40px_rgba(147,51,234,0.15)] overflow-hidden">
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Hello Again! 👋
              </h2>
              <p className="text-gray-400 text-sm mt-2">Sign in to access your CampusConnect account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-20">
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder=""
                    required
                    className="w-full h-14 pl-12 pr-12 bg-[#02040b]/90 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all duration-300 outline-none text-sm"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 text-xs">✔</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder=""
                    required
                    className="w-full h-14 pl-12 pr-12 bg-[#02040b]/90 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all duration-300 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Forgot Password?
                </Link>
              </div>

              {/* Radiant Vibrant Gradient Submit CTA */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-14 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:opacity-95 transition-all duration-300 shadow-[0_4px_25px_rgba(219,39,119,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </motion.button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-gray-500 font-bold tracking-widest">OR</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* SSO Buttons */}
              <div className="grid sm:grid-cols-2 gap-3">
                <SocialButton text="Google" />
                <SocialButton text="Microsoft" />
              </div>
            </form>

            <p className="text-center text-sm text-gray-400 mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Create Account
              </Link>
            </p>
          </div>

          {/* Bottom Footnote Badge */}
          {/* NEW: replaced fabricated "Trusted by 50,000+ students / 250+
              campuses" claim with something honest and still reassuring. */}
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-950/20 border border-purple-500/10 text-purple-400 text-xs font-medium backdrop-blur-md">
            🛡️ Built for <span className="text-white font-semibold">real campus communities</span> — private by design
          </div>
        </div>

      </motion.div>
    </div>
  )
}