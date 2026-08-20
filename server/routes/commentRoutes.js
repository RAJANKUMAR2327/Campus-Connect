import express from 'express'
import {
  addComment, getComments,
  toggleCommentLike, deleteComment,
} from '../controllers/commentController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/:targetType/:targetId', protect, getComments)
router.post('/:targetType/:targetId', protect, addComment)
router.patch('/like/:commentId', protect, toggleCommentLike)
router.delete('/:commentId', protect, deleteComment)

export default router