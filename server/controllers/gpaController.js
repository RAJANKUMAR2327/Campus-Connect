import GpaRecord from '../models/GpaRecord.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── CREATE A SEMESTER RECORD ───────────────────────────────────────
export const createGpaRecord = async (req, res) => {
  try {
    const { semesterLabel, courses } = req.body
    if (!semesterLabel || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ message: 'Semester label and at least one course are required.' })
    }

    let totalPoints = 0
    let totalCredits = 0
    for (const c of courses) {
      if (!c.name || !c.credits || c.gradePoint === undefined) {
        return res.status(400).json({ message: 'Each course needs a name, credits, and grade.' })
      }
      totalPoints += c.credits * c.gradePoint
      totalCredits += Number(c.credits)
    }
    const sgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0

    const record = await GpaRecord.create({
      user: req.user._id, semesterLabel, courses, sgpa, totalCredits, totalPoints,
    })

    res.status(201).json({ message: 'Semester saved!', record })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL RECORDS + CGPA ──────────────────────────────────────────
export const getGpaRecords = async (req, res) => {
  try {
    const records = await GpaRecord.find({ user: req.user._id }).sort({ createdAt: 1 })

    let totalPoints = 0
    let totalCredits = 0
    records.forEach(r => {
      // CORRECTNESS FIX (GPA-01): prefer the raw, unrounded totalPoints
      // stored on the record (see models/GpaRecord.js). Records created
      // before this fix won't have it — for those (and only those), fall
      // back to the old reconstruction. New records always have the
      // accurate value, so this fallback's small imprecision doesn't
      // compound any further going forward.
      totalPoints += r.totalPoints ?? (r.sgpa * r.totalCredits)
      totalCredits += r.totalCredits
    })
    const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0

    res.json({ records, cgpa })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE A RECORD ─────────────────────────────────────────────────
export const deleteGpaRecord = async (req, res) => {
  try {
    await GpaRecord.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Semester removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
