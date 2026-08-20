import express from 'express'
import {
  createTask, getTasks, updateTask, toggleComplete, deleteTask,
} from '../controllers/taskController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getTasks)
router.post('/', createTask)
router.patch('/:id', updateTask)
router.patch('/:id/toggle', toggleComplete)
router.delete('/:id', deleteTask)

export default router
