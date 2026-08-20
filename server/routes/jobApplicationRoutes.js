import express from 'express'
import {
  createApplication, getApplications, getKanbanBoard,
  getApplicationById, updateApplication, updateStatus,
  addInterviewRound, deleteApplication, getAnalytics,
} from '../controllers/jobApplicationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getApplications)
router.get('/board', protect, getKanbanBoard)
router.get('/analytics', protect, getAnalytics)
router.get('/:id', protect, getApplicationById)
router.post('/', protect, createApplication)
router.patch('/:id', protect, updateApplication)
router.patch('/:id/status', protect, updateStatus)
router.post('/:id/rounds', protect, addInterviewRound)
router.delete('/:id', protect, deleteApplication)

export default router