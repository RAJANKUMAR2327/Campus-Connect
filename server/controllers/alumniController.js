import AlumniProfile from '../models/AlumniProfile.js'
import User from '../models/User.js'
import { sendServerError } from '../utils/errorResponse.js'
import { escapeRegex } from '../utils/escapeRegex.js'

// ─── CREATE MY ALUMNI PROFILE ──────────────────────────────────────
export const createAlumniProfile = async (req, res) => {
  try {
    const {
      graduationYear, currentCompany, currentRole, industry,
      location, bio, linkedIn, willingToMentor, skills,
    } = req.body

    const existing = await AlumniProfile.findOne({ user: req.user._id })
    if (existing) return res.status(400).json({ message: 'You already have an alumni profile.' })

    if (!graduationYear) return res.status(400).json({ message: 'Graduation year is required.' })

    const profile = await AlumniProfile.create({
      user: req.user._id,
      graduationYear, currentCompany, currentRole, industry,
      location, bio, linkedIn,
      willingToMentor: willingToMentor !== undefined ? willingToMentor : true,
      skills: Array.isArray(skills) ? skills : [],
    })

    await profile.populate('user', 'name avatar branch year college')
    res.status(201).json({ message: 'Alumni profile created!', profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE MY ALUMNI PROFILE ───────────────────────────────────────
export const updateAlumniProfile = async (req, res) => {
  try {
    const {
      graduationYear, currentCompany, currentRole, industry,
      location, bio, linkedIn, willingToMentor, skills,
    } = req.body

    const profile = await AlumniProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(graduationYear && { graduationYear }),
        ...(currentCompany !== undefined && { currentCompany }),
        ...(currentRole !== undefined && { currentRole }),
        ...(industry && { industry }),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(linkedIn !== undefined && { linkedIn }),
        ...(willingToMentor !== undefined && { willingToMentor }),
        ...(Array.isArray(skills) && { skills }),
      },
      { new: true }
    ).populate('user', 'name avatar branch year college')

    if (!profile) return res.status(404).json({ message: 'Alumni profile not found.' })
    res.json({ message: 'Profile updated!', profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY ALUMNI PROFILE ──────────────────────────────────────────
export const getMyAlumniProfile = async (req, res) => {
  try {
    const profile = await AlumniProfile.findOne({ user: req.user._id }).populate('user', 'name avatar branch year college')
    res.json({ profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── LIST / SEARCH ALUMNI DIRECTORY ─────────────────────────────────
// PERFORMANCE FIX (API-03): this used to be doubly inefficient — an
// unbounded AlumniProfile.find() with no pagination, AND the search term
// was applied via a JS .filter() *after* fetching every matching profile
// into memory, rather than as part of the DB query. As the alumni base
// grows over years, this fetches the entire directory on every text
// search regardless of how few results actually matched. Search now runs
// in the query itself (a name match requires a small separate User
// lookup first, since AlumniProfile doesn't store the user's name
// directly — that lookup goes through escapeRegex like every other
// user-supplied search term in this codebase). Default limit is set high
// (100) so this doesn't silently truncate what existing frontend code
// (AlumniNetwork.jsx) expects for realistic directory sizes — this caps
// the pathological case, not normal-case behavior.
export const getAlumniDirectory = async (req, res) => {
  try {
    const { industry, graduationYear, willingToMentor, search, page = 1, limit = 100 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const filter = {}
    if (industry) filter.industry = industry
    if (graduationYear) filter.graduationYear = Number(graduationYear)
    if (willingToMentor === 'true') filter.willingToMentor = true

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i')
      const matchingUsers = await User.find({ name: regex }).select('_id')
      filter.$or = [
        { user: { $in: matchingUsers.map((u) => u._id) } },
        { currentCompany: regex },
        { currentRole: regex },
      ]
    }

    const [profiles, total] = await Promise.all([
      AlumniProfile.find(filter)
        .populate('user', 'name avatar branch year college')
        .sort({ graduationYear: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AlumniProfile.countDocuments(filter),
    ])

    res.json({
      profiles,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + profiles.length < total,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE MY ALUMNI PROFILE ───────────────────────────────────────
export const deleteAlumniProfile = async (req, res) => {
  try {
    await AlumniProfile.findOneAndDelete({ user: req.user._id })
    res.json({ message: 'Alumni profile removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
