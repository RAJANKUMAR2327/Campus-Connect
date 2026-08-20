import express from 'express'
import {
  createSubject, getSubjects, markAttendance, undoLastMark,
  updateSubject, deleteSubject,
} from '../controllers/attendanceController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getSubjects)
router.post('/', createSubject)
router.patch('/:id', updateSubject)
router.delete('/:id', deleteSubject)
router.post('/:id/mark', markAttendance)
router.post('/:id/undo', undoLastMark)

export default router
