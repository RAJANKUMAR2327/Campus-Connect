import { motion } from 'framer-motion'
import useSectionStore from '../store/sectionStore'
import { getTheme } from '../styles/tokens'

export default function PageHeader({ title, subtitle, action }) {
  const { currentSection } = useSectionStore()
  const theme = getTheme(currentSection)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {subtitle && (
          <p className={`text-sm mt-0.5 font-medium ${theme.text}`}>{subtitle}</p>
        )}
      </div>
      {action && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className={`flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all ${theme.button}`}
          style={{ boxShadow: theme.buttonShadow }}
        >
          {action.icon && <action.icon size={15} />}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}