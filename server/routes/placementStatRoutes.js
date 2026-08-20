import express from 'express'
import { addStat, getDashboard } from '../controllers/placementStatController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/dashboard', protect, getDashboard)
router.post('/', protect, addStat)

export default router