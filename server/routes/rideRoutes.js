import express from 'express'
import {
  createRide, getRides, getMyRides,
  joinRide, respondToPassenger, cancelMyJoin,
  cancelRide, deleteRide,
} from '../controllers/rideController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getRides)
router.get('/my-rides', protect, getMyRides)
router.post('/', protect, createRide)
router.post('/:id/join', protect, joinRide)
router.patch('/:id/respond', protect, respondToPassenger)
router.patch('/:id/leave', protect, cancelMyJoin)
router.patch('/:id/cancel', protect, cancelRide)
router.delete('/:id', protect, deleteRide)

export default router