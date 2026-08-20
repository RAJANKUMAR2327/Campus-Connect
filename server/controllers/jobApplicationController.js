import JobApplication from '../models/JobApplication.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

const statusOrder = [
  'wishlist', 'applied', 'oa-test', 'interview-1',
  'interview-2', 'interview-3', 'hr-round', 'offer', 'accepted',
]

// ─── CREATE APPLICATION ────────────────────────────────────────────
export const createApplication = async (req, res) => {
  try {
    const {
      company, role, type, source, location, workMode,
      package: pkg, jobUrl, appliedDate, deadline,
      referredBy, contactPerson, contactEmail, notes,
      resumeVersion, priority, color,
    } = req.body

    const application = await JobApplication.create({
      user: req.user._id,
      company, role, type, source, location, workMode,
      package: pkg, jobUrl, appliedDate, deadline,
      referredBy, contactPerson, contactEmail, notes,
      resumeVersion, priority, color,
      statusHistory: [{ status: 'applied' }],
    })

    res.status(201).json({ message: 'Application added!', application })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL APPLICATIONS ──────────────────────────────────────────
export const getApplications = async (req, res) => {
  try {
    const { status, type, source, search } = req.query
    const filter = { user: req.user._id }

    if (status) filter.status = status
    if (type) filter.type = type
    if (source) filter.source = source
    if (search) {
      filter.$or = [
        { company: new RegExp(escapeRegex(search), 'i') },
        { role: new RegExp(escapeRegex(search), 'i') },
      ]
    }

    const applications = await JobApplication.find(filter).sort({ appliedDate: -1 })

    res.json({ applications })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET KANBAN BOARD (grouped by status) ─────────────────────────
export const getKanbanBoard = async (req, res) => {
  try {
    const applications = await JobApplication.find({ user: req.user._id })
      .sort({ appliedDate: -1 })

    const board = {}
    statusOrder.forEach(s => { board[s] = [] })
    board.rejected = []
    board.withdrawn = []

    applications.forEach(app => {
      if (!board[app.status]) board[app.status] = []
      board[app.status].push(app)
    })

    res.json({ board })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SINGLE APPLICATION ────────────────────────────────────────
export const getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id, user: req.user._id,
    })
    if (!application) return res.status(404).json({ message: 'Not found.' })
    res.json({ application })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE APPLICATION ────────────────────────────────────────────
// SECURITY FIX: this used to be `Object.assign(application, req.body)`,
// which wrote every key in the request body directly onto the document —
// including `user` (letting an attacker reassign their own application to
// someone else's account), plus `status`/`statusHistory`/`interviewRounds`,
// which are meant to be managed only by their own dedicated endpoints
// below. Now it explicitly whitelists the same editable fields
// createApplication accepts, matching the pattern used everywhere else in
// this codebase.
export const updateApplication = async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id, user: req.user._id,
    })
    if (!application) return res.status(404).json({ message: 'Not found.' })

    const {
      company, role, type, source, location, workMode,
      package: pkg, jobUrl, appliedDate, deadline,
      referredBy, contactPerson, contactEmail, notes,
      resumeVersion, priority, color,
    } = req.body

    const editable = {
      company, role, type, source, location, workMode,
      package: pkg, jobUrl, appliedDate, deadline,
      referredBy, contactPerson, contactEmail, notes,
      resumeVersion, priority, color,
    }
    for (const [key, value] of Object.entries(editable)) {
      if (value !== undefined) application[key] = value
    }

    await application.save()

    res.json({ message: 'Updated!', application })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE STATUS (with history tracking) ─────────────────────────
export const updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body
    const application = await JobApplication.findOne({
      _id: req.params.id, user: req.user._id,
    })
    if (!application) return res.status(404).json({ message: 'Not found.' })

    application.status = status
    application.statusHistory.push({ status, notes })
    await application.save()

    res.json({ message: 'Status updated!', application })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADD INTERVIEW ROUND ───────────────────────────────────────────
export const addInterviewRound = async (req, res) => {
  try {
    const { round, date, mode, notes, result } = req.body
    const application = await JobApplication.findOne({
      _id: req.params.id, user: req.user._id,
    })
    if (!application) return res.status(404).json({ message: 'Not found.' })

    application.interviewRounds.push({ round, date, mode, notes, result })
    await application.save()

    res.json({ message: 'Round added!', application })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE APPLICATION ────────────────────────────────────────────
export const deleteApplication = async (req, res) => {
  try {
    await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ANALYTICS ──────────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const applications = await JobApplication.find({ user: req.user._id })

    const total = applications.length
    const byStatus = {}
    statusOrder.concat(['rejected', 'withdrawn']).forEach(s => { byStatus[s] = 0 })
    applications.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1 })

    const interviewing = applications.filter(a =>
      ['oa-test', 'interview-1', 'interview-2', 'interview-3', 'hr-round'].includes(a.status)
    ).length

    const offers = applications.filter(a => ['offer', 'accepted'].includes(a.status)).length
    const rejected = byStatus.rejected || 0

    const responseRate = total > 0
      ? Math.round(((total - byStatus.applied - byStatus.wishlist) / total) * 100)
      : 0

    const successRate = total > 0 ? Math.round((offers / total) * 100) : 0

    // By source
    const sourceMap = {}
    applications.forEach(a => { sourceMap[a.source] = (sourceMap[a.source] || 0) + 1 })

    // Companies applied
    const companies = [...new Set(applications.map(a => a.company))]

    // Upcoming deadlines
    const upcomingDeadlines = applications
      .filter(a => a.deadline && new Date(a.deadline) >= new Date())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)

    res.json({
      total, byStatus, interviewing, offers, rejected,
      responseRate, successRate,
      sourceBreakdown: Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
      totalCompanies: companies.length,
      upcomingDeadlines,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}