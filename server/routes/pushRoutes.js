import express from 'express'
import {
  subscribe, unsubscribe,
  getSubscriptionStatus, getVapidKey,
} from '../controllers/pushController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/vapid-key', getVapidKey)
router.post('/subscribe', protect, subscribe)
router.post('/unsubscribe', protect, unsubscribe)
router.get('/status', protect, getSubscriptionStatus)

export default router