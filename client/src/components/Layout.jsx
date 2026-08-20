import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'
import AvatarMenu from './AvatarMenu'
import useSectionStore from '../store/sectionStore'
import { getTheme } from '../styles/tokens'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

export default function Layout({ children }) {
  const { currentSection } = useSectionStore()
  const theme = getTheme(currentSection)
  const location = useLocation()

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme.bg}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — changes color per section */}
        <div className={`
          sticky top-0 z-30 px-4 md:px-6 py-3
          flex items-center justify-between
          border-b backdrop-blur-xl
          mt-12 md:mt-0
          transition-all duration-500
          ${theme.topbar} ${theme.topbarBorder}
        `}>
          <div className="flex items-center gap-3">
            {/* Section indicator dot */}
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.gradient} hidden md:block`} />
            <span className={`text-xs font-semibold capitalize hidden md:block ${theme.text}`}>
              {currentSection === 'lostfound' ? 'Lost & Found' : currentSection}
            </span>
          </div>
          
          {/* Topbar Actions */}
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <NotificationBell />
            <LanguageSwitcher /> {/* Added right here */}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 hidden md:block" />
            <AvatarMenu />
          </div>
        </div>

        {/* Page content with fade transition */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`
              flex-1 p-4 md:p-6 overflow-y-auto
              bg-gradient-to-b ${theme.pageGradient}
              transition-all duration-500
            `}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}