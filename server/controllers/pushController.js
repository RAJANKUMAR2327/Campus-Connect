import PushSubscription from '../models/PushSubscription.js'
import { sendServerError } from '../utils/errorResponse.js'

export const subscribe = async (req, res) => {
  try {
    const { endpoint, keys, deviceInfo } = req.body

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys, deviceInfo },
      { upsert: true, new: true }
    )

    res.json({ message: 'Subscribed to push notifications!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body
    await PushSubscription.deleteOne({ endpoint, user: req.user._id })
    res.json({ message: 'Unsubscribed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getSubscriptionStatus = async (req, res) => {
  try {
    const count = await PushSubscription.countDocuments({ user: req.user._id })
    res.json({ subscribed: count > 0, deviceCount: count })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getVapidKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}