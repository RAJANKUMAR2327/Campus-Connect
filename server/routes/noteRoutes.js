import express from 'express'
import {
  uploadNote,
  getNotes,
  getNoteById,
  trackDownload,
  toggleLike,
  toggleBookmark,
  getMyNotes,
  getMyBookmarks,
  deleteNote,
  getFilterOptions,
} from '../controllers/noteController.js'
import { protect } from '../middleware/auth.js'
import { uploadNote as multerUpload } from '../utils/cloudinary.js'

const router = express.Router()

// Public
router.get('/', getNotes)
router.get('/filters', getFilterOptions)
router.get('/:id', getNoteById)

// Protected
router.post('/', protect, multerUpload.single('file'), uploadNote)
router.patch('/:id/download', protect, trackDownload)
router.patch('/:id/like', protect, toggleLike)
router.patch('/:id/bookmark', protect, toggleBookmark)
router.get('/user/my-notes', protect, getMyNotes)
router.get('/user/bookmarks', protect, getMyBookmarks)
router.delete('/:id', protect, deleteNote)

export default router