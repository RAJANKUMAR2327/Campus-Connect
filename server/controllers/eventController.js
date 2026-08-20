import Event from '../models/Event.js'
import { awardXP } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createEvent = async (req, res) => {
  try {
    const {
      title, description, category,
      date, endDate, venue, organizer,
      registrationLink, maxParticipants,
    } = req.body

    const banner = req.file ? req.file.path : ''

    const event = await Event.create({
      title, description, category,
      date, endDate, venue, organizer,
      banner, registrationLink, maxParticipants,
      createdBy: req.user._id,
    })

    await event.populate('createdBy', 'name branch year avatar')
    await awardXP(req.user._id, 'CREATE_EVENT', 'eventsCreated')
    res.status(201).json({ message: 'Event created!', event })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getEvents = async (req, res) => {
  try {
    const { category, upcoming, search, page = 1, limit = 12 } = req.query

    const filter = { isApproved: true }
    if (category) filter.category = category
    if (upcoming === 'true') filter.date = { $gte: new Date() }
    if (search) filter.$text = { $search: search }

    const skip = (Number(page) - 1) * Number(limit)

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name branch year avatar'),
      Event.countDocuments(filter),
    ])

    res.json({
      events,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name branch year avatar')
      .populate('attendees', 'name branch year avatar')

    if (!event) return res.status(404).json({ message: 'Event not found.' })
    res.json({ event })
  } catch (err) {
    sendServerError(res, err)
  }
}

// SECURITY/DATA-INTEGRITY FIX (DB-03): this used to read the event,
// check `attendees.length >= maxParticipants` in application code, then
// separately push and save — three separate steps with no atomicity
// between them. Two concurrent RSVPs arriving within milliseconds of each
// other (realistic under real load, e.g. a popular event nearing capacity)
// could both pass the capacity check before either had committed, letting
// `attendees.length` exceed `maxParticipants`. This now does the
// check-and-join as a single atomic `findOneAndUpdate`, using the same
// technique this codebase's counselingController.js already uses
// correctly for slot booking: the capacity condition lives in the query
// filter itself, not in application code, so MongoDB guarantees only one
// concurrent request can ever satisfy it.
export const toggleAttendance = async (req, res) => {
  try {
    const userId = req.user._id
    const existing = await Event.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Event not found.' })

    const isAttending = existing.attendees.some((a) => a.equals(userId))

    if (isAttending) {
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { $pull: { attendees: userId } },
        { new: true }
      )
      if (!event) return res.status(404).json({ message: 'Event not found.' })
      return res.json({ attending: false, attendeeCount: event.attendees.length })
    }

    // Atomic join: the capacity check is part of the filter, so this can
    // only succeed for one of two racing requests when the event has
    // exactly one seat left. $addToSet also protects against a duplicate
    // join from double-submission.
    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { maxParticipants: { $exists: false } },
          { maxParticipants: null },
          { $expr: { $lt: [{ $size: '$attendees' }, '$maxParticipants'] } },
        ],
      },
      { $addToSet: { attendees: userId } },
      { new: true }
    )

    if (!event) {
      // Disambiguate "genuinely full" (the common case this filter is
      // meant to reject) from "deleted between the two reads above" (rare,
      // but a 404 is more accurate than a misleading "Event is full").
      const stillExists = await Event.exists({ _id: req.params.id })
      if (!stillExists) return res.status(404).json({ message: 'Event not found.' })
      return res.status(400).json({ message: 'Event is full.' })
    }

    await awardXP(req.user._id, 'ATTEND_EVENT', 'eventsAttended')
    res.json({ attending: true, attendeeCount: event.attendees.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found.' })

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await event.deleteOne()
    res.json({ message: 'Event deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ date: 1 })
    res.json({ events })
  } catch (err) {
    sendServerError(res, err)
  }
}