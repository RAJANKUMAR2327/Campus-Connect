import express from 'express'
import {
  createPost, getFeed, getPostById,
  toggleReaction, votePoll,
  togglePin, deletePost, getMyPosts,
} from '../controllers/postController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/', protect, getFeed)
router.get('/my-posts', protect, getMyPosts)
router.get('/:id', protect, getPostById)
router.post('/', protect, uploadMarketplaceImage.array('images', 4), createPost)
router.patch('/:id/react', protect, toggleReaction)
router.patch('/:id/vote', protect, votePoll)
router.patch('/:id/pin', protect, adminOnly, togglePin)
router.delete('/:id', protect, deletePost)

export default router