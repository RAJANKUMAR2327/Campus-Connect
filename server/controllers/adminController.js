import User from '../models/User.js'
import Note from '../models/Note.js'
import Event from '../models/Event.js'
import Listing from '../models/Listing.js'
import LostFound from '../models/LostFound.js'
import Placement from '../models/Placement.js'
import Comment from '../models/Comment.js'
import AuditLog from '../models/AuditLog.js'
import { logAdminAction } from '../utils/auditLog.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── DASHBOARD STATS ──────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, totalNotes, totalEvents,
      totalListings, totalLostFound, totalPlacements,
      totalComments, recentUsers, recentNotes,
    ] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments(),
      Event.countDocuments(),
      Listing.countDocuments(),
      LostFound.countDocuments(),
      Placement.countDocuments(),
      Comment.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5)
        .select('name email branch year college createdAt role'),
      Note.find().sort({ createdAt: -1 }).limit(5)
        .populate('uploader', 'name branch'),
    ])

    // User growth by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    // Branch distribution
    const branchDist = await User.aggregate([
      { $match: { branch: { $exists: true, $ne: '' } } },
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ])

    // College distribution
    const collegeDist = await User.aggregate([
      { $match: { college: { $exists: true, $ne: '' } } },
      { $group: { _id: '$college', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const growthData = userGrowth.map(u => ({
      month: months[u._id.month - 1],
      users: u.count,
    }))

    res.json({
      stats: {
        totalUsers, totalNotes, totalEvents,
        totalListings, totalLostFound,
        totalPlacements, totalComments,
      },
      recentUsers,
      recentNotes,
      userGrowth: growthData,
      branchDist: branchDist.map(b => ({ branch: b._id, count: b.count })),
      collegeDist: collegeDist.map(c => ({ college: c._id, count: c.count })),
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── USER MANAGEMENT ──────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query
    const filter = {}
    if (role) filter.role = role
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), 'i') },
        { email: new RegExp(escapeRegex(search), 'i') },
        { college: new RegExp(escapeRegex(search), 'i') },
      ]
    }
    const skip = (Number(page) - 1) * Number(limit)
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ])
    res.json({ users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' })
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role. Ask another admin to do this.' })
    }
    const previousUser = await User.findById(req.params.id).select('role name')
    if (!previousUser) return res.status(404).json({ message: 'User not found.' })

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })

    await logAdminAction({
      adminId: req.user._id, action: 'update_user_role', targetType: 'User', targetId: user._id,
      details: { userName: user.name, from: previousUser.role, to: role },
    })

    res.json({ message: 'Role updated!', user })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account.' })
    }
    const user = await User.findById(req.params.id).select('name email')
    if (!user) return res.status(404).json({ message: 'User not found.' })

    await User.findByIdAndDelete(req.params.id)

    await logAdminAction({
      adminId: req.user._id, action: 'delete_user', targetType: 'User', targetId: req.params.id,
      details: { userName: user.name, email: user.email },
    })

    res.json({ message: 'User deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const toggleUserVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    user.isVerified = !user.isVerified
    await user.save()

    await logAdminAction({
      adminId: req.user._id, action: 'toggle_user_verification', targetType: 'User', targetId: user._id,
      details: { userName: user.name, isVerified: user.isVerified },
    })

    res.json({ message: `User ${user.isVerified ? 'verified' : 'unverified'}!`, user })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No users selected.' })
    }
    if (ids.includes(req.user._id.toString())) {
      return res.status(400).json({ message: 'Cannot delete your own account.' })
    }

    await User.deleteMany({ _id: { $in: ids } })

    await logAdminAction({
      adminId: req.user._id, action: 'bulk_delete_users', targetType: 'User',
      details: { count: ids.length, ids },
    })

    res.json({ message: `${ids.length} user${ids.length !== 1 ? 's' : ''} deleted.` })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── AUDIT LOG ─────────────────────────────────────────────────────
export const getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('admin', 'name email'),
      AuditLog.countDocuments(),
    ])
    res.json({ logs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}
export const getAllNotes = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [notes, total] = await Promise.all([
      Note.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('uploader', 'name email'),
      Note.countDocuments(),
    ])
    res.json({ notes, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).select('title')
    await Note.findByIdAndDelete(req.params.id)

    await logAdminAction({
      adminId: req.user._id, action: 'delete_note', targetType: 'Note', targetId: req.params.id,
      details: { title: note?.title },
    })

    res.json({ message: 'Note deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const bulkDeleteNotes = async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No notes selected.' })
    }
    await Note.deleteMany({ _id: { $in: ids } })

    await logAdminAction({
      adminId: req.user._id, action: 'bulk_delete_notes', targetType: 'Note',
      details: { count: ids.length, ids },
    })

    res.json({ message: `${ids.length} note${ids.length !== 1 ? 's' : ''} deleted.` })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id)

    await logAdminAction({
      adminId: req.user._id, action: 'delete_comment', targetType: 'Comment', targetId: req.params.id,
    })

    res.json({ message: 'Comment deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const bulkDeleteComments = async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No comments selected.' })
    }
    await Comment.deleteMany({ _id: { $in: ids } })

    await logAdminAction({
      adminId: req.user._id, action: 'bulk_delete_comments', targetType: 'Comment',
      details: { count: ids.length, ids },
    })

    res.json({ message: `${ids.length} comment${ids.length !== 1 ? 's' : ''} deleted.` })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [comments, total] = await Promise.all([
      Comment.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('author', 'name email'),
      Comment.countDocuments(),
    ])
    res.json({ comments, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}