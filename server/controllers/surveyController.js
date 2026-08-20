import Survey from '../models/Survey.js'
import SurveyResponse from '../models/SurveyResponse.js'
import { createNotification } from './notificationController.js'
import { sendServerError } from '../utils/errorResponse.js'

const COUNCIL_ROLES = ['admin', 'faculty'] // who can create official surveys

export const createSurvey = async (req, res) => {
  try {
    const {
      title, description, questions, targetAudience,
      targetBranch, targetYear, isAnonymous, endDate,
      isOfficial, category,
    } = req.body

    if (isOfficial && !COUNCIL_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admin/faculty can post official surveys.' })
    }

    const survey = await Survey.create({
      title, description,
      questions: JSON.parse(questions),
      createdBy: req.user._id,
      college: req.user.college,
      targetAudience, targetBranch, targetYear,
      isAnonymous, endDate, category,
      isOfficial: isOfficial && COUNCIL_ROLES.includes(req.user.role),
    })

    res.status(201).json({ message: 'Survey created!', survey })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getSurveys = async (req, res) => {
  try {
    const { category, status = 'active' } = req.query
    const filter = { college: req.user.college }

    if (status === 'active') {
      filter.isActive = true
      filter.endDate = { $gte: new Date() }
    } else if (status === 'ended') {
      filter.endDate = { $lt: new Date() }
    }
    if (category) filter.category = category

    // Filter by target audience
    const surveys = await Survey.find(filter)
      .sort({ isOfficial: -1, createdAt: -1 })
      .populate('createdBy', 'name avatar role')

    const relevant = surveys.filter(s => {
      if (s.targetAudience === 'everyone') return true
      if (s.targetAudience === 'branch') return s.targetBranch === req.user.branch
      if (s.targetAudience === 'year') return s.targetYear === req.user.year
      return true
    })

    // Mark which ones the user has already answered
    const responses = await SurveyResponse.find({
      survey: { $in: relevant.map(s => s._id) },
      respondent: req.user._id,
    }).select('survey')
    const answeredIds = new Set(responses.map(r => r.survey.toString()))

    const result = relevant.map(s => ({
      ...s.toObject(),
      hasResponded: answeredIds.has(s._id.toString()),
    }))

    res.json({ surveys: result })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).populate('createdBy', 'name avatar role')
    if (!survey) return res.status(404).json({ message: 'Survey not found.' })

    const existingResponse = await SurveyResponse.findOne({
      survey: survey._id, respondent: req.user._id,
    })

    res.json({ survey, hasResponded: !!existingResponse })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const submitResponse = async (req, res) => {
  try {
    const { answers } = req.body
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found.' })

    if (!survey.isActive || new Date() > survey.endDate) {
      return res.status(400).json({ message: 'This survey has ended.' })
    }

    const existing = await SurveyResponse.findOne({
      survey: survey._id, respondent: req.user._id,
    })
    if (existing) return res.status(400).json({ message: 'You already responded to this survey.' })

    await SurveyResponse.create({
      survey: survey._id,
      respondent: survey.isAnonymous ? undefined : req.user._id,
      isAnonymous: survey.isAnonymous,
      answers,
    })

    survey.responseCount += 1
    await survey.save()

    res.status(201).json({ message: 'Response submitted!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getResults = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found.' })

    // Only creator/admin can see detailed results
    const canView = survey.createdBy.toString() === req.user._id.toString() || req.user.role === 'admin'
    if (!canView) return res.status(403).json({ message: 'Not authorized to view results.' })

    const responses = await SurveyResponse.find({ survey: survey._id })

    const results = survey.questions.map((q, qIndex) => {
      const questionAnswers = responses.map(r =>
        r.answers.find(a => a.questionIndex === qIndex)?.answer
      ).filter(Boolean)

      if (q.type === 'single-choice' || q.type === 'yes-no') {
        const counts = {}
        questionAnswers.forEach(a => { counts[a] = (counts[a] || 0) + 1 })
        return {
          question: q.questionText, type: q.type,
          data: Object.entries(counts).map(([option, count]) => ({
            option, count, percentage: Math.round((count / questionAnswers.length) * 100) || 0,
          })),
        }
      }

      if (q.type === 'multi-choice') {
        const counts = {}
        questionAnswers.forEach(arr => {
          (Array.isArray(arr) ? arr : [arr]).forEach(opt => { counts[opt] = (counts[opt] || 0) + 1 })
        })
        return {
          question: q.questionText, type: q.type,
          data: Object.entries(counts).map(([option, count]) => ({
            option, count, percentage: Math.round((count / questionAnswers.length) * 100) || 0,
          })),
        }
      }

      if (q.type === 'rating') {
        const avg = questionAnswers.length
          ? (questionAnswers.reduce((s, a) => s + Number(a), 0) / questionAnswers.length).toFixed(1)
          : 0
        const distribution = [1, 2, 3, 4, 5].map(rating => ({
          rating, count: questionAnswers.filter(a => Number(a) === rating).length,
        }))
        return { question: q.questionText, type: q.type, average: avg, distribution }
      }

      // text type
      return {
        question: q.questionText, type: q.type,
        textResponses: questionAnswers,
      }
    })

    res.json({
      survey: { title: survey.title, totalResponses: responses.length },
      results,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMySurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ createdBy: req.user._id }).sort({ createdAt: -1 })
    res.json({ surveys })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const closeSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Not found.' })
    if (survey.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }
    survey.isActive = false
    await survey.save()
    res.json({ message: 'Survey closed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Not found.' })
    if (survey.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }
    await SurveyResponse.deleteMany({ survey: survey._id })
    await survey.deleteOne()
    res.json({ message: 'Survey deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}