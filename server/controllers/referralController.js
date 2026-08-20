import Referral from '../models/Referral.js'
import ReferralRequest from '../models/ReferralRequest.js'
import { createNotification } from './notificationController.js'
import { awardXP } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createReferral = async (req, res) => {
  try {
    const { company, role, jobUrl, location, workMode, type, package: pkg, description, eligibility, deadline, maxReferrals, tags } = req.body

    const referral = await Referral.create({
      referrer: req.user._id, company, role, jobUrl, location, workMode, type,
      package: pkg, description, eligibility, deadline,
      maxReferrals: maxReferrals ? Number(maxReferrals) : 5,
      tags: tags ? JSON.parse(tags) : [],
    })

    await awardXP(req.user._id, 'CREATE_EVENT') // reuse XP value bucket
    await referral.populate('referrer', 'name avatar branch year college')

    res.status(201).json({ message: 'Referral posted!', referral })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getReferrals = async (req, res) => {
  try {
    const { search, type, workMode, page = 1, limit = 12 } = req.query
    const filter = { isActive: true }
    if (search) filter.$text = { $search: search }
    if (type) filter.type = type
    if (workMode) filter.workMode = workMode

    const skip = (Number(page) - 1) * Number(limit)
    const [referrals, total] = await Promise.all([
      Referral.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('referrer', 'name avatar branch year college'),
      Referral.countDocuments(filter),
    ])

    res.json({ referrals, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id }).sort({ createdAt: -1 })
    res.json({ referrals })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const requestReferral = async (req, res) => {
  try {
    const { message } = req.body
    const referral = await Referral.findById(req.params.id)
    if (!referral) return res.status(404).json({ message: 'Referral not found.' })

    if (referral.referrer.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Can't request your own referral." })
    }
    if (referral.referralCount >= referral.maxReferrals) {
      return res.status(400).json({ message: 'Maximum referrals reached for this post.' })
    }

    const request = await ReferralRequest.create({
      referral: referral._id, applicant: req.user._id, message,
    })

    await request.populate('applicant', 'name avatar branch year college')

    await createNotification({
      recipient: referral.referrer,
      type: 'placement',
      title: 'New referral request',
      message: `${req.user.name} requested a referral for ${referral.role} at ${referral.company}`,
      link: '/referrals/my-posts',
      actor: req.user._id,
    })

    res.status(201).json({ message: 'Request sent!', request })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Already requested this referral.' })
    sendServerError(res, err)
  }
}

export const getRequestsForMyReferrals = async (req, res) => {
  try {
    const myReferrals = await Referral.find({ referrer: req.user._id }).select('_id')
    const requests = await ReferralRequest.find({ referral: { $in: myReferrals.map(r => r._id) } })
      .sort({ createdAt: -1 })
      .populate('applicant', 'name avatar branch year college')
      .populate('referral', 'company role')

    res.json({ requests })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const respondToRequest = async (req, res) => {
  try {
    const { action, notes } = req.body
    const request = await ReferralRequest.findById(req.params.id).populate('referral')

    if (!request) return res.status(404).json({ message: 'Not found.' })
    if (request.referral.referrer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    request.status = action
    request.referrerNotes = notes
    await request.save()

    if (action === 'referred') {
      await Referral.findByIdAndUpdate(request.referral._id, { $inc: { referralCount: 1 } })
    }

    await createNotification({
      recipient: request.applicant,
      type: 'placement',
      title: action === 'referred' ? '🎉 You got referred!' : 'Referral update',
      message: `${req.user.name} ${action} your referral request for ${request.referral.role}`,
      link: '/referrals/my-requests',
      actor: req.user._id,
    })

    res.json({ message: `Request ${action}!` })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyRequests = async (req, res) => {
  try {
    const requests = await ReferralRequest.find({ applicant: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'referral', populate: { path: 'referrer', select: 'name avatar' } })

    res.json({ requests })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
    if (!referral) return res.status(404).json({ message: 'Not found.' })
    if (referral.referrer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }
    await ReferralRequest.deleteMany({ referral: referral._id })
    await referral.deleteOne()
    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}