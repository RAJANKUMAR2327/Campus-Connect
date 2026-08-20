import express from 'express'
import { chat } from '../controllers/aiController.js'
import { protect } from '../middleware/auth.js'
import { aiChatLimiter } from '../middleware/rateLimiters.js'

const router = express.Router()

router.post('/chat', protect, aiChatLimiter, chat)

export default router
