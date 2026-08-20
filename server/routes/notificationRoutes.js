import express from 'express'
import {
  getNotifications, markAllRead,
  markOneRead, deleteNotification,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getNotifications)
router.patch('/read-all', protect, markAllRead)
router.patch('/:id/read', protect, markOneRead)
router.delete('/:id', protect, deleteNotification)

export default router