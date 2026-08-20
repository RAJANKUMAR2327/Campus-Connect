import express from 'express'
import { createCallRoom, getCallHistory } from '../controllers/callController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.post('/room', protect, createCallRoom)
router.get('/history', protect, getCallHistory)

export default router