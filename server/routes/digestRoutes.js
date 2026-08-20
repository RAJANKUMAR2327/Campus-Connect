import express from 'express'
import { getMyPreferences, updatePreferences, sendPreviewDigest } from '../controllers/digestController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/preferences', protect, getMyPreferences)
router.patch('/preferences', protect, updatePreferences)
router.post('/preview', protect, sendPreviewDigest)

export default router