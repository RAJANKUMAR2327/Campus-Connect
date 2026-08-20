import express from 'express'
import {
  createPost, getPosts, getPostById,
  markResolved, deletePost, getMyPosts,
} from '../controllers/lostFoundController.js'
import { protect } from '../middleware/auth.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/', getPosts)
router.get('/:id', getPostById)
router.post('/', protect, uploadMarketplaceImage.array('images', 3), createPost)
router.patch('/:id/resolve', protect, markResolved)
router.delete('/:id', protect, deletePost)
router.get('/user/my-posts', protect, getMyPosts)

export default router