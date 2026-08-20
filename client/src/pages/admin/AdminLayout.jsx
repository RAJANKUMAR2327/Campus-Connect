import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  LayoutDashboard, Users, FileText,
  MessageCircle, Shield, LogOut, ChevronLeft, Flag, History } from 'lucide-react'

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/notes', icon: FileText, label: 'Notes' },
  { to: '/admin/comments', icon: MessageCircle, label: 'Comments' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/admin/audit-log', icon: History, label: 'Audit Log' },
]

export default function AdminLayout({ children }) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all
     ${isActive
       ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium'
       : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}`

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Admin Sidebar */}
      <aside className="w-52 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Admin Panel</p>
              <p className="text-[10px] text-gray-400">CampusConnect</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {adminNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} className={linkClass} end={end}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Back + logout */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 w-full transition-colors"
          >
            <ChevronLeft size={14} /> Back to App
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 w-full transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}