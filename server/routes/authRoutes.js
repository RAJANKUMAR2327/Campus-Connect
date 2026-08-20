import express from 'express'
import {
  register,
  login,
  verifyEmail,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
  deactivateAccount,
} from '../controllers/authController.js'
import { exportMyData } from '../controllers/dataExportController.js'
import { protect } from '../middleware/auth.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'
import { loginLimiter, registerLimiter, passwordResetLimiter, dataExportLimiter } from '../middleware/rateLimiters.js'

const router = express.Router()

router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, login)
// API-04 FIX: verify-email previously had no rate limiter at all, unlike
// every other pre-auth, token-accepting endpoint here (login, register,
// forgot/reset-password). Reuses passwordResetLimiter rather than adding
// a new one — same risk profile: an unauthenticated endpoint validating a
// token against the DB, same as reset-password.
router.get('/verify-email', passwordResetLimiter, verifyEmail)
router.post('/forgot-password', passwordResetLimiter, forgotPassword)
router.post('/reset-password', passwordResetLimiter, resetPassword)
router.get('/me', protect, getMe)     // protected — needs JWT
router.patch('/update-profile', protect, updateProfile)
router.patch('/update-avatar', protect, uploadMarketplaceImage.single('avatar'), updateAvatar)
router.patch('/change-password', protect, changePassword)
router.delete('/delete-account', protect, deleteAccount)
router.post('/deactivate-account', protect, deactivateAccount)
router.get('/export-my-data', protect, dataExportLimiter, exportMyData)

export default router
