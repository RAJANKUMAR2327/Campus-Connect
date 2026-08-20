import VolunteerLog from '../models/VolunteerLog.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── LOG VOLUNTEER HOURS ──────────────────────────────────────────────
export const createLog = async (req, res) => {
  try {
    const { title, organization, category, description, hours, date } = req.body
    if (!title?.trim() || !hours || !date) {
      return res.status(400).json({ message: 'Title, hours, and date are required.' })
    }

    const log = await VolunteerLog.create({
      user: req.user._id, title, organization, category, description,
      hours: Number(hours), date,
      proofUrl: req.file?.path,
    })
    res.status(201).json({ message: 'Hours logged!', log })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY LOGS + TOTALS ──────────────────────────────────────────────
export const getMyLogs = async (req, res) => {
  try {
    const logs = await VolunteerLog.find({ user: req.user._id }).sort({ date: -1 })
    const totalHours = logs.reduce((sum, l) => sum + l.hours, 0)
    const verifiedHours = logs.filter(l => l.verified).reduce((sum, l) => sum + l.hours, 0)
    res.json({ logs, totalHours, verifiedHours })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADMIN: GET ALL LOGS (optionally filter unverified) ────────────────
export const getAllLogs = async (req, res) => {
  try {
    const { verified } = req.query
    const filter = {}
    if (verified === 'false') filter.verified = false
    if (verified === 'true') filter.verified = true

    const logs = await VolunteerLog.find(filter)
      .populate('user', 'name avatar branch year')
      .sort({ createdAt: -1 })
    res.json({ logs })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADMIN: VERIFY A LOG ────────────────────────────────────────────────
export const verifyLog = async (req, res) => {
  try {
    const log = await VolunteerLog.findByIdAndUpdate(
      req.params.id,
      { verified: true, verifiedBy: req.user._id },
      { new: true }
    )
    if (!log) return res.status(404).json({ message: 'Log not found.' })
    res.json({ message: 'Marked verified!', log })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE MY LOG ───────────────────────────────────────────────────────
export const deleteLog = async (req, res) => {
  try {
    await VolunteerLog.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Log removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
