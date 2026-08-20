import { useSection } from '../hooks/useSection'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import {
  Bell, MessageCircle, Heart, Calendar,
  Briefcase, Search, CheckCheck, Trash2, Info } from 'lucide-react'

const typeConfig = {
  comment: { icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' },
  event: { icon: Calendar, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30' },
  placement: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  lostfound: { icon: Search, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  system: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' } }

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Notifications() {
  useSection('dashboard')
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx for the first
  // page migrated this way. Simpler here — no pagination, just one list
  // query plus three mutations, each now optimistic with rollback on
  // failure (the original code waited for each request to succeed before
  // updating the UI at all; these are fast, frequent actions where
  // instant feedback is worth the small rollback-on-rare-failure cost).
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data
    },
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const handleMarkAllRead = async () => {
    const previous = queryClient.getQueryData(['notifications'])
    queryClient.setQueryData(['notifications'], (old) => old && ({
      ...old,
      notifications: old.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
    try {
      await api.patch('/notifications/read-all')
      toast.success('All marked as read!')
    } catch {
      queryClient.setQueryData(['notifications'], previous)
      toast.error('Failed')
    }
  }

  const handleDelete = async (id) => {
    const previous = queryClient.getQueryData(['notifications'])
    queryClient.setQueryData(['notifications'], (old) => old && ({
      ...old,
      notifications: old.notifications.filter((n) => n._id !== id),
    }))
    try {
      await api.delete(`/notifications/${id}`)
    } catch {
      queryClient.setQueryData(['notifications'], previous)
      toast.error('Failed')
    }
  }

  const handleMarkRead = async (id) => {
    const previous = queryClient.getQueryData(['notifications'])
    queryClient.setQueryData(['notifications'], (old) => old && ({
      ...old,
      notifications: old.notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, old.unreadCount - 1),
    }))
    try {
      await api.patch(`/notifications/${id}/read`)
    } catch {
      queryClient.setQueryData(['notifications'], previous)
      toast.error('Failed')
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              All caught up!
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No notifications yet. Stay active on campus!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const config = typeConfig[notif.type] || typeConfig.system
              const Icon = config.icon

              return (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && handleMarkRead(notif._id)}
                  className={`relative bg-white dark:bg-gray-900 rounded-xl border transition-all cursor-pointer group
                    ${notif.read
                      ? 'border-gray-100 dark:border-gray-800'
                      : 'border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/10'
                    }`}
                >
                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}

                  <div className="flex gap-3 p-4">
                    <div className={`${config.bg} p-2.5 rounded-lg shrink-0 h-fit`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {notif.actor && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[9px] font-bold text-indigo-600 overflow-hidden">
                              {notif.actor?.avatar
                                ? <img src={notif.actor.avatar} alt="" className="w-full h-full object-cover" />
                                : notif.actor?.name?.charAt(0)
                              }
                            </div>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                              {notif.actor?.name}
                            </span>
                          </div>
                        )}
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(notif._id) }}
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}