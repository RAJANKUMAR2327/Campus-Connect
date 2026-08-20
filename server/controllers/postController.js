import Post from '../models/Post.js'
import { createNotification } from './notificationController.js'
import { awardXP } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

// SECURITY FIX: Post.visibility (everyone/college/branch/year) was stored
// and set at creation time but only ever enforced by getFeed's query — the
// single-post lookup below (getPostById) fetched by ID with no visibility
// check at all, so anyone with (or guessing) a post's ID could read it
// directly regardless of its intended scope, completely bypassing the
// feed-level restriction. Both getFeed and getPostById now build their
// query from this same shared predicate, so the two can't drift apart
// again the way they did before.
const visibilityFilter = (user) => ([
  { visibility: 'everyone' },
  { visibility: 'college', college: user.college },
  { visibility: 'branch', college: user.college, branch: user.branch },
  { visibility: 'year', college: user.college, year: user.year },
  // Always let authors see their own posts regardless of scope.
  { author: user._id },
])

// ─── CREATE POST ──────────────────────────────────────────────────
export const createPost = async (req, res) => {
  try {
    const {
      type, content, isAnnouncement,
      visibility, poll, tags,
    } = req.body

    const images = req.files ? req.files.map(f => f.path) : []
    await awardXP(req.user._id, 'CREATE_POST', 'postsCreated')

    // Only admin/faculty can make announcements
    if (isAnnouncement && !['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admin/faculty can post announcements.' })
    }

    const post = await Post.create({
      type: poll ? 'poll' : (isAnnouncement ? 'announcement' : type || 'post'),
      content,
      images,
      author: req.user._id,
      isAnnouncement: isAnnouncement || false,
      visibility: visibility || 'everyone',
      college: req.user.college,
      branch: req.user.branch,
      year: req.user.year,
      poll: poll ? JSON.parse(poll) : undefined,
      tags: tags ? JSON.parse(tags) : [],
    })

    await post.populate('author', 'name avatar branch year college role')
    res.status(201).json({ message: 'Posted!', post })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET FEED ─────────────────────────────────────────────────────
export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 15, filter = 'all' } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const filter_query = {}

    if (filter === 'announcements') filter_query.isAnnouncement = true
    if (filter === 'polls') filter_query.type = 'poll'
    if (filter === 'college') filter_query.college = req.user.college

    // SECURITY FIX: see visibilityFilter() above — this used to build the
    // $or array inline, and getPostById below didn't build one at all.
    filter_query.$or = visibilityFilter(req.user)

    const [posts, total] = await Promise.all([
      Post.find(filter_query)
        .sort({ pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name avatar branch year college role'),
      Post.countDocuments(filter_query),
    ])

    res.json({
      posts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + posts.length < total,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SINGLE POST ──────────────────────────────────────────────
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, $or: visibilityFilter(req.user) },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('author', 'name avatar branch year college role')

    if (!post) return res.status(404).json({ message: 'Post not found.' })
    res.json({ post })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE REACTION ──────────────────────────────────────────────
export const toggleReaction = async (req, res) => {
  try {
    const { type } = req.body // like, celebrate, support, insightful
    const validTypes = ['like', 'celebrate', 'support', 'insightful']

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type.' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })

    const userId = req.user._id
    const reactionArray = post.reactions[type]
    const hasReacted = reactionArray.includes(userId)

    // Remove from all reaction types first
    validTypes.forEach(t => {
      post.reactions[t] = post.reactions[t].filter(
        id => id.toString() !== userId.toString()
      )
    })

    // Add reaction if not already reacted with this type
    if (!hasReacted) {
      post.reactions[type].push(userId)

      // Notify post author
      if (post.author.toString() !== userId.toString()) {
        await createNotification({
          recipient: post.author,
          type: 'like',
          title: `${req.user.name} reacted to your post`,
          message: `"${post.content?.slice(0, 50)}..."`,
          link: `/feed`,
          actor: userId,
        })
      }
    }

    await post.save()

    const totalReactions = validTypes.reduce(
      (sum, t) => sum + post.reactions[t].length, 0
    )

    res.json({
      reacted: !hasReacted,
      reactionType: !hasReacted ? type : null,
      reactions: {
        like: post.reactions.like.length,
        celebrate: post.reactions.celebrate.length,
        support: post.reactions.support.length,
        insightful: post.reactions.insightful.length,
        total: totalReactions,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── VOTE ON POLL ─────────────────────────────────────────────────
export const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body
    const post = await Post.findById(req.params.id)

    if (!post || post.type !== 'poll') {
      return res.status(404).json({ message: 'Poll not found.' })
    }

    if (post.poll.endsAt && new Date() > post.poll.endsAt) {
      return res.status(400).json({ message: 'Poll has ended.' })
    }

    const userId = req.user._id

    // Remove existing votes if not multiple choice
    if (!post.poll.allowMultiple) {
      post.poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(
          v => v.toString() !== userId.toString()
        )
      })
    }

    // Toggle vote
    const option = post.poll.options[optionIndex]
    const hasVoted = option.votes.some(
      v => v.toString() === userId.toString()
    )

    if (hasVoted) {
      option.votes = option.votes.filter(
        v => v.toString() !== userId.toString()
      )
    } else {
      option.votes.push(userId)
    }

    await post.save()

    const totalVotes = post.poll.options.reduce(
      (sum, opt) => sum + opt.votes.length, 0
    )

    res.json({
      voted: !hasVoted,
      poll: {
        options: post.poll.options.map((opt, i) => ({
          text: opt.text,
          votes: opt.votes.length,
          percentage: totalVotes > 0
            ? Math.round((opt.votes.length / totalVotes) * 100)
            : 0,
          hasVoted: opt.votes.some(v => v.toString() === userId.toString()),
        })),
        totalVotes,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── PIN POST (admin only) ─────────────────────────────────────────
export const togglePin = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })
    post.pinned = !post.pinned
    await post.save()
    res.json({ pinned: post.pinned })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE POST ──────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found.' })

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await post.deleteOne()
    res.json({ message: 'Post deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY POSTS ─────────────────────────────────────────────────
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar branch year college role')
    res.json({ posts })
  } catch (err) {
    sendServerError(res, err)
  }
}