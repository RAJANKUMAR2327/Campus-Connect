import LostFound from '../models/LostFound.js'
import { deleteFromCloudinary } from '../utils/cloudinary.js'
import { awardXP } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createPost = async (req, res) => {
  try {
    const { type, title, description, category, location, date, contact } = req.body
    const images = req.files ? req.files.map((f) => f.path) : []

    const post = await LostFound.create({
      type, title, description, category,
      location, date, contact, images,
      postedBy: req.user._id,
    })

    await post.populate('postedBy', 'name branch year avatar')
    res.status(201).json({ message: 'Post created!', post })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getPosts = async (req, res) => {
  try {
    const { type, category, status = 'open', search, page = 1, limit = 12 } = req.query

    const filter = {}
    if (type) filter.type = type
    if (category) filter.category = category
    if (status) filter.status = status
    if (search) filter.$text = { $search: search }

    const skip = (Number(page) - 1) * Number(limit)

    const [posts, total] = await Promise.all([
      LostFound.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('postedBy', 'name branch year avatar'),
      LostFound.countDocuments(filter),
    ])

    res.json({
      posts,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getPostById = async (req, res) => {
  try {
    const post = await LostFound.findById(req.params.id).populate(
      'postedBy', 'name branch year avatar'
    )
    if (!post) return res.status(404).json({ message: 'Post not found.' })
    res.json({ post })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const markResolved = async (req, res) => {
  try {
    const post = await LostFound.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })

    if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    post.status = 'resolved'
    await post.save()
    await awardXP(req.user._id, 'RESOLVE_LOST_FOUND', 'lostFoundResolved')
    res.json({ message: 'Marked as resolved!', post })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deletePost = async (req, res) => {
  try {
    const post = await LostFound.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })

    if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    // Delete images from Cloudinary
    for (const img of post.images) {
      await deleteFromCloudinary(img, 'image')
    }

    await post.deleteOne()
    res.json({ message: 'Post deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyPosts = async (req, res) => {
  try {
    const posts = await LostFound.find({ postedBy: req.user._id }).sort({ createdAt: -1 })
    res.json({ posts })
  } catch (err) {
    sendServerError(res, err)
  }
}