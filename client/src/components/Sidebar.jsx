import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import useSectionStore from '../store/sectionStore'
import XPBar from './XPBar'
import { PenTool } from 'lucide-react'

import {
  LayoutDashboard, FileText, Search, Calendar,
  ShoppingBag, Briefcase, User, Settings,
  LogOut, Sun, Moon, Menu, X, TrendingUp,
  Sparkles, BookOpen, Shield, Rss, 
  MessageCircle, Users, HelpCircle, Trophy, 
  CalendarDays, MessageSquareText, ClipboardList, Calculator, ClipboardCheck, CalendarClock, Megaphone, MapPinned, CalendarCheck2, GraduationCap, CheckSquare, Timer, Siren, HeartHandshake, HandHeart, Globe2,
  Car, BarChart2, FileSearch, Award, ChevronDown
} from 'lucide-react'

const sectionActiveStyles = {
  dashboard: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  notes: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  lostfound: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  events: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  marketplace: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  placement: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' }

function NavGroup({ title, items, setSection, onClose, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <button
        type="button"
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        aria-expanded={collapsible ? open : undefined}
        className={`w-full flex items-center justify-between px-3 mb-1 mt-4 first:mt-2 ${collapsible ? 'cursor-pointer group/header' : ''}`}
      >
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
          {title}
        </p>
        {collapsible && (
          <ChevronDown
            size={12}
            className={`text-gray-300 dark:text-gray-700 group-hover/header:text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {items.map(({ to, icon: Icon, label, section, dot }) => (
              <NavLink
                key={to} to={to}
                onClick={() => { setSection(section); onClose() }}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-xl text-sm transition-all duration-200 relative group
                   ${isActive
                     ? sectionActiveStyles[section] + ' font-medium'
                     : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Colored dot indicator */}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${isActive ? dot : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400'}`} />
                    <Icon size={15} className="shrink-0" />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarInner({ user, theme, toggleTheme, handleLogout, onClose }) {
  const { t } = useTranslation()
  const { setSection } = useSectionStore()

  // Localized Navigation Items mapped inside render to resolve hook values
  // NEW: previously one flat 39-item "Main" list plus a separate "AI Tools"
  // list of 4 more — 43+ items at a single hierarchy level with no
  // grouping. Regrouped into named categories (collapsible, so the person
  // isn't confronted with everything at once) per the UI audit's P0
  // recommendation. Every item's `to`/`icon`/`label`/`section`/`dot` is
  // UNCHANGED from before — only which visual group it renders under has
  // changed, since `section` also drives per-page active-state color and
  // is re-asserted independently by each page via useSection() on mount.
  const homeItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), section: 'dashboard', dot: 'bg-indigo-500' },
  ]

  const discoverItems = [
    { to: '/feed', icon: Rss, label: t('nav.campusFeed', 'Campus Feed'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/announcements', icon: Megaphone, label: t('nav.announcements', 'Announcements'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/chat', icon: MessageCircle, label: t('nav.messages', 'Messages'), section: 'dashboard', dot: 'bg-green-500' },
    { to: '/campus-chat', icon: Globe2, label: t('nav.campusChat', 'Campus Chat'), section: 'dashboard', dot: 'bg-green-500' },
    { to: '/clubs', icon: Award, label: t('nav.studentClubs', 'Student Clubs'), section: 'events', dot: 'bg-green-500' },
    { to: '/events', icon: Calendar, label: t('nav.events'), section: 'events', dot: 'bg-green-500' },
    { to: '/marketplace', icon: ShoppingBag, label: t('nav.marketplace'), section: 'marketplace', dot: 'bg-pink-500' },
    { to: '/leaderboard', icon: Trophy, label: t('nav.leaderboard', 'Leaderboard'), section: 'dashboard', dot: 'bg-amber-500' },
    { to: '/rides', icon: Car, label: t('nav.rideShare', 'Ride Share'), section: 'events', dot: 'bg-green-500' },
  ]

  const academicsItems = [
    { to: '/notes', icon: FileText, label: t('nav.notes'), section: 'notes', dot: 'bg-indigo-500' },
    { to: '/study-groups', icon: Users, label: t('nav.studyGroups', 'Study Groups'), section: 'notes', dot: 'bg-indigo-500' },
    { to: '/question-bank', icon: HelpCircle, label: t('nav.questionBank', 'Question Bank'), section: 'notes', dot: 'bg-indigo-500' },
    { to: '/library', icon: BookOpen, label: t('nav.libraryBooking', 'Library Booking'), section: 'notes', dot: 'bg-indigo-500' },
    { to: '/whiteboards', icon: PenTool, label: 'Whiteboards', section: 'notes', dot: 'bg-indigo-500' },
    { to: '/gpa-calculator', icon: Calculator, label: t('nav.gpaCalculator', 'GPA Calculator'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/attendance', icon: ClipboardCheck, label: t('nav.attendance', 'Attendance'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/timetable-optimizer', icon: CalendarClock, label: t('nav.timetableOptimizer', 'Timetable Optimizer'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/skills', icon: Shield, label: t('nav.skillsBadges', 'Skills & Badges'), section: 'placement', dot: 'bg-amber-500' },
  ]

  const careerItems = [
    { to: '/placement', icon: Briefcase, label: t('nav.placement'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/placement-dashboard', icon: TrendingUp, label: t('nav.stats', 'Stats'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/resume-builder', icon: FileText, label: t('nav.resume', 'Resume'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/applications', icon: Briefcase, label: t('nav.applications', 'Applications'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/interview-scheduler', icon: CalendarCheck2, label: t('nav.interviewScheduler', 'Interview Scheduler'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/mentorship', icon: User, label: t('nav.mentorship', 'Mentorship'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/alumni', icon: GraduationCap, label: t('nav.alumniNetwork', 'Alumni Network'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/ai-resume-score', icon: FileSearch, label: t('nav.resumeScore', 'Resume Score'), section: 'placement', dot: 'bg-blue-500' },
    { to: '/ai-mock-interview', icon: Sparkles, label: t('nav.mockInterview', 'Mock Interview'), section: 'placement', dot: 'bg-purple-500' },
    { to: '/referrals', icon: Award, label: t('nav.referrals', 'Referrals'), section: 'placement', dot: 'bg-blue-500' },
  ]

  const campusItems = [
    { to: '/campus-map', icon: MapPinned, label: t('nav.campusMap', 'Campus Map'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/safety', icon: Siren, label: t('nav.campusSafety', 'Campus Safety'), section: 'dashboard', dot: 'bg-red-500' },
    { to: '/wellness', icon: HeartHandshake, label: t('nav.wellness', 'Wellness'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/volunteer', icon: HandHeart, label: t('nav.volunteerHours', 'Volunteer Hours'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/lost-found', icon: Search, label: t('nav.lostFound'), section: 'lostfound', dot: 'bg-amber-500' },
    { to: '/confessions', icon: MessageSquareText, label: t('nav.confessions', 'Confessions'), section: 'dashboard', dot: 'bg-purple-500' },
    { to: '/surveys', icon: ClipboardList, label: t('nav.surveysPolls', 'Surveys & Polls'), section: 'dashboard', dot: 'bg-indigo-500' },
  ]

  // AI consolidated to a single hub entry — the hub page already links out
  // to all 10 AI sub-tools (confirmed in AIToolsHub.jsx), so the 4 separate
  // sidebar links that used to point directly at ai-study/ai-quiz/ai-career/
  // ai-notes were pure duplication, not the only way to reach those pages.
  const toolsItems = [
    { to: '/ai-tools', icon: Sparkles, label: t('nav.aiToolsHub', 'AI Tools Hub'), section: 'notes', dot: 'bg-purple-500' },
    { to: '/calendar', icon: CalendarDays, label: t('nav.calendar', 'Calendar'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/tasks', icon: CheckSquare, label: t('nav.tasks', 'Tasks'), section: 'dashboard', dot: 'bg-indigo-500' },
    { to: '/study-timer', icon: Timer, label: t('nav.studyTimer', 'Study Timer'), section: 'dashboard', dot: 'bg-indigo-500' },
  ]


  const bottomItems = [
    { to: '/profile', icon: User, label: t('nav.profile', 'Profile'), section: 'dashboard', dot: 'bg-gray-400' },
    { to: '/settings', icon: Settings, label: t('nav.settings', 'Settings'), section: 'dashboard', dot: 'bg-gray-400' },
    { to: '/certificate', icon: Award, label: t('nav.certificate', 'Certificate'), section: 'dashboard', dot: 'bg-amber-400' },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
            CC
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">CampusConnect</p>
            <p className="text-[9px] text-gray-400 truncate max-w-[110px]">{user?.college}</p>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1 py-2 overflow-y-auto">
        <NavGroup title={t('nav.titleHome', 'Home')} items={homeItems} setSection={setSection} onClose={onClose} />
        <NavGroup title={t('nav.titleDiscover', 'Discover')} items={discoverItems} setSection={setSection} onClose={onClose} />
        <NavGroup title={t('nav.titleAcademics', 'Academics')} items={academicsItems} setSection={setSection} onClose={onClose} collapsible defaultOpen={false} />
        <NavGroup title={t('nav.titleCareer', 'Career')} items={careerItems} setSection={setSection} onClose={onClose} collapsible defaultOpen={false} />
        <NavGroup title={t('nav.titleCampus', 'Campus')} items={campusItems} setSection={setSection} onClose={onClose} collapsible defaultOpen={false} />
        <NavGroup title={t('nav.titleTools', 'Tools')} items={toolsItems} setSection={setSection} onClose={onClose} collapsible defaultOpen={false} />
        <NavGroup title={t('nav.titleYou', 'You')} items={bottomItems} setSection={setSection} onClose={onClose} />

        {user?.role === 'admin' && (
          <>
            <p className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wider px-3 mb-1 mt-4">
              {t('nav.admin', 'Admin')}
            </p>
            <NavLink to="/admin/analytics"
              onClick={() => { setSection('dashboard'); onClose() }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-xl text-sm transition-all duration-200
                 ${isActive ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`
              }>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <BarChart2 size={15} />
              {t('nav.analytics', 'Analytics')}
            </NavLink>
            <NavLink to="/admin"
              onClick={() => { setSection('dashboard'); onClose() }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-xl text-sm transition-all duration-200
                 ${isActive ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`
              }>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <Shield size={15} />
              {t('nav.adminPanel', 'Admin Panel')}
            </NavLink>
          </>
        )}
      </nav>

      {/* XP Progress Bar */}
      <div className="px-2 py-2">
        <XPBar />
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'light'
            ? <Moon size={14} className="text-indigo-400" />
            : <Sun size={14} className="text-amber-400" />
          }
          {theme === 'light' ? t('nav.darkMode') : t('nav.lightMode')}
        </button>
      </div>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">{user?.name?.charAt(0)}</div>
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-[9px] text-gray-400">{user?.branch} · Y{user?.year}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          <LogOut size={12} /> {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const props = {
    user, theme, toggleTheme, handleLogout,
    onClose: () => setMobileOpen(false) }

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-500 flex items-center justify-center text-white font-bold text-xs">CC</div>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">CampusConnect</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-1">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="md:hidden fixed top-0 left-0 h-full w-60 z-50 shadow-2xl"
          >
            <SidebarInner {...props} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 h-screen sticky top-0 shadow-sm">
        <SidebarInner {...props} />
      </aside>
    </>
  )
}