import Club from '../models/Club.js'
import ClubEvent from '../models/ClubEvent.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { createNotification } from './notificationController.js'
import { awardXP } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── CREATE CLUB ──────────────────────────────────────────────────
export const createClub = async (req, res) => {
  try {
    const {
      name, tagline, description, category,
      founded, coverColor, socialLinks,
      isRecruiting, recruitmentForm, recruitmentDeadline,
    } = req.body

    const conversation = await Conversation.create({
      participants: [req.user._id],
      isGroup: true,
      groupName: name,
      groupAdmin: req.user._id,
    })

    const logo = req.files?.logo ? req.files.logo[0].path : ''
    const coverImage = req.files?.cover ? req.files.cover[0].path : ''

    const club = await Club.create({
      name, tagline, description, category,
      founded: founded ? Number(founded) : undefined,
      coverColor: coverColor || '#6366f1',
      logo, coverImage,
      college: req.user.college,
      president: req.user._id,
      members: [{ user: req.user._id }],
      coreTeam: [{ user: req.user._id, position: 'President' }],
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
      isRecruiting: isRecruiting === 'true',
      recruitmentForm,
      recruitmentDeadline,
      conversation: conversation._id,
    })

    await club.populate('president', 'name avatar')
    await club.populate('members.user', 'name avatar branch year')
    await club.populate('coreTeam.user', 'name avatar branch year')

    res.status(201).json({ message: 'Club created!', club })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL CLUBS ────────────────────────────────────────────────
export const getClubs = async (req, res) => {
  try {
    const { search, category, college, page = 1, limit = 12 } = req.query
    const filter = { isActive: true }

    if (search) filter.$text = { $search: search }
    if (category) filter.category = category
    if (college) filter.college = college

    const skip = (Number(page) - 1) * Number(limit)

    const [clubs, total] = await Promise.all([
      Club.find(filter)
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('president', 'name avatar')
        .populate('members.user', 'name avatar'),
      Club.countDocuments(filter),
    ])

    res.json({
      clubs,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY CLUBS ─────────────────────────────────────────────────
export const getMyClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ 'members.user': req.user._id })
      .sort({ updatedAt: -1 })
      .populate('president', 'name avatar')
      .populate('members.user', 'name avatar')

    res.json({ clubs })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SINGLE CLUB ──────────────────────────────────────────────
export const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('president', 'name avatar branch year')
      .populate('members.user', 'name avatar branch year')
      .populate('coreTeam.user', 'name avatar branch year')

    if (!club) return res.status(404).json({ message: 'Club not found.' })

    const events = await ClubEvent.find({ club: club._id })
      .sort({ date: 1 })
      .limit(5)

    res.json({ club, events })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── JOIN CLUB ────────────────────────────────────────────────────
export const joinClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
    if (!club) return res.status(404).json({ message: 'Club not found.' })

    const isMember = club.members.some(
      m => m.user.toString() === req.user._id.toString()
    )
    if (isMember) return res.status(400).json({ message: 'Already a member.' })

    club.members.push({ user: req.user._id })
    await awardXP(req.user._id, 'JOIN_CLUB', 'clubsJoined')

    await Conversation.findByIdAndUpdate(club.conversation, {
      $addToSet: { participants: req.user._id },
    })

    await Message.create({
      conversation: club.conversation,
      sender: req.user._id,
      content: `${req.user.name} joined the club! 🎉`,
      type: 'system',
      readBy: [req.user._id],
    })

    await club.save()

    await createNotification({
      recipient: club.president,
      type: 'system',
      title: `New member in ${club.name}`,
      message: `${req.user.name} joined your club`,
      link: `/clubs/${club._id}`,
      actor: req.user._id,
    })

    res.json({ message: 'Joined the club!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── LEAVE CLUB ───────────────────────────────────────────────────
export const leaveClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
    if (!club) return res.status(404).json({ message: 'Club not found.' })

    if (club.president.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'President cannot leave. Transfer leadership first.' })
    }

    club.members = club.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    )
    club.coreTeam = club.coreTeam.filter(
      m => m.user.toString() !== req.user._id.toString()
    )

    await Conversation.findByIdAndUpdate(club.conversation, {
      $pull: { participants: req.user._id },
    })

    await club.save()
    res.json({ message: 'Left the club.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADD CORE TEAM MEMBER ─────────────────────────────────────────
export const addCoreMember = async (req, res) => {
  try {
    const { userId, position } = req.body
    const club = await Club.findById(req.params.id)

    if (!club) return res.status(404).json({ message: 'Club not found.' })
    if (club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only president can manage core team.' })
    }

    const isMember = club.members.some(m => m.user.toString() === userId)
    if (!isMember) return res.status(400).json({ message: 'User must be a member first.' })

    const exists = club.coreTeam.find(m => m.user.toString() === userId)
    if (exists) {
      exists.position = position
    } else {
      club.coreTeam.push({ user: userId, position })
    }

    await club.save()
    await club.populate('coreTeam.user', 'name avatar branch year')

    res.json({ message: 'Core team updated!', club })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE RECRUITMENT ───────────────────────────────────────────
export const updateRecruitment = async (req, res) => {
  try {
    const { isRecruiting, recruitmentForm, recruitmentDeadline } = req.body
    const club = await Club.findById(req.params.id)

    if (!club) return res.status(404).json({ message: 'Club not found.' })
    if (club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    club.isRecruiting = isRecruiting
    club.recruitmentForm = recruitmentForm
    club.recruitmentDeadline = recruitmentDeadline
    await club.save()

    res.json({ message: 'Recruitment updated!', club })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADD ACHIEVEMENT ──────────────────────────────────────────────
export const addAchievement = async (req, res) => {
  try {
    const { achievement } = req.body
    const club = await Club.findById(req.params.id)

    if (!club) return res.status(404).json({ message: 'Club not found.' })
    if (club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    club.achievements.push(achievement)
    await club.save()

    res.json({ message: 'Achievement added!', club })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE CLUB ──────────────────────────────────────────────────
export const deleteClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
    if (!club) return res.status(404).json({ message: 'Club not found.' })

    if (club.president.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await Conversation.findByIdAndDelete(club.conversation)
    await Message.deleteMany({ conversation: club.conversation })
    await ClubEvent.deleteMany({ club: club._id })
    await club.deleteOne()

    res.json({ message: 'Club deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── CREATE CLUB EVENT ─────────────────────────────────────────────
export const createClubEvent = async (req, res) => {
  try {
    const { title, description, date, venue, registrationLink } = req.body
    const club = await Club.findById(req.params.id)

    if (!club) return res.status(404).json({ message: 'Club not found.' })

    const isCore = club.coreTeam.some(m => m.user.toString() === req.user._id.toString())
    if (!isCore && club.president.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only core team can create events.' })
    }

    const banner = req.file ? req.file.path : undefined

    const event = await ClubEvent.create({
      club: club._id, title, description, date, venue, banner, registrationLink,
    })

    // PERFORMANCE FIX (DB-05): this used to be a sequential
    // `for...of` loop with `await createNotification(...)` on every
    // iteration — one full DB round-trip (plus a push-notification
    // network call) per member, serially, before the response could
    // return. A club with 200 members turned event creation into 200
    // sequential round-trips. Promise.all runs them concurrently instead;
    // createNotification already catches and logs its own errors (see
    // notificationController.js), so one recipient failing still doesn't
    // block or fail the others.
    await Promise.all(
      club.members
        .filter((member) => member.user.toString() !== req.user._id.toString())
        .map((member) => createNotification({
          recipient: member.user,
          type: 'event',
          title: `${club.name} — New Event!`,
          message: title,
          link: `/clubs/${club._id}`,
          actor: req.user._id,
        }))
    )

    res.status(201).json({ message: 'Event created!', event })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET CLUB MESSAGES ─────────────────────────────────────────────
export const getClubMessages = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
    if (!club) return res.status(404).json({ message: 'Club not found.' })

    const isMember = club.members.some(m => m.user.toString() === req.user._id.toString())
    if (!isMember) return res.status(403).json({ message: 'Members only.' })

    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [messages, total] = await Promise.all([
      Message.find({ conversation: club.conversation, deleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('sender', 'name avatar branch year'),
      Message.countDocuments({ conversation: club.conversation }),
    ])

    res.json({
      messages: messages.reverse(),
      pagination: { total, page: Number(page), hasMore: skip + messages.length < total },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}