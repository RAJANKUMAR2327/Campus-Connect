import Report from '../models/Report.js'
import { logAdminAction } from '../utils/auditLog.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── SUBMIT A REPORT (any logged-in user) ────────────────────────────
export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Target and reason are required.' })
    }

    const report = await Report.create({
      reporter: req.user._id, targetType, targetId, reason, details,
    })
    res.status(201).json({ message: 'Report submitted. Our team will review it.', report })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET REPORTS QUEUE (admin only) ──────────────────────────────────
export const getReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const filter = status === 'all' ? {} : { status }
    const skip = (Number(page) - 1) * Number(limit)

    const [reports, total, pendingCount] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('reporter', 'name email avatar')
        .populate('reviewedBy', 'name'),
      Report.countDocuments(filter),
      Report.countDocuments({ status: 'pending' }),
    ])

    res.json({ reports, pendingCount, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── RESOLVE A REPORT (admin only) ───────────────────────────────────
export const resolveReport = async (req, res) => {
  try {
    const { status, reviewNote } = req.body // 'actioned' | 'dismissed'
    if (!['actioned', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be actioned or dismissed.' })
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user._id, reviewNote },
      { new: true }
    )
    if (!report) return res.status(404).json({ message: 'Report not found.' })

    await logAdminAction({
      adminId: req.user._id, action: 'resolve_report', targetType: 'Report', targetId: report._id,
      details: { status, targetType: report.targetType, targetId: report.targetId },
    })

    res.json({ message: 'Report updated.', report })
  } catch (err) {
    sendServerError(res, err)
  }
}
