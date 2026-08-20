import express from 'express'
import {
  createReferral, getReferrals, getMyReferrals,
  requestReferral, getRequestsForMyReferrals, respondToRequest,
  getMyRequests, deleteReferral,
} from '../controllers/referralController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getReferrals)
router.post('/', protect, createReferral)
router.get('/my-posts', protect, getMyReferrals)
router.get('/my-requests', protect, getMyRequests)
router.get('/requests/incoming', protect, getRequestsForMyReferrals)
router.post('/:id/request', protect, requestReferral)
router.patch('/requests/:id', protect, respondToRequest)
router.delete('/:id', protect, deleteReferral)

export default router