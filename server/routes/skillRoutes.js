import express from 'express'
import {
  getAllSkills, createSkill,
  addUserSkill, getUserSkills, endorseSkill, removeUserSkill,
  getSkillQuiz, submitSkillQuiz,
  uploadCertificate, approveCertificate, getPendingCertificates,
  getMyCredentials, getCredentialByCode, toggleCredentialVisibility,
} from '../controllers/skillController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/', protect, getAllSkills)
router.post('/', protect, adminOnly, createSkill)

router.get('/user/:userId?', protect, getUserSkills)
router.post('/user', protect, addUserSkill)
router.delete('/user/:id', protect, removeUserSkill)
router.post('/user/:id/endorse', protect, endorseSkill)

router.get('/quiz/:skillId', protect, getSkillQuiz)
router.post('/quiz/submit', protect, submitSkillQuiz)

router.post('/certificate', protect, uploadMarketplaceImage.single('certificate'), uploadCertificate)
router.get('/certificates/pending', protect, adminOnly, getPendingCertificates)
router.patch('/certificates/:id/approve', protect, adminOnly, approveCertificate)

router.get('/credentials', protect, getMyCredentials)
router.get('/credentials/verify/:code', getCredentialByCode) // public, no auth needed
router.patch('/credentials/:id/visibility', protect, toggleCredentialVisibility)

export default router