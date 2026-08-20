import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { z } from 'zod'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Lock,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
} from 'lucide-react'

// Asset Imports
// IMAGE-SIZE FIX: see Login.jsx's identical fix. register.png was
// 5.4MB at 3002x1408 for a 60%-viewport-width background — resized and
// converted to WebP (5.4MB → 47KB), visually verified against the
// original before replacing.
import registerBg from '../assets/register.webp'
import logo from '../assets/logo-glow.webp'

// Effects (already present in the codebase from earlier work on this page)
import Aurora from '../components/Aurora'
import Stars from '../components/Stars'
import FloatingParticles from '../components/FloatingParticles'
import MouseGlow from '../components/MouseGlow'

// =========================================================================
// VALIDATION SCHEMA
// =========================================================================

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    college: z.string().trim().min(2, 'Enter your college / institute name'),
    branch: z.string().min(1, 'Select your branch'),
    year: z.string().min(1, 'Select your year'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Add at least one uppercase letter')
      .regex(/[0-9]/, 'Add at least one number'),
    confirmPassword: z.string(),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms & Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// =========================================================================
// PASSWORD STRENGTH HELPER
// =========================================================================

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-white/10' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  if (score === 4) return { score: 3, label: 'Good', color: 'bg-blue-500' }
  return { score: 4, label: 'Strong', color: 'bg-green-500' }
}

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

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-400">
      {message}
    </p>
  )
}

function TextField({
  id,
  label,
  icon: Icon,
  error,
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full h-14 pl-12 pr-4 bg-[#02040b]/90 border rounded-xl text-white placeholder-gray-600 focus:ring-1 transition-all duration-300 outline-none text-sm ${
            error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
          }`}
          {...inputProps}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    college: '',
    branch: '',
    year: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password])

  const updateField = (field) => (e) => {
    const value = field === 'agreeTerms' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setFormError('')

    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      toast.error('Please fix the highlighted fields')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
        college: result.data.college,
        branch: result.data.branch,
        year: result.data.year,
      })

      setSuccess(true)

      // If the backend requires email verification before login, it should
      // omit `token` in the response - handle both flows gracefully.
      if (data.token) {
        setAuth(data.token, data.user)
        toast.success(`Welcome to CampusConnect, ${data.user.name.split(' ')[0]}!`)
        setTimeout(() => navigate('/dashboard'), 600)
      } else {
        toast.success('Account created! Please check your email to verify your account.')
        setTimeout(
          () => navigate('/verify-email', { state: { email: result.data.email } }),
          1200
        )
      }
    } catch (err) {
      handleRegisterError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleRegisterError(err) {
    // No response at all: network down, CORS failure, or backend unreachable.
    if (!err.response) {
      if (err.code === 'ECONNABORTED') {
        const msg = 'The request timed out. Please check your connection and try again.'
        setFormError(msg)
        toast.error(msg)
        return
      }
      const msg = "Can't reach the server right now. Check your internet connection and try again."
      setFormError(msg)
      toast.error(msg)
      return
    }

    const { status, data } = err.response

    switch (status) {
      case 400: {
        // Backend validation error — may include field-level details.
        const fieldErrors = {}
        if (Array.isArray(data?.errors)) {
          for (const fieldErr of data.errors) {
            const key = fieldErr.field || fieldErr.path
            if (key && !fieldErrors[key]) fieldErrors[key] = fieldErr.message
          }
        }
        if (Object.keys(fieldErrors).length) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }))
        }
        const msg = data?.message || 'Some details are invalid. Please review the form.'
        setFormError(msg)
        toast.error(msg)
        break
      }
      case 409: {
        const msg = data?.message || 'An account with this email already exists.'
        setErrors((prev) => ({ ...prev, email: msg }))
        setFormError(msg)
        toast.error(msg)
        break
      }
      case 422: {
        const msg = data?.message || 'The server could not process these details.'
        setFormError(msg)
        toast.error(msg)
        break
      }
      case 429: {
        const msg = 'Too many attempts. Please wait a moment before trying again.'
        setFormError(msg)
        toast.error(msg)
        break
      }
      case 500:
      case 502:
      case 503:
      case 504: {
        const msg = 'Something went wrong on our end. Please try again in a moment.'
        setFormError(msg)
        toast.error(msg)
        break
      }
      default: {
        const msg = data?.message || 'Registration failed. Please try again.'
        setFormError(msg)
        toast.error(msg)
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#030307] relative overflow-hidden flex items-center justify-center px-6 py-12 lg:py-16">

      {/* BACKDROP: image, overlay & ambient effects */}
      <div className="absolute top-0 left-0 w-full lg:w-[60%] h-full z-0 pointer-events-none">
        <img
          src={registerBg}
          className="w-full h-full object-cover object-left opacity-75 select-none"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#030307]/40 to-[#030307]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030307] via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none">
        <Aurora />
        <Stars />
        <FloatingParticles />
      </div>
      <MouseGlow />

      <div className="absolute top-[15%] left-[30%] w-[550px] h-[550px] rounded-full border border-purple-500/10 pointer-events-none shadow-[0_0_100px_rgba(147,51,234,0.08)]" />
      <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* INTERFACE CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 max-w-7xl w-full grid lg:grid-cols-2 gap-12 xl:gap-20 items-center"
      >

        {/* LEFT COLUMN */}
        <div className="hidden lg:block relative z-20">
          <div className="flex items-center gap-3 mb-10">
            <img src={logo} className="w-9 h-9 object-contain" alt="Campus Connect Logo" />
            <span className="text-white font-bold text-xl tracking-tight">
              Campus<span className="text-purple-400">Connect</span>
            </span>
          </div>

          <div className="inline-flex px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 mb-6 font-semibold text-xs tracking-wider">
            JOIN THE COMMUNITY
          </div>

          <h1 className="text-6xl xl:text-7xl font-black leading-[0.95] text-white tracking-tight">
            Create Your
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Account
            </span>
          </h1>

          <p className="text-base text-gray-400 max-w-md mt-6 leading-relaxed">
            Connect with your campus peers, track your academics, and unlock every tool CampusConnect has to offer.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl">
            <FeatureCard icon="🎓" title="Smart Campus" subtitle="All your campus needs in one place" />
            <FeatureCard icon="👥" title="Connect & Collaborate" subtitle="Build connections that last forever" />
            <FeatureCard icon="🛡️" title="Secure & Private" subtitle="Your data is safe with us" />
          </div>
        </div>

        {/* RIGHT COLUMN: FORM CARD */}
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-xl bg-[#050713]/70 backdrop-blur-3xl rounded-[32px] p-8 sm:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-purple-500/30 shadow-[0_0_40px_rgba(147,51,234,0.15)] overflow-hidden">

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Create Account ✨</h2>
              <p className="text-gray-400 text-sm mt-2">Join CampusConnect in under a minute</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5 relative z-20" aria-busy={loading}>

              <TextField
                id="fullName"
                label="Full Name"
                icon={User}
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={updateField('fullName')}
                error={errors.fullName}
                required
              />

              <TextField
                id="email"
                label="Email Address"
                icon={Mail}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={updateField('email')}
                error={errors.email}
                required
              />

              <TextField
                id="college"
                label="College / Institute"
                icon={Building}
                type="text"
                autoComplete="organization"
                value={form.college}
                onChange={updateField('college')}
                error={errors.college}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="branch" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Branch
                  </label>
                  <select
                    id="branch"
                    value={form.branch}
                    onChange={updateField('branch')}
                    aria-invalid={!!errors.branch}
                    aria-describedby={errors.branch ? 'branch-error' : undefined}
                    required
                    className={`w-full h-14 px-4 bg-[#02040b]/90 border rounded-xl text-white focus:ring-1 transition-all duration-300 outline-none text-sm ${
                      errors.branch
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  >
                    <option value="" disabled>Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="ME">Mechanical</option>
                    <option value="CE">Civil</option>
                    <option value="Other">Other</option>
                  </select>
                  <FieldError id="branch-error" message={errors.branch} />
                </div>

                <div>
                  <label htmlFor="year" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Year
                  </label>
                  <select
                    id="year"
                    value={form.year}
                    onChange={updateField('year')}
                    aria-invalid={!!errors.year}
                    aria-describedby={errors.year ? 'year-error' : undefined}
                    required
                    className={`w-full h-14 px-4 bg-[#02040b]/90 border rounded-xl text-white focus:ring-1 transition-all duration-300 outline-none text-sm ${
                      errors.year
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  >
                    <option value="" disabled>Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                  <FieldError id="year-error" message={errors.year} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={updateField('password')}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                    required
                    className={`w-full h-14 pl-12 pr-12 bg-[#02040b]/90 border rounded-xl text-white placeholder-gray-600 focus:ring-1 transition-all duration-300 outline-none text-sm ${
                      errors.password
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {form.password && (
                  <div id="password-strength" className="mt-2">
                    <div className="flex gap-1.5 h-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors duration-300 ${
                            i < strength.score ? strength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {strength.label && <>Password strength: <span className="text-gray-300">{strength.label}</span></>}
                    </p>
                  </div>
                )}
                <FieldError id="password-error" message={errors.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    required
                    className={`w-full h-14 pl-12 pr-12 bg-[#02040b]/90 border rounded-xl text-white placeholder-gray-600 focus:ring-1 transition-all duration-300 outline-none text-sm ${
                      errors.confirmPassword
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError id="confirmPassword-error" message={errors.confirmPassword} />
              </div>

              {/* Terms */}
              <div>
                <label htmlFor="agreeTerms" className="flex items-start gap-3 cursor-pointer select-none">
                  <span className="relative flex-shrink-0 mt-0.5">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={updateField('agreeTerms')}
                      aria-invalid={!!errors.agreeTerms}
                      aria-describedby={errors.agreeTerms ? 'agreeTerms-error' : undefined}
                      className="peer sr-only"
                    />
                    <span className="w-5 h-5 flex items-center justify-center rounded-md border border-white/20 bg-[#02040b]/90 peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-colors">
                      {form.agreeTerms && <Check size={14} className="text-white" />}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-purple-400 hover:text-purple-300 font-medium">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-purple-400 hover:text-purple-300 font-medium">Privacy Policy</Link>
                  </span>
                </label>
                <FieldError id="agreeTerms-error" message={errors.agreeTerms} />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  <span className="mt-0.5">⚠</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || success}
                aria-busy={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="w-full h-14 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:opacity-95 transition-all duration-300 shadow-[0_4px_25px_rgba(219,39,119,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : success ? (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={18} /> Account Created
                  </motion.span>
                ) : (
                  <>Register Now <ArrowRight size={16} /></>
                )}
              </motion.button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-950/20 border border-purple-500/10 text-purple-400 text-xs font-medium backdrop-blur-md">
            🛡️ Built for <span className="text-white font-semibold">real campus communities</span> — private by design
          </div>
        </div>

      </motion.div>
    </div>
  )
}
