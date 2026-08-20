import express from 'express'
import {
  createEvent, getEvents, getEventById,
  toggleAttendance, deleteEvent, getMyEvents,
} from '../controllers/eventController.js'
import { protect } from '../middleware/auth.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/', getEvents)
router.get('/:id', getEventById)
router.post('/', protect, uploadMarketplaceImage.single('banner'), createEvent)
router.patch('/:id/attend', protect, toggleAttendance)
router.delete('/:id', protect, deleteEvent)
router.get('/user/my-events', protect, getMyEvents)

export default router