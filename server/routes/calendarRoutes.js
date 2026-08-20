import express from 'express'
import {
  addTimetableEntry, getTimetable, updateTimetableEntry, deleteTimetableEntry,
  addCalendarEvent, getCalendarEvents, updateCalendarEvent, deleteCalendarEvent,
  getUpcoming,
} from '../controllers/calendarController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect) // every calendar route is user-specific

// Timetable
router.get('/timetable', getTimetable)
router.post('/timetable', addTimetableEntry)
router.patch('/timetable/:id', updateTimetableEntry)
router.delete('/timetable/:id', deleteTimetableEntry)

// Calendar events
router.get('/events', getCalendarEvents)
router.post('/events', addCalendarEvent)
router.patch('/events/:id', updateCalendarEvent)
router.delete('/events/:id', deleteCalendarEvent)

// Upcoming (combined timetable + events + deadlines)
router.get('/upcoming', getUpcoming)

export default router
