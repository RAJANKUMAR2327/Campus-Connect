import webpush from 'web-push'
import dotenv from 'dotenv'
import PushSubscription from '../models/PushSubscription.js'

dotenv.config()

// web-push requires the subject to be a mailto: or https: URL, not a bare email
const vapidSubject = process.env.VAPID_EMAIL?.startsWith('mailto:') || process.env.VAPID_EMAIL?.startsWith('http')
  ? process.env.VAPID_EMAIL
  : `mailto:${process.env.VAPID_EMAIL}`

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    vapidSubject,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.warn('VAPID keys missing — push notifications are disabled.')
}

export const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId })
    if (subscriptions.length === 0) return

    const notificationPayload = JSON.stringify({
      title: payload.title || 'CampusConnect',
      body: payload.message || payload.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      url: payload.link || '/notifications',
      tag: payload.tag || 'campus-connect',
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          notificationPayload
        )
      )
    )

    // Remove invalid/expired subscriptions
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const statusCode = results[i].reason?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscriptions[i]._id })
        }
      }
    }
  } catch (err) {
    console.error('Push notification error:', err.message)
  }
}

export const sendPushToMany = async (userIds, payload) => {
  await Promise.allSettled(userIds.map(id => sendPushToUser(id, payload)))
}