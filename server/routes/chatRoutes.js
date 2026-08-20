import express from 'express'
import {
  getConversations, getOrCreateConversation, getOrCreateCampusChat,
  getMessages, sendMessage, deleteMessage,
  searchUsers, getUnreadCount,
} from '../controllers/chatController.js'
import { protect } from '../middleware/auth.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/conversations', protect, getConversations)
router.get('/campus-room', protect, getOrCreateCampusChat)
router.get('/conversations/:userId', protect, getOrCreateConversation)
router.get('/messages/:conversationId', protect, getMessages)
router.post('/messages', protect, uploadMarketplaceImage.single('image'), sendMessage)
router.delete('/messages/:messageId', protect, deleteMessage)
router.get('/search', protect, searchUsers)
router.get('/unread', protect, getUnreadCount)

export default router