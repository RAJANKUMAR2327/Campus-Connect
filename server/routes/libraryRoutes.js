import express from 'express'
import {
  createZone, getZones, getZoneAvailability,
  createBooking, getMyBookings, cancelBooking,
  checkIn, checkOut, getZoneStats,
} from '../controllers/libraryController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'

const router = express.Router()

router.get('/zones', protect, getZones)
router.get('/zones/:id/availability', protect, getZoneAvailability)
router.post('/zones', protect, adminOnly, createZone)
router.get('/stats', protect, adminOnly, getZoneStats)

router.get('/bookings', protect, getMyBookings)
router.post('/bookings', protect, createBooking)
router.patch('/bookings/:id/cancel', protect, cancelBooking)
router.post('/check-in', protect, checkIn)
router.patch('/bookings/:id/check-out', protect, checkOut)

export default router