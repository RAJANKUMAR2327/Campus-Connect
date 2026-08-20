import CalendarEvent from '../models/CalendarEvent.js'
import TimetableEntry from '../models/TimetableEntry.js'
import Event from '../models/Event.js'
import Placement from '../models/Placement.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── TIMETABLE ────────────────────────────────────────────────────
export const addTimetableEntry = async (req, res) => {
  try {
    const { subject, type, dayOfWeek, startTime, endTime, venue, instructor, color } = req.body
    const entry = await TimetableEntry.create({
      user: req.user._id, subject, type, dayOfWeek,
      startTime, endTime, venue, instructor, color,
    })
    res.status(201).json({ message: 'Class added!', entry })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getTimetable = async (req, res) => {
  try {
    const entries = await TimetableEntry.find({ user: req.user._id })
      .sort({ dayOfWeek: 1, startTime: 1 })
    res.json({ entries })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const updateTimetableEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    )
    if (!entry) return res.status(404).json({ message: 'Entry not found.' })
    res.json({ message: 'Updated!', entry })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteTimetableEntry = async (req, res) => {
  try {
    await TimetableEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Class removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── CALENDAR EVENTS ──────────────────────────────────────────────
export const addCalendarEvent = async (req, res) => {
  try {
    const {
      title, description, type, startDate, endDate,
      allDay, location, color, reminder, recurring,
    } = req.body

    const event = await CalendarEvent.create({
      user: req.user._id, title, description, type,
      startDate, endDate, allDay, location, color,
      reminder: reminder ? JSON.parse(reminder) : undefined,
      recurring: recurring ? JSON.parse(recurring) : undefined,
    })

    res.status(201).json({ message: 'Event added!', event })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getCalendarEvents = async (req, res) => {
  try {
    const { start, end, type } = req.query
    const filter = { user: req.user._id }

    if (start && end) {
      filter.startDate = { $gte: new Date(start), $lte: new Date(end) }
    }
    if (type) filter.type = type

    const events = await CalendarEvent.find(filter).sort({ startDate: 1 })

    // Also pull auto-synced items: events you're attending, placement deadlines
    const [attendingEvents, placementPosts] = await Promise.all([
      Event.find({ attendees: req.user._id, date: { $gte: new Date() } })
        .select('title date venue category'),
      Placement.find({
        postedBy: req.user._id,
        deadline: { $gte: new Date() },
      }).select('title deadline company'),
    ])

    const syncedEvents = [
      ...attendingEvents.map(e => ({
        _id: `event_${e._id}`,
        title: e.title,
        type: 'event',
        startDate: e.date,
        location: e.venue,
        color: '#10b981',
        sourceType: 'event',
        sourceId: e._id,
        readOnly: true,
      })),
      ...placementPosts.map(p => ({
        _id: `placement_${p._id}`,
        title: `Deadline: ${p.title}`,
        type: 'placement',
        startDate: p.deadline,
        color: '#3b82f6',
        sourceType: 'placement',
        sourceId: p._id,
        readOnly: true,
      })),
    ]

    res.json({ events: [...events, ...syncedEvents] })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const updateCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    )
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    res.json({ message: 'Updated!', event })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteCalendarEvent = async (req, res) => {
  try {
    await CalendarEvent.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Event deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPCOMING SUMMARY (for dashboard widget) ──────────────────────
export const getUpcoming = async (req, res) => {
  try {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const events = await CalendarEvent.find({
      user: req.user._id,
      startDate: { $gte: now, $lte: weekFromNow },
    }).sort({ startDate: 1 }).limit(5)

    // Today's classes
    const today = now.getDay()
    const todayClasses = await TimetableEntry.find({ user: req.user._id, dayOfWeek: today })
      .sort({ startTime: 1 })

    res.json({ upcomingEvents: events, todayClasses })
  } catch (err) {
    sendServerError(res, err)
  }
}