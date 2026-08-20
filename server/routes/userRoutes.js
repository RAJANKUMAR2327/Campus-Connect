import express from 'express'
import {
  getPublicProfile, followUser, unfollowUser,
  getFollowers, getFollowing,
} from '../controllers/followController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

router.get('/:userId/profile', getPublicProfile)
router.post('/:userId/follow', followUser)
router.delete('/:userId/follow', unfollowUser)
router.get('/:userId/followers', getFollowers)
router.get('/:userId/following', getFollowing)

export default router
