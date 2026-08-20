import express from 'express'
import {
  createLog, getMyLogs, getAllLogs, verifyLog, deleteLog,
} from '../controllers/volunteerController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'
import { uploadNote } from '../utils/cloudinary.js'

const router = express.Router()

router.use(protect)

router.get('/', getMyLogs)
router.get('/all', adminOnly, getAllLogs)
router.post('/', uploadNote.single('proof'), createLog)
router.patch('/:id/verify', adminOnly, verifyLog)
router.delete('/:id', deleteLog)

export default router
