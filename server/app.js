// ─── EXPRESS APP (testable) ─────────────────────────────────────────
// This module builds and exports the Express `app` — middleware, every
// route mount, and the global error handler — with NO side effects:
// no mongoose.connect(), no cron.schedule(), no httpServer.listen(),
// no Socket.IO setup. That's intentional: it lets tests (and any other
// consumer) `import app from './app.js'` and drive it with supertest
// against an isolated test database, without booting the real server.
//
// index.js is the actual entry point — it imports `app` from here, then
// layers on the DB connection, Socket.IO, and cron jobs before listening.
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()

import authRoutes from './routes/authRoutes.js'
import noteRoutes from './routes/noteRoutes.js'
import lostFoundRoutes from './routes/lostFoundRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
import placementRoutes from './routes/placementRoutes.js'
import placementStatRoutes from './routes/placementStatRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import postRoutes from './routes/postRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import studyGroupRoutes from './routes/studyGroupRoutes.js'
import clubRoutes from './routes/clubRoutes.js'
import questionRoutes from './routes/questionRoutes.js'
import mentorshipRoutes from './routes/mentorshipRoutes.js'
import collabDocRoutes from './routes/collabDocRoutes.js'
import gamificationRoutes from './routes/gamificationRoutes.js'
import pushRoutes from './routes/pushRoutes.js'
import calendarRoutes from './routes/calendarRoutes.js'
import jobApplicationRoutes from './routes/jobApplicationRoutes.js'
import confessionRoutes from './routes/confessionRoutes.js'
import libraryRoutes from './routes/libraryRoutes.js'
import skillRoutes from './routes/skillRoutes.js'
import callRoutes from './routes/callRoutes.js'
import referralRoutes from './routes/referralRoutes.js'
import digestRoutes from './routes/digestRoutes.js'
import surveyRoutes from './routes/surveyRoutes.js'
import rideRoutes from './routes/rideRoutes.js'
import advancedAnalyticsRoutes from './routes/advancedAnalyticsRoutes.js'
import whiteboardRoutes from './routes/whiteboardRoutes.js'
import gpaRoutes from './routes/gpaRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import campusLocationRoutes from './routes/campusLocationRoutes.js'
import alumniRoutes from './routes/alumniRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import studySessionRoutes from './routes/studySessionRoutes.js'
import safetyRoutes from './routes/safetyRoutes.js'
import counselingRoutes from './routes/counselingRoutes.js'
import volunteerRoutes from './routes/volunteerRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import privacyRoutes from './routes/privacyRoutes.js'
import userRoutes from './routes/userRoutes.js' // NEW: public profiles + follow/connect

// ─── CORS ALLOW-LIST ─────────────────────────────────────────────
// Shared with Socket.IO's CORS config in index.js (imported from here)
// so the two never drift out of sync.
export const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin)

export const corsOriginCheck = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}

const app = express()

// PRODUCTION CONFIG FIX: this app is deployed on Render (see README), which
// sits in front of the Node process as a single reverse-proxy hop. Without
// `trust proxy` set, Express's `req.ip` resolves to Render's internal
// proxy address for every request — not the real client IP — which means
// every IP-keyed rate limiter below (login/register/password-reset/etc.,
// see middleware/rateLimiters.js) collapses onto one shared bucket for all
// traffic. In practice that makes brute-force protection close to
// meaningless: one attacker's requests are indistinguishable from anyone
// else's, and legitimate users can get rate-limited by unrelated traffic.
//
// `1` means "trust exactly one hop" — use the IP the nearest proxy reports
// via X-Forwarded-For, but don't blindly trust an attacker-supplied chain
// of forwarded-for entries beyond that. This must be set before any
// middleware (rate limiters, etc.) that reads req.ip. If this app is ever
// deployed behind an additional layer (e.g. a CDN in front of Render), this
// number needs to increase to match the real hop count — see
// https://expressjs.com/en/guide/behind-proxies.html.
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/lost-found', lostFoundRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/placement', placementRoutes)
app.use('/api/placement-stats', placementStatRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/study-groups', studyGroupRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/clubs', clubRoutes)
app.use('/api/mentorship', mentorshipRoutes)
app.use('/api/collab-docs', collabDocRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/applications', jobApplicationRoutes)
app.use('/api/confessions', confessionRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/calls', callRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/digest', digestRoutes)
app.use('/api/surveys', surveyRoutes)
app.use('/api/rides', rideRoutes)
app.use('/api/admin/analytics', advancedAnalyticsRoutes)
app.use('/api/whiteboards', whiteboardRoutes)
app.use('/api/gpa', gpaRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/campus-locations', campusLocationRoutes)
app.use('/api/alumni', alumniRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/study-sessions', studySessionRoutes)
app.use('/api/safety', safetyRoutes)
app.use('/api/counseling', counselingRoutes)
app.use('/api/volunteer', volunteerRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/privacy', privacyRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// SECURITY FIX: previously raw err.message (which can contain internal
// details from Mongoose/driver/library errors) was always sent to the
// client. Now only errors explicitly marked "safe" (err.status set by our
// own code, e.g. the CORS check above) forward their message; anything
// unexpected gets a generic message. Full detail is still logged server-side.
app.use((err, req, res, next) => {
  console.error(err.stack)
  const isSafeAppError = typeof err.status === 'number'
  res.status(err.status || 500).json({
    message: isSafeAppError ? err.message : 'Something went wrong. Please try again.',
  })
})

export default app
