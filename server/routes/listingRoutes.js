import express from 'express'
import {
  createListing, getListings, getListingById,
  toggleInterest, markAsSold, deleteListing, getMyListings,
} from '../controllers/listingController.js'
import { protect } from '../middleware/auth.js'
import { uploadMarketplaceImage } from '../utils/cloudinary.js'

const router = express.Router()

router.get('/', getListings)
router.get('/:id', getListingById)
router.post('/', protect, uploadMarketplaceImage.array('images', 5), createListing)
router.patch('/:id/interest', protect, toggleInterest)
router.patch('/:id/sold', protect, markAsSold)
router.delete('/:id', protect, deleteListing)
router.get('/user/my-listings', protect, getMyListings)

export default router
