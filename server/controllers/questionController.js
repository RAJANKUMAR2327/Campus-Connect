import Question from '../models/Question.js'
import PaperSet from '../models/PaperSet.js'
import QuizAttempt from '../models/QuizAttempt.js'
import { deleteFromCloudinary } from '../utils/cloudinary.js'
import { awardXP } from '../utils/xpEngine.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── ADD QUESTION ─────────────────────────────────────────────────
export const addQuestion = async (req, res) => {
  try {
    const {
      subject, topic, branch, year, semester,
      examYear, examType, type, question,
      options, answer, explanation,
      difficulty, marks, tags,
    } = req.body

    const q = await Question.create({
      subject, topic, branch,
      year: year ? Number(year) : undefined,
      semester: semester ? Number(semester) : undefined,
      examYear: examYear ? Number(examYear) : undefined,
      examType, type, question,
      options: options ? JSON.parse(options) : [],
      answer, explanation, difficulty,
      marks: marks ? Number(marks) : 1,
      tags: tags ? JSON.parse(tags) : [],
      postedBy: req.user._id,
      imageUrl: req.file ? req.file.path : undefined,
    })

    await q.populate('postedBy', 'name branch year')
    await awardXP(req.user._id, 'ADD_QUESTION', 'questionsAdded')
    res.status(201).json({ message: 'Question added!', question: q })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET QUESTIONS ────────────────────────────────────────────────
export const getQuestions = async (req, res) => {
  try {
    const {
      subject, branch, year, examType,
      type, difficulty, search,
      page = 1, limit = 20, sort = 'newest',
    } = req.query

    const filter = {}
    if (subject) filter.subject = new RegExp(escapeRegex(subject), 'i')
    if (branch) filter.branch = branch
    if (year) filter.year = Number(year)
    if (examType) filter.examType = examType
    if (type) filter.type = type
    if (difficulty) filter.difficulty = difficulty
    if (search) filter.$text = { $search: search }

    const sortOptions = {
      newest: { createdAt: -1 },
      popular: { upvotes: -1 },
      attempts: { attempts: -1 },
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit))
        .populate('postedBy', 'name branch year avatar'),
      Question.countDocuments(filter),
    ])

    res.json({
      questions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SUBJECTS LIST ────────────────────────────────────────────
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Question.distinct('subject')
    const branches = await Question.distinct('branch')
    const examTypes = ['mid-sem', 'end-sem', 'quiz', 'assignment', 'practice']
    res.json({ subjects, branches, examTypes })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE UPVOTE ────────────────────────────────────────────────
export const toggleUpvote = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id)
    if (!q) return res.status(404).json({ message: 'Question not found.' })

    const userId = req.user._id
    const hasUpvoted = q.upvotes.includes(userId)

    if (hasUpvoted) q.upvotes.pull(userId)
    else q.upvotes.push(userId)

    await q.save()
    res.json({ upvoted: !hasUpvoted, count: q.upvotes.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE BOOKMARK ──────────────────────────────────────────────
export const toggleBookmark = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id)
    if (!q) return res.status(404).json({ message: 'Question not found.' })

    const userId = req.user._id
    const hasBookmarked = q.bookmarks.includes(userId)

    if (hasBookmarked) q.bookmarks.pull(userId)
    else q.bookmarks.push(userId)

    await q.save()
    res.json({ bookmarked: !hasBookmarked, count: q.bookmarks.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── SUBMIT QUIZ ATTEMPT ──────────────────────────────────────────
export const submitAttempt = async (req, res) => {
  try {
    const { answers, subject, timeTaken } = req.body
    // answers: [{ questionId, selectedAnswer }]

    const questionIds = answers.map(a => a.questionId)
    const questions = await Question.find({ _id: { $in: questionIds } })

    let correct = 0
    const results = answers.map(a => {
      const q = questions.find(q => q._id.toString() === a.questionId)
      const isCorrect = q?.answer === a.selectedAnswer
      if (isCorrect) correct++
      return {
        question: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect,
        timeTaken: a.timeTaken || 0,
      }
    })
    await awardXP(req.user._id, 'COMPLETE_QUIZ', 'quizzesCompleted')

    // Update question stats
    for (const a of results) {
      await Question.findByIdAndUpdate(a.question, {
        $inc: {
          attempts: 1,
          correctAttempts: a.isCorrect ? 1 : 0,
        },
      })
    }

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      questions: results,
      subject,
      totalQuestions: answers.length,
      correctAnswers: correct,
      score: Math.round((correct / answers.length) * 100),
      timeTaken,
    })

    res.json({
      score: attempt.score,
      correct,
      total: answers.length,
      results,
      attemptId: attempt._id,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY ATTEMPTS ──────────────────────────────────────────────
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json({ attempts })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET BOOKMARKED QUESTIONS ─────────────────────────────────────
export const getBookmarked = async (req, res) => {
  try {
    const questions = await Question.find({ bookmarks: req.user._id })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name branch year avatar')
    res.json({ questions })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE QUESTION ──────────────────────────────────────────────
export const deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id)
    if (!q) return res.status(404).json({ message: 'Question not found.' })

    if (q.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await q.deleteOne()
    res.json({ message: 'Question deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADD PAPER SET ────────────────────────────────────────────────
export const addPaperSet = async (req, res) => {
  try {
    const {
      title, subject, branch, year,
      semester, examYear, examType,
      duration, totalMarks, college,
    } = req.body

    const paper = await PaperSet.create({
      title, subject, branch,
      year: year ? Number(year) : undefined,
      semester: semester ? Number(semester) : undefined,
      examYear: Number(examYear),
      examType, duration, totalMarks, college,
      fileUrl: req.file ? req.file.path : undefined,
      filePublicId: req.file ? req.file.filename : undefined,
      postedBy: req.user._id,
    })

    await paper.populate('postedBy', 'name branch year')
    res.status(201).json({ message: 'Paper added!', paper })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET PAPER SETS ───────────────────────────────────────────────
export const getPaperSets = async (req, res) => {
  try {
    const { subject, branch, year, examType, examYear, page = 1, limit = 12 } = req.query
    const filter = {}
    if (subject) filter.subject = new RegExp(escapeRegex(subject), 'i')
    if (branch) filter.branch = branch
    if (year) filter.year = Number(year)
    if (examType) filter.examType = examType
    if (examYear) filter.examYear = Number(examYear)

    const skip = (Number(page) - 1) * Number(limit)

    const [papers, total] = await Promise.all([
      PaperSet.find(filter)
        .sort({ examYear: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('postedBy', 'name branch year avatar'),
      PaperSet.countDocuments(filter),
    ])

    res.json({ papers, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TRACK PAPER DOWNLOAD ─────────────────────────────────────────
export const trackDownload = async (req, res) => {
  try {
    const paper = await PaperSet.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    )
    if (!paper) return res.status(404).json({ message: 'Paper not found.' })
    res.json({ fileUrl: paper.fileUrl, downloads: paper.downloads })
  } catch (err) {
    sendServerError(res, err)
  }
}