import express from 'express'
import {
  createPost, getPosts, toggleUpvote,
  deletePost, getMyPosts,
} from '../controllers/placementController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getPosts)
router.post('/', protect, createPost)
router.patch('/:id/upvote', protect, toggleUpvote)
router.delete('/:id', protect, deletePost)
router.get('/user/my-posts', protect, getMyPosts)

export default router