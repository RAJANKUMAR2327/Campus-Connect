import express from 'express'
import {
  getDashboardStats, getAllUsers, updateUserRole,
  deleteUser, bulkDeleteUsers, toggleUserVerification,
  getAllNotes, deleteNote, bulkDeleteNotes,
  getAllComments, deleteComment, bulkDeleteComments,
  getAuditLog,
} from '../controllers/adminController.js'
import { getReports, resolveReport } from '../controllers/reportController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'
import { adminActionLimiter } from '../middleware/rateLimiters.js'

const router = express.Router()

// All routes require auth + admin, and are rate-limited against abuse
router.use(protect, adminOnly, adminActionLimiter)

router.get('/stats', getDashboardStats)
router.get('/audit-log', getAuditLog)

// Users — bulk route MUST precede the /:id route below it
router.get('/users', getAllUsers)
router.delete('/users/bulk', bulkDeleteUsers)
router.patch('/users/:id/role', updateUserRole)
router.patch('/users/:id/verify', toggleUserVerification)
router.delete('/users/:id', deleteUser)

// Notes — bulk route MUST precede the /:id route below it
router.get('/notes', getAllNotes)
router.delete('/notes/bulk', bulkDeleteNotes)
router.delete('/notes/:id', deleteNote)

// Comments — bulk route MUST precede the /:id route below it
router.get('/comments', getAllComments)
router.delete('/comments/bulk', bulkDeleteComments)
router.delete('/comments/:id', deleteComment)

// Reports queue
router.get('/reports', getReports)
router.patch('/reports/:id', resolveReport)

export default router
