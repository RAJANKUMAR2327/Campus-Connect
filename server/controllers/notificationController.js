import Notification from '../models/Notification.js'
import { sendPushToUser } from '../utils/webPush.js'
import { sendServerError } from '../utils/errorResponse.js'

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('actor', 'name avatar')

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    })

    res.json({ notifications, unreadCount })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    )
    res.json({ message: 'All marked as read.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const markOneRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true }
    )
    res.json({ message: 'Marked as read.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    })
    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// Helper to create notifications from other controllers
export const createNotification = async ({
  recipient, type, title, message, link, actor
}) => {
  try {
    if (recipient.toString() === actor?.toString()) return
    const notif = await Notification.create({ recipient, type, title, message, link, actor })

    // Send push notification (fire and forget)
    sendPushToUser(recipient, { title, message, link, tag: type })

    return notif
  } catch (err) {
    // BUG FIX (DB-06): this used to be a bare `catch {}` — any failure
    // here (a DB write error, a bad recipient ID, anything) vanished with
    // zero visibility. Since this is a fire-and-forget helper called from
    // many other controllers specifically so a notification failure never
    // blocks the action that triggered it, it still shouldn't throw —
    // but it should at least be observable server-side instead of
    // disappearing entirely.
    console.error('createNotification failed:', err.message)
  }
}