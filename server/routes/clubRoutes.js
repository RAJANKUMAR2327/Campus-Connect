import express from 'express'
import {
  createClub, getClubs, getMyClubs, getClubById,
  joinClub, leaveClub, addCoreMember,
  updateRecruitment, addAchievement, deleteClub,
  createClubEvent, getClubMessages,
} from '../controllers/clubController.js'
import { protect } from '../middleware/auth.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/', protect, getClubs)
router.get('/my-clubs', protect, getMyClubs)
router.get('/:id', protect, getClubById)
router.get('/:id/messages', protect, getClubMessages)
router.post('/', protect, uploadMarketplaceImage.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), createClub)
router.post('/:id/join', protect, joinClub)
router.post('/:id/leave', protect, leaveClub)
router.post('/:id/events', protect, uploadMarketplaceImage.single('banner'), createClubEvent)
router.patch('/:id/core-team', protect, addCoreMember)
router.patch('/:id/recruitment', protect, updateRecruitment)
router.patch('/:id/achievement', protect, addAchievement)
router.delete('/:id', protect, deleteClub)

export default router