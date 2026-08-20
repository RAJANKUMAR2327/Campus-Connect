import { Link } from 'react-router-dom'

const illustrations = {
  notes: (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto mb-4" fill="none">
      <rect x="20" y="15" width="80" height="95" rx="8" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2"/>
      <rect x="20" y="15" width="80" height="95" rx="8" className="dark:fill-indigo-900/30 dark:stroke-indigo-800"/>
      <line x1="35" y1="40" x2="85" y2="40" stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round"/>
      <line x1="35" y1="55" x2="85" y2="55" stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round"/>
      <line x1="35" y1="70" x2="65" y2="70" stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="90" cy="90" r="18" fill="#6366F1"/>
      <line x1="90" y1="83" x2="90" y2="97" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="83" y1="90" x2="97" y2="90" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  lostfound: (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto mb-4" fill="none">
      <circle cx="52" cy="52" r="30" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="2"/>
      <circle cx="52" cy="52" r="30" className="dark:fill-amber-900/30 dark:stroke-amber-700"/>
      <circle cx="52" cy="52" r="18" fill="#FDE68A" className="dark:fill-amber-800/50"/>
      <line x1="74" y1="74" x2="95" y2="95" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="52" cy="52" r="5" fill="#D97706"/>
    </svg>
  ),
  events: (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto mb-4" fill="none">
      <rect x="15" y="25" width="90" height="80" rx="10" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="2"/>
      <rect x="15" y="25" width="90" height="80" rx="10" className="dark:fill-green-900/30 dark:stroke-green-800"/>
      <rect x="15" y="25" width="90" height="28" rx="10" fill="#4ADE80" className="dark:fill-green-700"/>
      <rect x="15" y="43" width="90" height="10" fill="#4ADE80" className="dark:fill-green-700"/>
      <line x1="40" y1="15" x2="40" y2="35" stroke="#16A34A" strokeWidth="3" strokeLinecap="round"/>
      <line x1="80" y1="15" x2="80" y2="35" stroke="#16A34A" strokeWidth="3" strokeLinecap="round"/>
      <rect x="30" y="65" width="18" height="18" rx="4" fill="#BBF7D0" className="dark:fill-green-800"/>
      <rect x="55" y="65" width="18" height="18" rx="4" fill="#BBF7D0" className="dark:fill-green-800"/>
      <rect x="72" y="65" width="18" height="18" rx="4" fill="#86EFAC" className="dark:fill-green-700"/>
    </svg>
  ),
  marketplace: (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto mb-4" fill="none">
      <path d="M20 45 L30 20 L90 20 L100 45" stroke="#F9A8D4" strokeWidth="2" fill="#FCE7F3" className="dark:fill-pink-900/30 dark:stroke-pink-800"/>
      <rect x="15" y="45" width="90" height="60" rx="8" fill="#FCE7F3" stroke="#F9A8D4" strokeWidth="2" className="dark:fill-pink-900/30 dark:stroke-pink-800"/>
      <path d="M45 45 C45 32 75 32 75 45" stroke="#EC4899" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="38" cy="20" r="5" fill="#F472B6"/>
      <circle cx="82" cy="20" r="5" fill="#F472B6"/>
    </svg>
  ),
  placement: (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto mb-4" fill="none">
      <rect x="20" y="35" width="80" height="60" rx="8" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" className="dark:fill-blue-900/30 dark:stroke-blue-800"/>
      <rect x="42" y="20" width="36" height="25" rx="6" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="2" className="dark:fill-blue-800/50 dark:stroke-blue-700"/>
      <line x1="35" y1="60" x2="85" y2="60" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="72" x2="75" y2="72" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="84" x2="65" y2="84" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto mb-4" fill="none">
      <circle cx="60" cy="60" r="45" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" className="dark:fill-gray-800 dark:stroke-gray-700"/>
      <path d="M45 55 Q60 40 75 55" stroke="#9CA3AF" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="48" cy="50" r="4" fill="#9CA3AF"/>
      <circle cx="72" cy="50" r="4" fill="#9CA3AF"/>
      <path d="M45 72 Q60 65 75 72" stroke="#9CA3AF" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  ) }

export default function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {illustrations[type] || illustrations.default}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && (
        onAction ? (
          <button
            onClick={onAction}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {actionLabel}
          </button>
        ) : actionTo ? (
          <Link
            to={actionTo}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {actionLabel}
          </Link>
        ) : null
      )}
    </div>
  )
}