import StudyGroup from '../models/StudyGroup.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { createNotification } from './notificationController.js'
import { awardXP } from '../utils/xpEngine.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── CREATE GROUP ─────────────────────────────────────────────────
export const createGroup = async (req, res) => {
  try {
    const {
      name, description, subject,
      branch, year, tags, maxMembers,
      isPrivate, coverColor, meetingLink,
    } = req.body

    // Create linked group conversation
    const conversation = await Conversation.create({
      participants: [req.user._id],
      isGroup: true,
      groupName: name,
      groupAdmin: req.user._id,
    })

    const group = await StudyGroup.create({
      name,
      description,
      subject,
      branch,
      year: year ? Number(year) : undefined,
      tags: tags ? JSON.parse(tags) : [],
      admin: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      maxMembers: maxMembers ? Number(maxMembers) : 50,
      isPrivate: isPrivate === 'true',
      coverColor: coverColor || '#6366f1',
      meetingLink,
      conversation: conversation._id,
    })

    await group.populate('admin', 'name avatar branch year')
    await group.populate('members.user', 'name avatar branch year')

    res.status(201).json({ message: 'Study group created!', group })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET ALL GROUPS ───────────────────────────────────────────────
export const getGroups = async (req, res) => {
  try {
    const { search, branch, year, subject, page = 1, limit = 12 } = req.query
    const filter = {}

    if (search) filter.$text = { $search: search }
    if (branch) filter.branch = branch
    if (year) filter.year = Number(year)
    if (subject) filter.subject = new RegExp(escapeRegex(subject), 'i')

    const skip = (Number(page) - 1) * Number(limit)

    const [groups, total] = await Promise.all([
      StudyGroup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('admin', 'name avatar')
        .populate('members.user', 'name avatar'),
      StudyGroup.countDocuments(filter),
    ])

    res.json({
      groups,
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

// ─── GET MY GROUPS ────────────────────────────────────────────────
export const getMyGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.find({
      'members.user': req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate('admin', 'name avatar')
      .populate('members.user', 'name avatar')

    res.json({ groups })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET SINGLE GROUP ─────────────────────────────────────────────
export const getGroupById = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('admin', 'name avatar branch year')
      .populate('members.user', 'name avatar branch year')
      .populate('joinRequests', 'name avatar branch year')

    if (!group) return res.status(404).json({ message: 'Group not found.' })
    res.json({ group })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── JOIN GROUP ───────────────────────────────────────────────────
export const joinGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found.' })

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    )
    if (isMember) return res.status(400).json({ message: 'Already a member.' })

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full.' })
    }

    if (group.isPrivate) {
      // Add join request
      if (!group.joinRequests.includes(req.user._id)) {
        group.joinRequests.push(req.user._id)
        await group.save()

        // Notify admin
        await createNotification({
          recipient: group.admin,
          type: 'system',
          title: `New join request for ${group.name}`,
          message: `${req.user.name} wants to join your study group`,
          link: `/study-groups/${group._id}`,
          actor: req.user._id,
        })
      }
      await awardXP(req.user._id, 'JOIN_STUDY_GROUP', 'studyGroupsJoined')
      return res.json({ message: 'Join request sent!', requested: true })

    }

    // Public group — join directly
    group.members.push({ user: req.user._id, role: 'member' })

    // Add to conversation
    await Conversation.findByIdAndUpdate(group.conversation, {
      $addToSet: { participants: req.user._id },
    })

    // Send system message
    await Message.create({
      conversation: group.conversation,
      sender: req.user._id,
      content: `${req.user.name} joined the group 🎉`,
      type: 'system',
      readBy: [req.user._id],
    })

    await group.save()

    res.json({ message: 'Joined successfully!', joined: true })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── LEAVE GROUP ──────────────────────────────────────────────────
export const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found.' })

    if (group.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot leave. Transfer ownership or delete group.' })
    }

    group.members = group.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    )

    await Conversation.findByIdAndUpdate(group.conversation, {
      $pull: { participants: req.user._id },
    })

    await Message.create({
      conversation: group.conversation,
      sender: req.user._id,
      content: `${req.user.name} left the group`,
      type: 'system',
      readBy: [req.user._id],
    })

    await group.save()
    res.json({ message: 'Left group successfully.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── APPROVE/REJECT JOIN REQUEST ──────────────────────────────────
export const handleJoinRequest = async (req, res) => {
  try {
    const { userId, action } = req.body
    const group = await StudyGroup.findById(req.params.id)

    if (!group) return res.status(404).json({ message: 'Group not found.' })
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can manage requests.' })
    }

    group.joinRequests = group.joinRequests.filter(
      id => id.toString() !== userId
    )

    if (action === 'approve') {
      group.members.push({ user: userId, role: 'member' })
      await Conversation.findByIdAndUpdate(group.conversation, {
        $addToSet: { participants: userId },
      })
    }

    await group.save()
    res.json({ message: `Request ${action}d!` })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADD RESOURCE ─────────────────────────────────────────────────
export const addResource = async (req, res) => {
  try {
    const { title, url, type } = req.body
    const group = await StudyGroup.findById(req.params.id)

    if (!group) return res.status(404).json({ message: 'Group not found.' })

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    )
    if (!isMember) return res.status(403).json({ message: 'Members only.' })

    group.resources.push({ title, url, type, addedBy: req.user._id })
    await group.save()

    res.json({ message: 'Resource added!', group })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE MEETING ───────────────────────────────────────────────
export const updateMeeting = async (req, res) => {
  try {
    const { meetingLink, nextMeeting } = req.body
    const group = await StudyGroup.findById(req.params.id)

    if (!group) return res.status(404).json({ message: 'Group not found.' })
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Admin only.' })
    }

    group.meetingLink = meetingLink
    group.nextMeeting = nextMeeting
    await group.save()

    // PERFORMANCE FIX (DB-05): see clubController.js's identical fix —
    // sequential per-member awaits replaced with a concurrent Promise.all.
    await Promise.all(
      group.members
        .filter((member) => member.user.toString() !== req.user._id.toString())
        .map((member) => createNotification({
          recipient: member.user,
          type: 'event',
          title: `${group.name} — Meeting scheduled`,
          message: `Next meeting: ${new Date(nextMeeting).toLocaleString()}`,
          link: `/study-groups/${group._id}`,
          actor: req.user._id,
        }))
    )

    res.json({ message: 'Meeting updated!', group })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE GROUP ─────────────────────────────────────────────────
export const deleteGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found.' })

    if (group.admin.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await Conversation.findByIdAndDelete(group.conversation)
    await Message.deleteMany({ conversation: group.conversation })
    await group.deleteOne()

    res.json({ message: 'Group deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET GROUP MESSAGES ───────────────────────────────────────────
export const getGroupMessages = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found.' })

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    )
    if (!isMember) return res.status(403).json({ message: 'Members only.' })

    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [messages, total] = await Promise.all([
      Message.find({ conversation: group.conversation, deleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('sender', 'name avatar branch year')
        .populate('replyTo', 'content sender'),
      Message.countDocuments({ conversation: group.conversation }),
    ])

    res.json({
      messages: messages.reverse(),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + messages.length < total,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}