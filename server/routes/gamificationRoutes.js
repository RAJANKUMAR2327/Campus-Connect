import express from 'express'
import {
  getMyStats, getLeaderboard,
  getUserBadges, getAllBadges,
} from '../controllers/gamificationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/my-stats', protect, getMyStats)
router.get('/leaderboard', protect, getLeaderboard)
router.get('/badges', protect, getAllBadges)
router.get('/badges/:userId', protect, getUserBadges)

export default router