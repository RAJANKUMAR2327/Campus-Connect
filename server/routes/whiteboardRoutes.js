import express from 'express'
import {
  createWhiteboard, getMyWhiteboards, getWhiteboardById,
  joinViaShareCode, clearWhiteboard, deleteWhiteboard,
} from '../controllers/whiteboardController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.get('/', protect, getMyWhiteboards)
router.post('/', protect, createWhiteboard)
router.post('/join/:code', protect, joinViaShareCode)
router.get('/:id', protect, getWhiteboardById)
router.patch('/:id/clear', protect, clearWhiteboard)
router.delete('/:id', protect, deleteWhiteboard)

export default router