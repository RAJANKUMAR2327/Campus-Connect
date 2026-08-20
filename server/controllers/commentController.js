import Comment from '../models/Comment.js'
import { awardXP } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

export const addComment = async (req, res) => {
  try {
    const { content } = req.body
    const { targetId, targetType } = req.params

    const comment = await Comment.create({
      content,
      author: req.user._id,
      targetId,
      targetType,
    })

    await comment.populate('author', 'name avatar branch year')
    await awardXP(req.user._id, 'COMMENT', 'commentsPosted')
    res.status(201).json({ message: 'Comment added!', comment })
  } catch (err) {
    sendServerError(res, err)
  }
}

// PERFORMANCE FIX (API-02): this used to be an unbounded Comment.find()
// with no .skip()/.limit() — a popular post/confession with thousands of
// comments returned them all in one response. Default limit is set high
// (50) rather than something small like 15, specifically so this doesn't
// silently truncate what existing frontend code (Comments.jsx) expects to
// receive and render in one shot for realistic thread sizes — this is
// about capping the pathological case, not changing normal-case behavior.
// `total` now reflects the true total comment count via countDocuments,
// not comments.length (which was tautological before, since it just
// equaled whatever the unbounded query happened to return).
export const getComments = async (req, res) => {
  try {
    const { targetId, targetType } = req.params
    const { page = 1, limit = 50 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [comments, total] = await Promise.all([
      Comment.find({ targetId, targetType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name avatar branch year'),
      Comment.countDocuments({ targetId, targetType }),
    ])

    res.json({
      comments,
      total,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + comments.length < total,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found.' })

    const userId = req.user._id
    const liked = comment.likes.includes(userId)

    if (liked) comment.likes.pull(userId)
    else comment.likes.push(userId)

    await comment.save()
    res.json({ liked: !liked, likeCount: comment.likes.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found.' })

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await comment.deleteOne()
    res.json({ message: 'Comment deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}