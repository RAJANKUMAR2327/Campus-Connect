import Listing from '../models/Listing.js'
import { deleteFromCloudinary } from '../utils/cloudinary.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createListing = async (req, res) => {
  try {
    const { title, description, price, negotiable, category, condition, contact } = req.body
    const images = req.files ? req.files.map((f) => f.path) : []

    const listing = await Listing.create({
      title, description,
      price: Number(price),
      negotiable: negotiable === 'true',
      category, condition, contact, images,
      seller: req.user._id,
    })

    await listing.populate('seller', 'name branch year avatar')
    res.status(201).json({ message: 'Listing created!', listing })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getListings = async (req, res) => {
  try {
    const {
      category, condition, status = 'available',
      minPrice, maxPrice, search,
      page = 1, limit = 12, sort = 'newest',
    } = req.query

    const filter = { status }
    if (category) filter.category = category
    if (condition) filter.condition = condition
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (search) filter.$text = { $search: search }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit))
        .populate('seller', 'name branch year avatar'),
      Listing.countDocuments(filter),
    ])

    res.json({
      listings,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'seller', 'name branch year avatar'
    )
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })
    res.json({ listing })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const toggleInterest = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })

    const userId = req.user._id
    const isInterested = listing.interestedUsers.includes(userId)

    if (isInterested) {
      listing.interestedUsers.pull(userId)
    } else {
      listing.interestedUsers.push(userId)
    }

    await listing.save()
    res.json({
      interested: !isInterested,
      interestCount: listing.interestedUsers.length,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const markAsSold = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    listing.status = 'sold'
    await listing.save()
    res.json({ message: 'Marked as sold!', listing })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })

    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    for (const img of listing.images) {
      await deleteFromCloudinary(img, 'image')
    }

    await listing.deleteOne()
    res.json({ message: 'Listing deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 })
    res.json({ listings })
  } catch (err) {
    sendServerError(res, err)
  }
}