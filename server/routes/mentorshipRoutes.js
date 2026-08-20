import express from 'express'
import {
  createMentorProfile, updateMentorProfile,
  getMentors, getMyMentorProfile, getMentorById,
  sendRequest, respondToRequest,
  getMentorRequests, getMenteeRequests,
  getActiveMentorships, endMentorship,
  scheduleSession, getMySessions, completeSession,
} from '../controllers/mentorshipController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/mentors', protect, getMentors)
router.get('/mentors/:id', protect, getMentorById)
router.get('/my-profile', protect, getMyMentorProfile)
router.post('/profile', protect, createMentorProfile)
router.patch('/profile', protect, updateMentorProfile)

router.post('/requests', protect, sendRequest)
router.patch('/requests/:id', protect, respondToRequest)
router.get('/requests/as-mentor', protect, getMentorRequests)
router.get('/requests/as-mentee', protect, getMenteeRequests)
router.get('/active', protect, getActiveMentorships)
router.patch('/end/:id', protect, endMentorship)

router.post('/sessions', protect, scheduleSession)
router.get('/sessions', protect, getMySessions)
router.patch('/sessions/:id/complete', protect, completeSession)

export default router