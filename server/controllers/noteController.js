import Note from '../models/Note.js'
import { deleteFromCloudinary } from '../utils/cloudinary.js'
import { awardXP } from '../utils/xpEngine.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── UPLOAD NOTE ──────────────────────────────────────────────────
export const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file.' })
    }

    const { title, description, subject, branch, year, semester, tags } = req.body

    const note = await Note.create({
      title,
      description,
      subject,
      branch,
      year: Number(year),
      semester: semester ? Number(semester) : undefined,
      tags: tags ? JSON.parse(tags) : [],
      fileUrl: req.file.path,
      filePublicId: req.file.filename,
      fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      fileSizeKB: Math.round(req.file.size / 1024),
      uploader: req.user._id,
    })

    await note.populate('uploader', 'name branch year avatar')
    await awardXP(req.user._id, 'UPLOAD_NOTE', 'notesUploaded')

    res.status(201).json({ message: 'Note uploaded successfully!', note })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL NOTES (with filters + search + pagination) ───────────
export const getNotes = async (req, res) => {
  try {
    const {
      branch,
      year,
      subject,
      search,
      tags,
      page = 1,
      limit = 12,
      sort = 'newest',
    } = req.query

    const filter = { isApproved: true }

    if (branch) filter.branch = branch
    if (year) filter.year = Number(year)
    if (subject) filter.subject = new RegExp(escapeRegex(subject), 'i')
    if (tags) filter.tags = { $in: tags.split(',') }
    if (search) filter.$text = { $search: search }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { downloadCount: -1 },
      liked: { likes: -1 },
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit))
        .populate('uploader', 'name branch year avatar'),
      Note.countDocuments(filter),
    ])

    res.json({
      notes,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SINGLE NOTE ──────────────────────────────────────────────
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      'uploader',
      'name branch year avatar'
    )

    if (!note) return res.status(404).json({ message: 'Note not found.' })

    res.json({ note })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── INCREMENT DOWNLOAD COUNT ─────────────────────────────────────
export const trackDownload = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    )

    if (!note) return res.status(404).json({ message: 'Note not found.' })
      await awardXP(req.user._id, 'DOWNLOAD_NOTE', 'notesDownloaded')

    res.json({ downloadUrl: note.fileUrl, downloadCount: note.downloadCount })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE LIKE ──────────────────────────────────────────────────
export const toggleLike = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Note not found.' })

    const userId = req.user._id
    const alreadyLiked = note.likes.includes(userId)

    if (alreadyLiked) {
      note.likes.pull(userId)
    } else {
      note.likes.push(userId)
    }

    await note.save()

    res.json({
      liked: !alreadyLiked,
      likeCount: note.likes.length,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE BOOKMARK ──────────────────────────────────────────────
export const toggleBookmark = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Note not found.' })

    const userId = req.user._id
    const alreadyBookmarked = note.bookmarks.includes(userId)

    if (alreadyBookmarked) {
      note.bookmarks.pull(userId)
    } else {
      note.bookmarks.push(userId)
    }

    await note.save()

    res.json({
      bookmarked: !alreadyBookmarked,
      bookmarkCount: note.bookmarks.length,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY UPLOADS ───────────────────────────────────────────────
export const getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({ uploader: req.user._id }).sort({ createdAt: -1 })
    res.json({ notes })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY BOOKMARKS ─────────────────────────────────────────────
export const getMyBookmarks = async (req, res) => {
  try {
    const notes = await Note.find({ bookmarks: req.user._id })
      .sort({ createdAt: -1 })
      .populate('uploader', 'name branch year avatar')
    res.json({ notes })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE NOTE ──────────────────────────────────────────────────
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Note not found.' })

    // Only uploader or admin can delete
    if (
      note.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this note.' })
    }

    await deleteFromCloudinary(note.filePublicId, 'raw')
    await note.deleteOne()

    res.json({ message: 'Note deleted successfully.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET FILTER OPTIONS (for dropdowns) ───────────────────────────
export const getFilterOptions = async (req, res) => {
  try {
    const [branches, subjects] = await Promise.all([
      Note.distinct('branch'),
      Note.distinct('subject'),
    ])
    res.json({ branches, subjects, years: [1, 2, 3, 4, 5] })
  } catch (err) {
    sendServerError(res, err)
  }
}