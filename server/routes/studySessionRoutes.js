import express from 'express'
import { logSession, getSessions, deleteSession } from '../controllers/studySessionController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getSessions)
router.post('/', logSession)
router.delete('/:id', deleteSession)

export default router
