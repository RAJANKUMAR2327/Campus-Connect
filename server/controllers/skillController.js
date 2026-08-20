import Skill from '../models/Skill.js'
import UserSkill from '../models/UserSkill.js'
import SkillQuiz from '../models/SkillQuiz.js'
import DigitalCredential from '../models/DigitalCredential.js'
import { createNotification } from './notificationController.js'
import { awardXP } from '../utils/xpEngine.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── SKILLS CATALOG ────────────────────────────────────────────────
export const getAllSkills = async (req, res) => {
  try {
    const { category, search } = req.query
    const filter = {}
    if (category) filter.category = category
    if (search) filter.name = new RegExp(escapeRegex(search), 'i')

    const skills = await Skill.find(filter).sort({ name: 1 })
    res.json({ skills })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const createSkill = async (req, res) => {
  try {
    const { name, category, icon } = req.body
    const skill = await Skill.create({ name, category, icon })
    res.status(201).json({ skill })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Skill already exists.' })
    sendServerError(res, err)
  }
}

// ─── ADD SKILL TO PROFILE ──────────────────────────────────────────
export const addUserSkill = async (req, res) => {
  try {
    const { skillId, proficiency } = req.body

    const existing = await UserSkill.findOne({ user: req.user._id, skill: skillId })
    if (existing) return res.status(400).json({ message: 'Skill already added.' })

    const userSkill = await UserSkill.create({
      user: req.user._id, skill: skillId, proficiency,
    })

    await userSkill.populate('skill')
    res.status(201).json({ message: 'Skill added!', userSkill })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET USER SKILLS ────────────────────────────────────────────────
export const getUserSkills = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id
    const skills = await UserSkill.find({ user: userId })
      .populate('skill')
      .populate('endorsements.endorser', 'name avatar')
      .sort({ isVerified: -1, 'endorsements.length': -1 })

    res.json({ skills })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ENDORSE A SKILL ────────────────────────────────────────────────
export const endorseSkill = async (req, res) => {
  try {
    const { comment } = req.body
    const userSkill = await UserSkill.findById(req.params.id)
    if (!userSkill) return res.status(404).json({ message: 'Skill not found.' })

    if (userSkill.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Can't endorse your own skill." })
    }

    const alreadyEndorsed = userSkill.endorsements.some(
      e => e.endorser.toString() === req.user._id.toString()
    )
    if (alreadyEndorsed) return res.status(400).json({ message: 'Already endorsed.' })

    userSkill.endorsements.push({ endorser: req.user._id, comment })

    // Auto-verify via peer endorsement after 5 endorsements
    if (userSkill.endorsements.length >= 5 && !userSkill.isVerified) {
      userSkill.isVerified = true
      userSkill.verificationMethod = 'peer-endorsement'
      await issueCredential(userSkill.user, userSkill.skill, 'peer-endorsement', userSkill.proficiency)
    }

    await userSkill.save()

    await createNotification({
      recipient: userSkill.user,
      type: 'system',
      title: 'Skill endorsed!',
      message: `${req.user.name} endorsed your skill`,
      link: '/profile',
      actor: req.user._id,
    })

    res.json({ message: 'Endorsed!', userSkill })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── REMOVE SKILL ────────────────────────────────────────────────────
export const removeUserSkill = async (req, res) => {
  try {
    await UserSkill.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Skill removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── SKILL QUIZ FLOW ────────────────────────────────────────────────
export const getSkillQuiz = async (req, res) => {
  try {
    const quiz = await SkillQuiz.findOne({ skill: req.params.skillId })
    if (!quiz) return res.status(404).json({ message: 'No quiz available for this skill yet.' })

    // Hide correct answers from response
    const sanitized = {
      ...quiz.toObject(),
      questions: quiz.questions.map(q => ({ question: q.question, options: q.options })),
    }
    res.json({ quiz: sanitized, totalQuestions: quiz.questions.length })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const submitSkillQuiz = async (req, res) => {
  try {
    const { skillId, answers } = req.body // answers: ["A","B","C",...]
    const quiz = await SkillQuiz.findOne({ skill: skillId })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })

    let correct = 0
    quiz.questions.forEach((q, i) => {
      if (q.correctAnswer === answers[i]) correct++
    })

    const score = Math.round((correct / quiz.questions.length) * 100)
    const passed = score >= quiz.passingScore

    if (passed) {
      let userSkill = await UserSkill.findOne({ user: req.user._id, skill: skillId })
      if (!userSkill) {
        userSkill = await UserSkill.create({ user: req.user._id, skill: skillId, proficiency: 'intermediate' })
      }
      userSkill.isVerified = true
      userSkill.verificationMethod = 'quiz'
      userSkill.quizScore = score
      await userSkill.save()

      await issueCredential(req.user._id, skillId, 'quiz', userSkill.proficiency, score)
      await awardXP(req.user._id, 'COMPLETE_QUIZ', 'quizzesCompleted')
    }

    res.json({ score, passed, correct, total: quiz.questions.length, passingScore: quiz.passingScore })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPLOAD CERTIFICATE FOR VERIFICATION ────────────────────────────
export const uploadCertificate = async (req, res) => {
  try {
    const { skillId, proficiency } = req.body
    if (!req.file) return res.status(400).json({ message: 'Please upload a certificate.' })

    let userSkill = await UserSkill.findOne({ user: req.user._id, skill: skillId })
    if (!userSkill) {
      userSkill = await UserSkill.create({ user: req.user._id, skill: skillId, proficiency })
    }

    userSkill.certificateUrl = req.file.path
    userSkill.verificationMethod = 'certificate-upload'
    // Requires admin approval before isVerified = true
    await userSkill.save()

    res.json({ message: 'Certificate uploaded! Pending admin verification.', userSkill })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADMIN: APPROVE CERTIFICATE ─────────────────────────────────────
export const approveCertificate = async (req, res) => {
  try {
    const userSkill = await UserSkill.findById(req.params.id)
    if (!userSkill) return res.status(404).json({ message: 'Not found.' })

    userSkill.isVerified = true
    await userSkill.save()

    await issueCredential(userSkill.user, userSkill.skill, 'certificate-upload', userSkill.proficiency)

    await createNotification({
      recipient: userSkill.user,
      type: 'system',
      title: 'Skill verified!',
      message: 'Your certificate was approved. You earned a digital credential!',
      link: '/profile',
    })

    res.json({ message: 'Approved!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getPendingCertificates = async (req, res) => {
  try {
    const pending = await UserSkill.find({
      verificationMethod: 'certificate-upload',
      isVerified: false,
      certificateUrl: { $exists: true },
    }).populate('user', 'name avatar').populate('skill', 'name')
    res.json({ pending })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DIGITAL CREDENTIALS (shareable) ────────────────────────────────
async function issueCredential(userId, skillId, method, proficiency, score = null) {
  const existing = await DigitalCredential.findOne({ user: userId, skill: skillId })
  if (existing) return existing

  return DigitalCredential.create({
    user: userId, skill: skillId,
    verificationMethod: method, proficiency, score,
  })
}

export const getMyCredentials = async (req, res) => {
  try {
    const credentials = await DigitalCredential.find({ user: req.user._id })
      .populate('skill')
      .sort({ issuedAt: -1 })
    res.json({ credentials })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getCredentialByCode = async (req, res) => {
  try {
    const credential = await DigitalCredential.findOne({ verificationCode: req.params.code })
      .populate('skill')
      .populate('user', 'name avatar branch year college')

    if (!credential) return res.status(404).json({ message: 'Invalid verification code.' })

    credential.viewCount += 1
    await credential.save()

    res.json({ credential })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const toggleCredentialVisibility = async (req, res) => {
  try {
    const credential = await DigitalCredential.findOne({ _id: req.params.id, user: req.user._id })
    if (!credential) return res.status(404).json({ message: 'Not found.' })
    credential.isPublic = !credential.isPublic
    await credential.save()
    res.json({ isPublic: credential.isPublic })
  } catch (err) {
    sendServerError(res, err)
  }
}