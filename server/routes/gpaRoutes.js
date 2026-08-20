import express from 'express'
import { createGpaRecord, getGpaRecords, deleteGpaRecord } from '../controllers/gpaController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', getGpaRecords)
router.post('/', createGpaRecord)
router.delete('/:id', deleteGpaRecord)

export default router
