import AttendanceSubject from '../models/AttendanceSubject.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── CREATE SUBJECT ───────────────────────────────────────────────
export const createSubject = async (req, res) => {
  try {
    const { name, color, minRequiredPercent } = req.body
    if (!name) return res.status(400).json({ message: 'Subject name is required.' })

    const subject = await AttendanceSubject.create({
      user: req.user._id, name, color, minRequiredPercent,
    })
    res.status(201).json({ message: 'Subject added!', subject })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL SUBJECTS ─────────────────────────────────────────────
export const getSubjects = async (req, res) => {
  try {
    const subjects = await AttendanceSubject.find({ user: req.user._id }).sort({ createdAt: 1 })
    res.json({ subjects })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── MARK A CLASS PRESENT/ABSENT ──────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { status } = req.body // 'present' | 'absent'
    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'Status must be present or absent.' })
    }

    const subject = await AttendanceSubject.findOne({ _id: req.params.id, user: req.user._id })
    if (!subject) return res.status(404).json({ message: 'Subject not found.' })

    subject.totalClasses += 1
    if (status === 'present') subject.attendedClasses += 1
    subject.log.push({ date: new Date(), status })
    if (subject.log.length > 60) subject.log = subject.log.slice(-60) // keep last 60 entries

    await subject.save()
    res.json({ message: 'Attendance marked!', subject })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UNDO LAST MARK (fix a mistake) ───────────────────────────────
export const undoLastMark = async (req, res) => {
  try {
    const subject = await AttendanceSubject.findOne({ _id: req.params.id, user: req.user._id })
    if (!subject) return res.status(404).json({ message: 'Subject not found.' })
    if (subject.totalClasses === 0) return res.status(400).json({ message: 'Nothing to undo.' })

    const last = subject.log.pop()
    subject.totalClasses -= 1
    if (last?.status === 'present') subject.attendedClasses -= 1

    await subject.save()
    res.json({ message: 'Last entry undone.', subject })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE SUBJECT (name/color/threshold) ────────────────────────
export const updateSubject = async (req, res) => {
  try {
    const { name, color, minRequiredPercent } = req.body
    const subject = await AttendanceSubject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { ...(name && { name }), ...(color && { color }), ...(minRequiredPercent !== undefined && { minRequiredPercent }) } },
      { new: true }
    )
    if (!subject) return res.status(404).json({ message: 'Subject not found.' })
    res.json({ message: 'Updated!', subject })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE SUBJECT ────────────────────────────────────────────────
export const deleteSubject = async (req, res) => {
  try {
    await AttendanceSubject.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Subject removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
