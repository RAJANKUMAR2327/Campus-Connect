import express from 'express'
import {
  createAlumniProfile, updateAlumniProfile, getMyAlumniProfile,
  getAlumniDirectory, deleteAlumniProfile,
} from '../controllers/alumniController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getAlumniDirectory)
router.get('/me', getMyAlumniProfile)
router.post('/', createAlumniProfile)
router.patch('/me', updateAlumniProfile)
router.delete('/me', deleteAlumniProfile)

export default router
