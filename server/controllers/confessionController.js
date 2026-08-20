import Confession from '../models/Confession.js'
import ConfessionComment from '../models/ConfessionComment.js'
import { generateAuthorHash, getAnonymousName, getAnonymousAvatarColor } from '../utils/anonymizer.js'
import { sendServerError } from '../utils/errorResponse.js'

const FLAG_THRESHOLD = 5 // auto-hide after this many flags

// ─── CREATE CONFESSION ──────────────────────────────────────────────
export const createConfession = async (req, res) => {
  try {
    const { content, type, category } = req.body

    const authorHash = generateAuthorHash(req.user._id, 'confession-' + Date.now())

    const confession = await Confession.create({
      content, type, category,
      authorHash,
      realAuthor: req.user._id,
      college: req.user.college,
    })

    res.status(201).json({
      message: 'Posted anonymously!',
      confession: formatConfession(confession, req.user._id),
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET FEED ────────────────────────────────────────────────────────
export const getFeed = async (req, res) => {
  try {
    const { type, category, scope = 'college', search, page = 1, limit = 15, sort = 'newest' } = req.query
    const filter = { isHidden: false }

    if (scope === 'college') filter.college = req.user.college
    if (type) filter.type = type
    if (category) filter.category = category
    if (search) filter.$text = { $search: search }

    const sortOptions = {
      newest: { createdAt: -1 },
      popular: { commentCount: -1 },
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [confessions, total] = await Promise.all([
      Confession.find(filter).sort(sortOptions[sort] || sortOptions.newest).skip(skip).limit(Number(limit)),
      Confession.countDocuments(filter),
    ])

    res.json({
      confessions: confessions.map(c => formatConfession(c, req.user._id)),
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SINGLE CONFESSION ──────────────────────────────────────────
export const getConfessionById = async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id)
    if (!confession || confession.isHidden) return res.status(404).json({ message: 'Not found.' })
    res.json({ confession: formatConfession(confession, req.user._id) })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE REACTION ─────────────────────────────────────────────────
export const toggleReaction = async (req, res) => {
  try {
    const { type } = req.body
    const validTypes = ['relate', 'support', 'laugh', 'hug']
    if (!validTypes.includes(type)) return res.status(400).json({ message: 'Invalid reaction.' })

    const confession = await Confession.findById(req.params.id)
    if (!confession) return res.status(404).json({ message: 'Not found.' })

    // Use a stable hash for THIS user reacting to THIS confession (to prevent double-reacting)
    const reactorHash = generateAuthorHash(req.user._id, 'reaction-' + confession._id)
    const hasReacted = confession.reactions[type].includes(reactorHash)

    validTypes.forEach(t => {
      confession.reactions[t] = confession.reactions[t].filter(h => h !== reactorHash)
    })

    if (!hasReacted) confession.reactions[type].push(reactorHash)

    await confession.save()

    res.json({
      reacted: !hasReacted,
      reactions: {
        relate: confession.reactions.relate.length,
        support: confession.reactions.support.length,
        laugh: confession.reactions.laugh.length,
        hug: confession.reactions.hug.length,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── FLAG CONFESSION ─────────────────────────────────────────────────
export const flagConfession = async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id)
    if (!confession) return res.status(404).json({ message: 'Not found.' })

    confession.flagCount += 1
    if (confession.flagCount >= FLAG_THRESHOLD) {
      confession.isHidden = true
    }
    await confession.save()

    res.json({ message: 'Reported. Thank you for keeping the community safe.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── MARK RESOLVED (for questions) ──────────────────────────────────
export const toggleResolved = async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id)
    if (!confession) return res.status(404).json({ message: 'Not found.' })

    // Only the original (anonymous) poster can mark resolved — verify via realAuthor
    if (confession.realAuthor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    confession.isResolved = !confession.isResolved
    await confession.save()
    res.json({ isResolved: confession.isResolved })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE (only own anonymous post) ───────────────────────────────
export const deleteConfession = async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id)
    if (!confession) return res.status(404).json({ message: 'Not found.' })

    if (confession.realAuthor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await ConfessionComment.deleteMany({ confession: confession._id })
    await confession.deleteOne()
    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── MY OWN POSTS (to let user manage their own anon posts) ─────────
export const getMyConfessions = async (req, res) => {
  try {
    const confessions = await Confession.find({ realAuthor: req.user._id }).sort({ createdAt: -1 })
    res.json({ confessions: confessions.map(c => formatConfession(c, req.user._id)) })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── COMMENTS ────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { content } = req.body
    const confession = await Confession.findById(req.params.id)
    if (!confession) return res.status(404).json({ message: 'Not found.' })

    const authorHash = generateAuthorHash(req.user._id, 'comment-' + confession._id)

    const comment = await ConfessionComment.create({
      confession: confession._id,
      content,
      authorHash,
      realAuthor: req.user._id,
    })

    confession.commentCount += 1
    await confession.save()

    res.status(201).json({ comment: formatComment(comment, req.user._id) })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getComments = async (req, res) => {
  try {
    const comments = await ConfessionComment.find({ confession: req.params.id, isFlagged: false })
      .sort({ createdAt: -1 })
    res.json({ comments: comments.map(c => formatComment(c, req.user._id)) })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const toggleCommentLike = async (req, res) => {
  try {
    const comment = await ConfessionComment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Not found.' })

    const reactorHash = generateAuthorHash(req.user._id, 'comment-like-' + comment._id)
    const liked = comment.likes.includes(reactorHash)

    if (liked) comment.likes = comment.likes.filter(h => h !== reactorHash)
    else comment.likes.push(reactorHash)

    await comment.save()
    res.json({ liked: !liked, count: comment.likes.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── HELPERS: format output without leaking real identity ──────────
function formatConfession(c, currentUserId) {
  const isMine = c.realAuthor.toString() === currentUserId.toString()
  return {
    _id: c._id,
    content: c.content,
    type: c.type,
    category: c.category,
    anonName: getAnonymousName(c.authorHash),
    avatarColor: getAnonymousAvatarColor(c.authorHash),
    isResolved: c.isResolved,
    isMine, // lets frontend show delete/resolve buttons only to the real author
    commentCount: c.commentCount,
    reactions: {
      relate: c.reactions.relate.length,
      support: c.reactions.support.length,
      laugh: c.reactions.laugh.length,
      hug: c.reactions.hug.length,
    },
    createdAt: c.createdAt,
  }
}

function formatComment(c, currentUserId) {
  const isMine = c.realAuthor.toString() === currentUserId.toString()
  return {
    _id: c._id,
    content: c.content,
    anonName: getAnonymousName(c.authorHash),
    avatarColor: getAnonymousAvatarColor(c.authorHash),
    isMine,
    likeCount: c.likes.length,
    createdAt: c.createdAt,
  }
}