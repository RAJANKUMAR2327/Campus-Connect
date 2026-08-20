import express from 'express'
import {
  addQuestion, getQuestions, getSubjects,
  toggleUpvote, toggleBookmark,
  submitAttempt, getMyAttempts, getBookmarked,
  deleteQuestion, addPaperSet, getPaperSets,
  trackDownload,
} from '../controllers/questionController.js'
import { protect } from '../middleware/auth.js'
import { uploadNote, uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

// Questions
router.get('/', protect, getQuestions)
router.get('/subjects', protect, getSubjects)
router.get('/bookmarked', protect, getBookmarked)
router.get('/my-attempts', protect, getMyAttempts)
router.post('/', protect, uploadMarketplaceImage.single('image'), addQuestion)
router.patch('/:id/upvote', protect, toggleUpvote)
router.patch('/:id/bookmark', protect, toggleBookmark)
router.delete('/:id', protect, deleteQuestion)

// Quiz
router.post('/attempt', protect, submitAttempt)

// Papers
router.get('/papers', protect, getPaperSets)
router.post('/papers', protect, uploadNote.single('file'), addPaperSet)
router.patch('/papers/:id/download', protect, trackDownload)

export default router