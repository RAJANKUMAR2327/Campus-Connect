import MentorProfile from '../models/MentorProfile.js'
import MentorshipRequest from '../models/MentorshipRequest.js'
import MentorSession from '../models/MentorSession.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { awardXP } from '../utils/xpEngine.js'
import { createNotification } from './notificationController.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── BECOME A MENTOR ──────────────────────────────────────────────
export const createMentorProfile = async (req, res) => {
  try {
    const { bio, expertise, domains, experience, availability, maxMentees, linkedIn } = req.body

    const existing = await MentorProfile.findOne({ user: req.user._id })
    if (existing) {
      return res.status(400).json({ message: 'You already have a mentor profile.' })
    }

    const profile = await MentorProfile.create({
      user: req.user._id,
      bio,
      expertise: expertise ? JSON.parse(expertise) : [],
      domains: domains ? JSON.parse(domains) : [],
      experience,
      availability,
      maxMentees: maxMentees ? Number(maxMentees) : 5,
      linkedIn,
    })

    await profile.populate('user', 'name avatar branch year college')
    res.status(201).json({ message: 'Mentor profile created!', profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE MENTOR PROFILE ─────────────────────────────────────────
export const updateMentorProfile = async (req, res) => {
  try {
    const { bio, expertise, domains, experience, availability, maxMentees, isActive, linkedIn } = req.body

    const profile = await MentorProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        bio, experience, availability, linkedIn,
        isActive: isActive !== undefined ? isActive : undefined,
        maxMentees: maxMentees ? Number(maxMentees) : undefined,
        expertise: expertise ? JSON.parse(expertise) : undefined,
        domains: domains ? JSON.parse(domains) : undefined,
      },
      { new: true }
    )

    if (!profile) return res.status(404).json({ message: 'Mentor profile not found.' })

    res.json({ message: 'Profile updated!', profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL MENTORS ──────────────────────────────────────────────
export const getMentors = async (req, res) => {
  try {
    const { domain, search, college, page = 1, limit = 12 } = req.query
    const filter = { isActive: true }

    if (domain) filter.domains = domain

    let query = MentorProfile.find(filter)
      .populate({
        path: 'user',
        match: college ? { college: new RegExp(escapeRegex(college), 'i') } : {},
        select: 'name avatar branch year college',
      })
      .sort({ rating: -1, totalSessions: -1 })

    if (search) {
      query = MentorProfile.find({
        ...filter,
        $or: [
          { bio: new RegExp(escapeRegex(search), 'i') },
          { expertise: new RegExp(escapeRegex(search), 'i') },
        ],
      }).populate('user', 'name avatar branch year college').sort({ rating: -1 })
    }

    const skip = (Number(page) - 1) * Number(limit)
    const allMentors = await query
    const mentors = allMentors.filter(m => m.user).slice(skip, skip + Number(limit))
    const total = allMentors.filter(m => m.user).length

    res.json({
      mentors,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY MENTOR PROFILE ────────────────────────────────────────
export const getMyMentorProfile = async (req, res) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.user._id })
      .populate('user', 'name avatar branch year college')
    res.json({ profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MENTOR BY ID ──────────────────────────────────────────────
export const getMentorById = async (req, res) => {
  try {
    const profile = await MentorProfile.findById(req.params.id)
      .populate('user', 'name avatar branch year college')
    if (!profile) return res.status(404).json({ message: 'Mentor not found.' })
    res.json({ profile })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── SEND MENTORSHIP REQUEST ───────────────────────────────────────
export const sendRequest = async (req, res) => {
  try {
    const { mentorId, message, domain } = req.body

    if (mentorId === req.user._id.toString()) {
      return res.status(400).json({ message: "Can't request yourself as mentor." })
    }

    const existing = await MentorshipRequest.findOne({
      mentor: mentorId,
      mentee: req.user._id,
      status: { $in: ['pending', 'accepted'] },
    })
    if (existing) {
      return res.status(400).json({ message: 'Request already exists.' })
    }

    // Check mentor capacity
    const mentorProfile = await MentorProfile.findOne({ user: mentorId })
    const activeMentorships = await MentorshipRequest.countDocuments({
      mentor: mentorId, status: 'accepted',
    })
    if (mentorProfile && activeMentorships >= mentorProfile.maxMentees) {
      return res.status(400).json({ message: 'This mentor has reached their mentee limit.' })
    }

    const request = await MentorshipRequest.create({
      mentor: mentorId,
      mentee: req.user._id,
      message, domain,
    })

    await request.populate('mentee', 'name avatar branch year')

    await createNotification({
      recipient: mentorId,
      type: 'system',
      title: 'New mentorship request',
      message: `${req.user.name} wants you as their mentor`,
      link: '/mentorship/requests',
      actor: req.user._id,
    })

    res.status(201).json({ message: 'Request sent!', request })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── RESPOND TO REQUEST ────────────────────────────────────────────
export const respondToRequest = async (req, res) => {
  try {
    const { action } = req.body // accept | reject
    const request = await MentorshipRequest.findById(req.params.id)

    if (!request) return res.status(404).json({ message: 'Request not found.' })
    if (request.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    if (action === 'accept') {
      const conversation = await Conversation.create({
        participants: [request.mentor, request.mentee],
        isGroup: false,
      })

      request.status = 'accepted'
      request.startedAt = new Date()
      request.conversation = conversation._id

      await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        content: `🎉 Mentorship started! Feel free to ask anything.`,
        type: 'system',
        readBy: [req.user._id],
      })

      await createNotification({
        recipient: request.mentee,
        type: 'system',
        title: 'Mentorship request accepted!',
        message: `${req.user.name} accepted your mentorship request`,
        link: '/mentorship',
        actor: req.user._id,
      })
    } else {
      request.status = 'rejected'
      await createNotification({
        recipient: request.mentee,
        type: 'system',
        title: 'Mentorship request declined',
        message: `Your request was not accepted this time`,
        link: '/mentorship',
        actor: req.user._id,
      })
    }

    await request.save()
    res.json({ message: `Request ${action}ed!`, request })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY REQUESTS (as mentor) ───────────────────────────────────
export const getMentorRequests = async (req, res) => {
  try {
    const { status } = req.query
    const filter = { mentor: req.user._id }
    if (status) filter.status = status

    const requests = await MentorshipRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('mentee', 'name avatar branch year college')

    res.json({ requests })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY REQUESTS (as mentee) ───────────────────────────────────
export const getMenteeRequests = async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({ mentee: req.user._id })
      .sort({ createdAt: -1 })
      .populate('mentor', 'name avatar branch year college')

    res.json({ requests })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY ACTIVE MENTORSHIPS (both roles) ────────────────────────
export const getActiveMentorships = async (req, res) => {
  try {
    const [asMentor, asMentee] = await Promise.all([
      MentorshipRequest.find({ mentor: req.user._id, status: 'accepted' })
        .populate('mentee', 'name avatar branch year college'),
      MentorshipRequest.find({ mentee: req.user._id, status: 'accepted' })
        .populate('mentor', 'name avatar branch year college'),
    ])

    res.json({ asMentor, asMentee })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── END MENTORSHIP ─────────────────────────────────────────────────
export const endMentorship = async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Mentorship not found.' })

    const isParty = [request.mentor.toString(), request.mentee.toString()].includes(req.user._id.toString())
    if (!isParty) return res.status(403).json({ message: 'Not authorized.' })

    request.status = 'ended'
    request.endedAt = new Date()
    await request.save()

    res.json({ message: 'Mentorship ended.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── SCHEDULE SESSION ───────────────────────────────────────────────
export const scheduleSession = async (req, res) => {
  try {
    const { mentorshipRequestId, title, scheduledAt, duration, meetingLink } = req.body

    const request = await MentorshipRequest.findById(mentorshipRequestId)
    if (!request || request.status !== 'accepted') {
      return res.status(400).json({ message: 'Invalid mentorship.' })
    }

    const session = await MentorSession.create({
      mentorshipRequest: mentorshipRequestId,
      mentor: request.mentor,
      mentee: request.mentee,
      title, scheduledAt, duration, meetingLink,
    })

    const recipientId = req.user._id.toString() === request.mentor.toString()
      ? request.mentee : request.mentor

    await createNotification({
      recipient: recipientId,
      type: 'event',
      title: 'Mentorship session scheduled',
      message: `${title} on ${new Date(scheduledAt).toLocaleString()}`,
      link: '/mentorship',
      actor: req.user._id,
    })

    res.status(201).json({ message: 'Session scheduled!', session })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY SESSIONS ─────────────────────────────────────────────────
export const getMySessions = async (req, res) => {
  try {
    const sessions = await MentorSession.find({
      $or: [{ mentor: req.user._id }, { mentee: req.user._id }],
    })
      .sort({ scheduledAt: 1 })
      .populate('mentor', 'name avatar')
      .populate('mentee', 'name avatar')

    res.json({ sessions })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── COMPLETE SESSION + RATE ────────────────────────────────────────
export const completeSession = async (req, res) => {
  try {
    const { rating, review, notes } = req.body
    const session = await MentorSession.findById(req.params.id)
    if (!session) return res.status(404).json({ message: 'Session not found.' })

    session.status = 'completed'
    if (notes) session.notes = notes
    if (rating) session.rating = rating
    if (review) session.review = review
    await session.save()

    // Update mentor rating
    if (rating) {
      const mentorProfile = await MentorProfile.findOne({ user: session.mentor })
      if (mentorProfile) {
        const newTotal = mentorProfile.totalRatings + 1
        const newRating = ((mentorProfile.rating * mentorProfile.totalRatings) + rating) / newTotal
        mentorProfile.rating = newRating
        mentorProfile.totalRatings = newTotal
        mentorProfile.totalSessions += 1
        await mentorProfile.save()
      }
    }
    await awardXP(session.mentee, 'MENTORSHIP_SESSION', 'mentorshipSessions')
await awardXP(session.mentor, 'MENTORSHIP_SESSION', 'mentorshipSessions')

    res.json({ message: 'Session completed!', session })
  } catch (err) {
    sendServerError(res, err)
  }
}