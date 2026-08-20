import express from 'express'
import {
  createGroup, getGroups, getMyGroups,
  getGroupById, joinGroup, leaveGroup,
  handleJoinRequest, addResource,
  updateMeeting, deleteGroup, getGroupMessages,
} from '../controllers/studyGroupController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getGroups)
router.get('/my-groups', protect, getMyGroups)
router.get('/:id', protect, getGroupById)
router.get('/:id/messages', protect, getGroupMessages)
router.post('/', protect, createGroup)
router.post('/:id/join', protect, joinGroup)
router.post('/:id/leave', protect, leaveGroup)
router.post('/:id/resources', protect, addResource)
router.patch('/:id/request', protect, handleJoinRequest)
router.patch('/:id/meeting', protect, updateMeeting)
router.delete('/:id', protect, deleteGroup)

export default router