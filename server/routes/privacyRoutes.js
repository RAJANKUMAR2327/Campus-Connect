import express from 'express'
import {
  getPrivacySettings, updatePrivacySettings,
  blockUser, unblockUser, getBlockedUsers,
} from '../controllers/privacyController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

router.get('/settings', getPrivacySettings)
router.patch('/settings', updatePrivacySettings)

router.get('/blocked', getBlockedUsers)
router.post('/block/:userId', blockUser)
router.delete('/block/:userId', unblockUser)

export default router
