import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── GET ALL CONVERSATIONS ────────────────────────────────────────
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name avatar branch year')
      .populate('lastMessage', 'content type createdAt sender')

    res.json({ conversations })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET OR CREATE CONVERSATION ───────────────────────────────────
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params
    const myId = req.user._id

    if (userId === myId.toString()) {
      return res.status(400).json({ message: "Can't message yourself." })
    }

    // NEW: respect blocking (either direction) and the recipient's
    // "who can message me" privacy setting before opening a DM.
    const otherUser = await User.findById(userId).select('privacy blockedUsers isDeactivated')
    if (!otherUser || otherUser.isDeactivated) {
      return res.status(404).json({ message: 'User not found.' })
    }
    if (req.user.hasBlocked(userId) || otherUser.hasBlocked(myId)) {
      return res.status(403).json({ message: 'Unable to start this conversation.' })
    }
    if (otherUser.privacy?.whoCanMessage === 'nobody') {
      return res.status(403).json({ message: 'This user is not accepting messages.' })
    }
    if (
      otherUser.privacy?.whoCanMessage === 'college' &&
      otherUser.college &&
      otherUser.college !== req.user.college
    ) {
      return res.status(403).json({ message: 'This user only accepts messages from their own college.' })
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [myId, userId] },
      isGroup: false,
    })
      .populate('participants', 'name avatar branch year college')
      .populate('lastMessage', 'content type createdAt sender')

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, userId],
        isGroup: false,
      })
      await conversation.populate('participants', 'name avatar branch year college')
    }

    res.json({ conversation })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET OR CREATE THE CAMPUS-WIDE CHAT ROOM ──────────────────────
// A single, shared conversation every logged-in user can read and post in.
export const getOrCreateCampusChat = async (req, res) => {
  try {
    let conversation = await Conversation.findOne({ isPublic: true })

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id], // required by schema; not used for access control here
        isGroup: true,
        isPublic: true,
        groupName: 'Campus Chat',
      })
    }

    res.json({ conversation })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MESSAGES ─────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // Verify participant (public rooms are open to any logged-in user)
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' })
    }
    if (!conversation.isPublic && !conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId, deleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('sender', 'name avatar branch year')
        .populate('replyTo', 'content sender'),
      Message.countDocuments({ conversation: conversationId, deleted: false }),
    ])

    // Mark as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    )

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${req.user._id}`]: 0,
    })

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

// ─── SEND MESSAGE (REST fallback) ─────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, replyTo } = req.body

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' })
    }
    if (!conversation.isPublic && !conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    const image = req.file ? req.file.path : null

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
      type: image ? 'image' : 'text',
      image,
      replyTo: replyTo || undefined,
      readBy: [req.user._id],
    })

    await message.populate('sender', 'name avatar branch year')
    if (replyTo) await message.populate('replyTo', 'content sender')

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    })

    // Increment unread for other participants (not applicable to the public campus room)
    if (!conversation.isPublic) {
      conversation.participants
        .filter(p => p.toString() !== req.user._id.toString())
        .forEach(async (participantId) => {
          await Conversation.findByIdAndUpdate(conversationId, {
            $inc: { [`unreadCount.${participantId}`]: 1 },
          })
        })
    }

    res.status(201).json({ message })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE MESSAGE ───────────────────────────────────────────────
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
    if (!message) return res.status(404).json({ message: 'Message not found.' })

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    message.deleted = true
    message.content = 'This message was deleted'
    await message.save()

    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── SEARCH USERS TO CHAT ─────────────────────────────────────────
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) return res.json({ users: [] })

    // NEW: never surface users the current user has blocked, who have
    // blocked the current user, or who have deactivated their account.
    const users = await User.find({
      _id: { $ne: req.user._id, $nin: req.user.blockedUsers },
      blockedUsers: { $ne: req.user._id },
      isDeactivated: { $ne: true },
      $or: [
        { name: new RegExp(escapeRegex(q), 'i') },
        { branch: new RegExp(escapeRegex(q), 'i') },
        { college: new RegExp(escapeRegex(q), 'i') },
      ],
    })
      .select('name avatar branch year college')
      .limit(10)

    res.json({ users })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET UNREAD COUNT ─────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })

    let total = 0
    conversations.forEach(conv => {
      total += conv.unreadCount?.get(req.user._id.toString()) || 0
    })

    res.json({ unreadCount: total })
  } catch (err) {
    sendServerError(res, err)
  }
}