import Placement from '../models/Placement.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createPost = async (req, res) => {
  try {
    const { type, title, company, description, role, package: pkg,
      location, applyLink, deadline, tags } = req.body

    const post = await Placement.create({
      type, title, company, description, role,
      package: pkg, location, applyLink, deadline,
      tags: tags ? JSON.parse(tags) : [],
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
    const { type, search, page = 1, limit = 15 } = req.query

    const filter = {}
    if (type) filter.type = type
    if (search) filter.$text = { $search: search }

    const skip = (Number(page) - 1) * Number(limit)

    const [posts, total] = await Promise.all([
      Placement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('postedBy', 'name branch year avatar'),
      Placement.countDocuments(filter),
    ])

    res.json({
      posts,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const toggleUpvote = async (req, res) => {
  try {
    const post = await Placement.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })

    const userId = req.user._id
    const alreadyUpvoted = post.upvotes.includes(userId)

    if (alreadyUpvoted) {
      post.upvotes.pull(userId)
    } else {
      post.upvotes.push(userId)
    }

    await post.save()
    res.json({ upvoted: !alreadyUpvoted, upvoteCount: post.upvotes.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deletePost = async (req, res) => {
  try {
    const post = await Placement.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })

    if (post.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await post.deleteOne()
    res.json({ message: 'Post deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyPosts = async (req, res) => {
  try {
    const posts = await Placement.find({ postedBy: req.user._id }).sort({ createdAt: -1 })
    res.json({ posts })
  } catch (err) {
    sendServerError(res, err)
  }
}