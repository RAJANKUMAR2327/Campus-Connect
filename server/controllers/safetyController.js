import SafetyAlert from '../models/SafetyAlert.js'
import EmergencyContact from '../models/EmergencyContact.js'
import User from '../models/User.js'
import { createNotification } from './notificationController.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── TRIGGER AN SOS ALERT ────────────────────────────────────────────
export const createAlert = async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body

    const alert = await SafetyAlert.create({
      user: req.user._id, latitude, longitude, message,
    })
    await alert.populate('user', 'name avatar branch year')

    // Notify every admin so someone can respond
    const admins = await User.find({ role: 'admin' }).select('_id')
    await Promise.all(admins.map(admin => createNotification({
      recipient: admin._id,
      type: 'safety',
      title: '🚨 Safety alert triggered',
      message: `${req.user.name} triggered an SOS alert.`,
      link: '/safety',
      actor: req.user._id,
    })))

    res.status(201).json({ message: 'Alert sent. Help is on the way.', alert })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ACTIVE ALERTS (admin only) ─────────────────────────────────
export const getActiveAlerts = async (req, res) => {
  try {
    const alerts = await SafetyAlert.find({ status: 'active' })
      .populate('user', 'name avatar branch year college')
      .sort({ createdAt: -1 })
    res.json({ alerts })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── RESOLVE AN ALERT (admin only) ──────────────────────────────────
export const resolveAlert = async (req, res) => {
  try {
    const alert = await SafetyAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    )
    if (!alert) return res.status(404).json({ message: 'Alert not found.' })
    res.json({ message: 'Alert marked resolved.', alert })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── EMERGENCY CONTACTS: LIST (all users) ───────────────────────────
export const getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find().sort({ category: 1 })
    res.json({ contacts })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── EMERGENCY CONTACTS: ADD (admin only) ───────────────────────────
export const addContact = async (req, res) => {
  try {
    const { label, phone, category } = req.body
    if (!label || !phone) return res.status(400).json({ message: 'Label and phone are required.' })

    const contact = await EmergencyContact.create({ label, phone, category, addedBy: req.user._id })
    res.status(201).json({ message: 'Contact added!', contact })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── EMERGENCY CONTACTS: DELETE (admin only) ────────────────────────
export const deleteContact = async (req, res) => {
  try {
    await EmergencyContact.findByIdAndDelete(req.params.id)
    res.json({ message: 'Contact removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
