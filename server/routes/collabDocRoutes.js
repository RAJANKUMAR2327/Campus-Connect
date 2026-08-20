import express from 'express'
import {
  createDoc, getMyDocs, getDocById, getDocByShareCode,
  joinViaShareCode, updateDoc, updateCollaboratorRole,
  removeCollaborator, deleteDoc, togglePublic,
} from '../controllers/collabDocController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getMyDocs)
router.get('/share/:code', protect, getDocByShareCode)
router.post('/', protect, createDoc)
router.post('/join/:code', protect, joinViaShareCode)
router.get('/:id', protect, getDocById)
router.patch('/:id', protect, updateDoc)
router.patch('/:id/public', protect, togglePublic)
router.patch('/:id/collaborators', protect, updateCollaboratorRole)
router.delete('/:id/collaborators/:userId', protect, removeCollaborator)
router.delete('/:id', protect, deleteDoc)

export default router