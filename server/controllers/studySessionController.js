import StudySession from '../models/StudySession.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── LOG A COMPLETED SESSION ─────────────────────────────────────────
export const logSession = async (req, res) => {
  try {
    const { subject, durationMinutes, type } = req.body
    if (!durationMinutes || durationMinutes < 1) {
      return res.status(400).json({ message: 'A valid duration is required.' })
    }

    const session = await StudySession.create({
      user: req.user._id, subject, durationMinutes, type: type || 'focus',
    })
    res.status(201).json({ message: 'Session logged!', session })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET RECENT SESSIONS + STATS ─────────────────────────────────────
export const getSessions = async (req, res) => {
  try {
    const sessions = await StudySession.find({ user: req.user._id, type: 'focus' })
      .sort({ completedAt: -1 })
      .limit(100)

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    const todayMinutes = sessions
      .filter(s => s.completedAt >= startOfToday)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
    const weekMinutes = sessions
      .filter(s => s.completedAt >= startOfWeek)
      .reduce((sum, s) => sum + s.durationMinutes, 0)

    // Simple daily streak: consecutive days (including today) with at least one session
    const daySet = new Set(sessions.map(s => new Date(s.completedAt).toDateString()))
    let streak = 0
    const cursor = new Date(startOfToday)
    while (daySet.has(cursor.toDateString())) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    res.json({ sessions, todayMinutes, weekMinutes, streak, totalSessions: sessions.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE A SESSION (undo a mistaken log) ──────────────────────────
export const deleteSession = async (req, res) => {
  try {
    await StudySession.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Session removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
