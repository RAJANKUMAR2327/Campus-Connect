import express from 'express'
import {
  createAlert, getActiveAlerts, resolveAlert,
  getContacts, addContact, deleteContact,
} from '../controllers/safetyController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'

const router = express.Router()

router.use(protect)

router.post('/alerts', createAlert)
router.get('/alerts', adminOnly, getActiveAlerts)
router.patch('/alerts/:id/resolve', adminOnly, resolveAlert)

router.get('/contacts', getContacts)
router.post('/contacts', adminOnly, addContact)
router.delete('/contacts/:id', adminOnly, deleteContact)

export default router
