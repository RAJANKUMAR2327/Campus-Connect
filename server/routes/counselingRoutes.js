import express from 'express'
import {
  createSlot, getSlots, getMyBookings, bookSlot, cancelBooking, deleteSlot,
} from '../controllers/counselingController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'

const router = express.Router()

router.use(protect)

router.get('/', getSlots)
router.get('/my-bookings', getMyBookings)
router.post('/', adminOnly, createSlot)
router.post('/:id/book', bookSlot)
router.post('/:id/cancel', cancelBooking)
router.delete('/:id', adminOnly, deleteSlot)

export default router
