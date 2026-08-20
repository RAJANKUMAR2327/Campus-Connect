import express from 'express'
import {
  createConfession, getFeed, getConfessionById,
  toggleReaction, flagConfession, toggleResolved,
  deleteConfession, getMyConfessions,
  addComment, getComments, toggleCommentLike,
} from '../controllers/confessionController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getFeed)
router.get('/my-posts', protect, getMyConfessions)
router.get('/:id', protect, getConfessionById)
router.post('/', protect, createConfession)
router.patch('/:id/react', protect, toggleReaction)
router.post('/:id/flag', protect, flagConfession)
router.patch('/:id/resolve', protect, toggleResolved)
router.delete('/:id', protect, deleteConfession)

router.get('/:id/comments', protect, getComments)
router.post('/:id/comments', protect, addComment)
router.patch('/comments/:commentId/like', protect, toggleCommentLike)

export default router