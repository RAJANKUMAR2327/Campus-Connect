import express from 'express'
import {
  getLocations, createLocation, updateLocation, deleteLocation,
} from '../controllers/campusLocationController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'

const router = express.Router()

router.use(protect)

router.get('/', getLocations)
router.post('/', adminOnly, createLocation)
router.patch('/:id', adminOnly, updateLocation)
router.delete('/:id', adminOnly, deleteLocation)

export default router
