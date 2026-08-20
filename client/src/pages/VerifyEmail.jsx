import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const token = searchParams.get('token')
  const emailFromState = location.state?.email || ''

  // Three phases:
  //  - 'pending'    : no token yet, show "check your inbox" + resend
  //  - 'verifying'  : token present, calling the API
  //  - 'verified'   : token confirmed
  //  - 'failed'     : token invalid/expired
  const [phase, setPhase] = useState(token ? 'verifying' : 'pending')
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const hasVerified = useRef(false)

  // ---- Verify token on mount if present ----
  useEffect(() => {
    if (!token || hasVerified.current) return
    hasVerified.current = true

    const verify = async () => {
      try {
        const { data } = await api.post('/auth/verify-email', { token })
        setPhase('verified')
        if (data?.token) {
          setAuth(data.token, data.user)
        }
        toast.success('Email verified! Welcome to CampusConnect 🎉')
        setTimeout(() => navigate(data?.token ? '/dashboard' : '/login'), 1800)
      } catch (err) {
        setPhase('failed')
        toast.error(err.response?.data?.message || 'This verification link is invalid or has expired.')
      }
    }

    verify()
  }, [token, navigate, setAuth])

  // ---- Resend cooldown timer ----
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    if (!emailFromState) {
      toast.error('We lost track of your email — please register again or check your inbox.')
      return
    }
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: emailFromState })
      toast.success('Verification email sent.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend the email. Try again shortly.')
    } finally {
      setResending(false)
    }
  }, [emailFromState])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow"
          >
            <span className="text-white font-bold text-2xl">CC</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-1">One last step to activate your account</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10 text-center">
          <AnimatePresence mode="wait">

            {phase === 'pending' && (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Mail size={28} className="text-indigo-400" />
                </motion.div>
                <p className="text-white font-medium">Check your inbox</p>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a verification link
                  {emailFromState && (
                    <> to <span className="text-gray-300">{emailFromState}</span></>
                  )}
                  . Click it to activate your account.
                </p>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  aria-busy={resending}
                  className="mt-6 w-full btn-primary rounded-xl py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : cooldown > 0 ? (
                    <>Resend available in {cooldown}s</>
                  ) : (
                    <><RefreshCw size={16} /> Resend Verification Email</>
                  )}
                </button>
              </motion.div>
            )}

            {phase === 'verifying' && (
              <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <div className="w-9 h-9 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-white font-medium">Verifying your email…</p>
                <p className="text-sm text-gray-500 mt-1">This will just take a moment.</p>
              </motion.div>
            )}

            {phase === 'verified' && (
              <motion.div key="verified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                  className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle size={26} className="text-green-400" />
                </motion.div>
                <p className="text-white font-medium">Welcome to CampusConnect</p>
                <p className="text-sm text-gray-500 mt-1">Your account has been verified. Redirecting…</p>
              </motion.div>
            )}

            {phase === 'failed' && (
              <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle size={26} className="text-red-400" />
                </div>
                <p className="text-white font-medium">Link invalid or expired</p>
                <p className="text-sm text-gray-500 mt-1">
                  Verification links expire after a while. Request a new one below.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  aria-busy={resending}
                  className="mt-6 w-full btn-primary rounded-xl py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : cooldown > 0 ? (
                    <>Resend available in {cooldown}s</>
                  ) : (
                    <><RefreshCw size={16} /> Send New Link</>
                  )}
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mt-6"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
