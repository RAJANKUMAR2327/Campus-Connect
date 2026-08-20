import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

// Stores & Sockets
import useThemeStore from './store/themeStore'
import useAuthStore from './store/authStore'
import useSocketStore from './store/socketStore'
import useCallStore from './store/callStore'
import { initSocket } from './socket/socket'

// Components
import PWAInstallBanner from './components/PWAInstallBanner'
import PushPermissionBanner from './components/PushPermissionBanner'
import IncomingCallBanner from './components/IncomingCallBanner'
import VideoCallWindow from './components/VideoCallWindow'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Pages - Auth & General
import Landing from './pages/Landing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile' // NEW: view another user's public profile
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'

// Pages - Features
import Feed from './pages/Feed'
import AnnouncementsBoard from './pages/AnnouncementsBoard'
import CampusMap from './pages/CampusMap'
import CampusSafety from './pages/CampusSafety'
import Wellness from './pages/Wellness'
import VolunteerTracker from './pages/VolunteerTracker'
import Chat from './pages/Chat'
import CampusChat from './pages/CampusChat'
import Notes from './pages/Notes'
import CollabNotes from './pages/CollabNotes'
import CollabEditor from './pages/CollabEditor'
import LostFound from './pages/LostFound'
import Events from './pages/Events'
import EventTicket from './pages/EventTicket'
import Marketplace from './pages/Marketplace'
import Placement from './pages/Placement'
import PlacementDashboard from './pages/PlacementDashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import StudyGroups from './pages/StudyGroups'
import QuestionBank from './pages/QuestionBank'
import Clubs from './pages/Clubs'
import Mentorship from './pages/Mentorship'
import Leaderboard from './pages/Leaderboard'
import Calendar from './pages/Calendar'
import GpaCalculator from './pages/GpaCalculator'
import TaskManager from './pages/TaskManager'
import StudyTimer from './pages/StudyTimer'
import AttendanceTracker from './pages/AttendanceTracker'
import TimetableOptimizer from './pages/TimetableOptimizer'
import ApplicationTracker from './pages/ApplicationTracker'
import InterviewScheduler from './pages/InterviewScheduler'
import AlumniNetwork from './pages/AlumniNetwork'
import ConfessionBoard from './pages/ConfessionBoard'
import LibraryBooking from './pages/LibraryBooking'
import SkillsHub from './pages/SkillsHub'
import VerifyCredential from './pages/VerifyCredential'
import CertificateGenerator from './pages/CertificateGenerator'
import ReferralPortal from './pages/ReferralPortal'
import RideShare from './pages/RideShare'
import Surveys from './pages/Surveys'

// Pages - AI Tools
import AIStudyAssistant from './pages/AIStudyAssistant'
import AIQuizGenerator from './pages/AIQuizGenerator'
import AICareerAssistant from './pages/AICareerAssistant'
import AINoteSummarizer from './pages/AINoteSummarizer'
import AIToolsHub from './pages/AIToolsHub'
import AIConceptExplainer from './pages/AIConceptExplainer'
import AIEssayHelper from './pages/AIEssayHelper'
import AITranslator from './pages/AITranslator'
import WhiteboardsList from './pages/WhiteboardsList'
import WhiteboardPage from './pages/Whiteboard'
import AIResumeScorer from './pages/AIResumeScorer'
import AIMockInterview from './pages/AIMockInterview'

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminNotes from './pages/admin/AdminNotes'
import AdminComments from './pages/admin/AdminComments'
import AdminReports from './pages/admin/AdminReports'
import AdminAuditLog from './pages/admin/AdminAuditLog'
import AdminAnalytics from './pages/admin/AdminAnalytics'

function RootRedirect() {
  const { token } = useAuthStore()
  return <Navigate to={token ? '/dashboard' : '/landing'} replace />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Routes location={location}>
          {/* Core & Auth Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify/:code" element={<VerifyCredential />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/users/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* Protected Feature Routes */}
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><AnnouncementsBoard /></ProtectedRoute>} />
          <Route path="/campus-map" element={<ProtectedRoute><CampusMap /></ProtectedRoute>} />
          <Route path="/safety" element={<ProtectedRoute><CampusSafety /></ProtectedRoute>} />
          <Route path="/wellness" element={<ProtectedRoute><Wellness /></ProtectedRoute>} />
          <Route path="/volunteer" element={<ProtectedRoute><VolunteerTracker /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/campus-chat" element={<ProtectedRoute><CampusChat /></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/notes/collab" element={<ProtectedRoute><CollabNotes /></ProtectedRoute>} />
          <Route path="/notes/collab/:docId" element={<ProtectedRoute><CollabEditor /></ProtectedRoute>} />
          <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id/ticket" element={<ProtectedRoute><EventTicket /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path="/placement" element={<ProtectedRoute><Placement /></ProtectedRoute>} />
          <Route path="/placement-dashboard" element={<ProtectedRoute><PlacementDashboard /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/study-groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
          <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/gpa-calculator" element={<ProtectedRoute><GpaCalculator /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TaskManager /></ProtectedRoute>} />
          <Route path="/study-timer" element={<ProtectedRoute><StudyTimer /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceTracker /></ProtectedRoute>} />
          <Route path="/timetable-optimizer" element={<ProtectedRoute><TimetableOptimizer /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
          <Route path="/interview-scheduler" element={<ProtectedRoute><InterviewScheduler /></ProtectedRoute>} />
          <Route path="/alumni" element={<ProtectedRoute><AlumniNetwork /></ProtectedRoute>} />
          <Route path="/confessions" element={<ProtectedRoute><ConfessionBoard /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><LibraryBooking /></ProtectedRoute>} />
          <Route path="/skills" element={<ProtectedRoute><SkillsHub /></ProtectedRoute>} />
          <Route path="/certificate" element={<ProtectedRoute><CertificateGenerator /></ProtectedRoute>} />
          <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
          <Route path="/rides" element={<ProtectedRoute><RideShare /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/whiteboards" element={<ProtectedRoute><WhiteboardsList /></ProtectedRoute>} />
          <Route path="/whiteboards/:boardId" element={<ProtectedRoute><WhiteboardPage /></ProtectedRoute>} />
          

          {/* Protected AI Tool Routes */}
          <Route path="/ai-study" element={<ProtectedRoute><AIStudyAssistant /></ProtectedRoute>} />
          <Route path="/ai-quiz" element={<ProtectedRoute><AIQuizGenerator /></ProtectedRoute>} />
          <Route path="/ai-career" element={<ProtectedRoute><AICareerAssistant /></ProtectedRoute>} />
          <Route path="/ai-notes" element={<ProtectedRoute><AINoteSummarizer /></ProtectedRoute>} />
          <Route path="/ai-tools" element={<ProtectedRoute><AIToolsHub /></ProtectedRoute>} />
          <Route path="/ai-explain" element={<ProtectedRoute><AIConceptExplainer /></ProtectedRoute>} />
          <Route path="/ai-essay" element={<ProtectedRoute><AIEssayHelper /></ProtectedRoute>} />
          <Route path="/ai-translate" element={<ProtectedRoute><AITranslator /></ProtectedRoute>} />
          <Route path="/ai-resume-score" element={<ProtectedRoute><AIResumeScorer /></ProtectedRoute>} />
          <Route path="/ai-mock-interview" element={<ProtectedRoute><AIMockInterview /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><ReferralPortal /></ProtectedRoute>} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/notes" element={<AdminRoute><AdminNotes /></AdminRoute>} />
          <Route path="/admin/comments" element={<AdminRoute><AdminComments /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/audit-log" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { initTheme } = useThemeStore()
  const { token } = useAuthStore()
  const { setSocket, setOnlineUsers, addOnlineUser, removeOnlineUser, incrementUnread } = useSocketStore()
  const { setIncomingCall } = useCallStore()

  useEffect(() => { initTheme() }, [])

  useEffect(() => {
    if (!token) return
    const socket = initSocket(token)
    setSocket(socket)
    socket.emit('get_online_users')

    socket.on('online_users', (users) => setOnlineUsers(users))
    socket.on('user_online', ({ userId }) => addOnlineUser(userId))
    socket.on('user_offline', ({ userId }) => removeOnlineUser(userId))
    socket.on('new_message', () => incrementUnread())
    socket.on('incoming_call', (callData) => setIncomingCall(callData))

    return () => {
      socket.off('online_users')
      socket.off('user_online')
      socket.off('user_offline')
      socket.off('new_message')
      socket.off('incoming_call')
    }
  }, [token])

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <PWAInstallBanner />
      <PushPermissionBanner />
      <IncomingCallBanner />
      <VideoCallWindow />
      
      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  )
}