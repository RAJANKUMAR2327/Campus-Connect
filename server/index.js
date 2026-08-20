import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dns from 'node:dns'

// Some ISP/router DNS servers (common in India) can't resolve the SRV records
// that mongodb+srv:// connection strings require, even though they handle
// ordinary DNS lookups fine. Forcing Node to use Google's DNS here fixes that
// without requiring any Windows system-level network configuration changes.
dns.setServers(['8.8.8.8', '8.8.4.4'])

import { seedBadges } from './seeds/seedBadges.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import StudyGroup from './models/StudyGroup.js'
import cron from 'node-cron'
import CalendarEvent from './models/CalendarEvent.js'
import { createNotification } from './controllers/notificationController.js'
import { seedSkills } from './seeds/seedSkills.js'
import CallSession from './models/CallSession.js'
import DigestPreference from './models/DigestPreference.js'
import UserStats from './models/UserStats.js'
import User from './models/User.js'
import { buildDigestData } from './utils/digestBuilder.js'
import { buildDigestHTML } from './utils/digestEmailTemplate.js'
import { sendDigestEmail } from './utils/email.js'

dotenv.config()

// The Express app itself (all middleware + every route) now lives in
// app.js so it can be imported by tests without booting a real DB
// connection, cron jobs, or Socket.IO. See app.js for why.
import app, { corsOriginCheck } from './app.js'

import Message from './models/Message.js'
import Conversation from './models/Conversation.js'
import Whiteboard from './models/Whiteboard.js'
import CollabDoc from './models/CollabDoc.js'
import Club from './models/Club.js'
import {
  canAccessConversation,
  getCollabDocForAuth, canEditCollabDoc, canViewCollabDoc,
  getWhiteboardForAuth, canEditWhiteboard,
} from './utils/resourceAuth.js'


const httpServer = createServer(app)

// ─── SOCKET.IO SETUP ──────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginCheck,
    credentials: true,
  },
  pingTimeout: 60000,
})

// Store online users: userId -> socketId
const onlineUsers = new Map()

// Socket.io auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // NOTE: select() must include isDeleted/isDeactivated for the checks
    // below to work — this was the exact shape of bug this handshake
    // already had for isDeactivated (see the security audit's AUTH-02
    // finding): the field being checked has to actually be selected, or
    // it's silently undefined and the check is a no-op.
    //
    // SECURITY FIX (AUTH-02): middleware/auth.js's `protect` documents
    // itself as "the single enforcement point for every one of the 43+
    // route groups" for deactivation — but Socket.IO isn't a route group,
    // and this handshake never checked isDeactivated at all. A deactivated
    // account's still-valid JWT kept working for chat, whiteboards, and
    // collab docs even though the same token was rejected everywhere else.
    const user = await User.findById(decoded.id).select('name avatar blockedUsers isDeleted isDeactivated')
    if (!user || user.isDeleted || user.isDeactivated) return next(new Error('User not found'))
    socket.user = user
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.name}`)

  // Register user as online
  onlineUsers.set(socket.user._id.toString(), socket.id)

  // Broadcast online status
  socket.broadcast.emit('user_online', { userId: socket.user._id })

  // Get online users
  socket.on('get_online_users', () => {
    socket.emit('online_users', Array.from(onlineUsers.keys()))
  })

  // Join conversation room
  // SECURITY FIX: previously joined the room with zero membership check —
  // any authenticated socket could join any conversation's room just by
  // guessing/knowing its ID and receive its real-time messages.
  socket.on('join_conversation', async (conversationId) => {
    const allowed = await canAccessConversation(socket.user._id, conversationId)
    if (!allowed) return
    socket.join(`conv_${conversationId}`)
    console.log(`${socket.user.name} joined conv_${conversationId}`)
  })

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv_${conversationId}`)
  })

const boardEditors = new Map() // boardId -> Map(socketId -> {userId, name, color, cursorX, cursorY})
const cursorColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444']

// SECURITY FIX: previously joined the room and started tracking this user
// as an active editor with zero check that they're actually the owner, a
// collaborator, or that the board is public. Also gates the live
// 'drawing_stroke' broadcasts below, since those only reach sockets that
// are in the room — fixing the join is what actually protects that feed.
socket.on('join_whiteboard', async ({ boardId }) => {
  const board = await getWhiteboardForAuth(boardId)
  if (!canEditWhiteboard(board, socket.user._id)) return

  socket.join(`board_${boardId}`)
  if (!boardEditors.has(boardId)) boardEditors.set(boardId, new Map())
  const editors = boardEditors.get(boardId)
  const color = cursorColors[editors.size % cursorColors.length]
  editors.set(socket.id, { userId: socket.user._id.toString(), name: socket.user.name, color, cursorX: 0, cursorY: 0 })
  io.to(`board_${boardId}`).emit('board_editors', Array.from(editors.values()))
})

socket.on('leave_whiteboard', ({ boardId }) => {
  socket.leave(`board_${boardId}`)
  const editors = boardEditors.get(boardId)
  if (editors) {
    editors.delete(socket.id)
    io.to(`board_${boardId}`).emit('board_editors', Array.from(editors.values()))
  }
})

// Live stroke drawing (broadcast as user draws, before commit). Not
// independently authorization-checked — this only reaches sockets already
// in the room, which join_whiteboard above now gates.
socket.on('drawing_stroke', ({ boardId, stroke }) => {
  socket.to(`board_${boardId}`).emit('stroke_drawing', stroke)
})

// Commit a finished stroke (saved to DB)
// SECURITY FIX: previously ANY authenticated socket could write a stroke to
// ANY whiteboard by ID, whether or not they'd ever joined its room.
socket.on('stroke_complete', async ({ boardId, stroke }) => {
  try {
    const board = await getWhiteboardForAuth(boardId)
    if (!canEditWhiteboard(board, socket.user._id)) return

    const fullStroke = { ...stroke, createdBy: socket.user._id }
    await Whiteboard.findByIdAndUpdate(boardId, {
      $push: { strokes: fullStroke },
      lastEditedBy: socket.user._id,
    })
    io.to(`board_${boardId}`).emit('stroke_committed', fullStroke)
  } catch (err) {
    console.error('stroke_complete error:', err.message)
  }
})

// Undo last stroke
// SECURITY FIX: same missing-authorization issue as stroke_complete.
socket.on('undo_stroke', async ({ boardId }) => {
  try {
    const board = await Whiteboard.findById(boardId)
    if (!canEditWhiteboard(board, socket.user._id)) return
    if (board && board.strokes.length > 0) {
      board.strokes.pop()
      await board.save()
      io.to(`board_${boardId}`).emit('board_undo')
    }
  } catch {}
})

// Clear board
// SECURITY FIX: same missing-authorization issue — previously any
// authenticated user could wipe any whiteboard's contents by ID.

socket.on('clear_board', async ({ boardId }) => {
  try {
    const board = await getWhiteboardForAuth(boardId)
    if (!canEditWhiteboard(board, socket.user._id)) return
    await Whiteboard.findByIdAndUpdate(boardId, { strokes: [] })
    io.to(`board_${boardId}`).emit('board_cleared')
  } catch {}
})

// Cursor position broadcast
socket.on('whiteboard_cursor', ({ boardId, x, y }) => {
  const editors = boardEditors.get(boardId)
  if (editors?.has(socket.id)) {
    editors.get(socket.id).cursorX = x
    editors.get(socket.id).cursorY = y
  }
  socket.to(`board_${boardId}`).emit('peer_cursor', {
    userId: socket.user._id, name: socket.user.name, x, y,
    color: editors?.get(socket.id)?.color,
  })
})

// Clean up on disconnect
boardEditors.forEach((editors, boardId) => {
  if (editors.has(socket.id)) {
    editors.delete(socket.id)
    io.to(`board_${boardId}`).emit('board_editors', Array.from(editors.values()))
  }
})
  
// ─── VIDEO CALL SIGNALING ──────────────────────────────────────────

// Initiate a call — ring the other user(s)
socket.on('call_initiate', async ({ roomId, targetUserIds, callType }) => {
  try {
    for (const targetId of targetUserIds) {
      // SECURITY/PRIVACY FIX (PRIV-01): check blocking in both directions
      // before ringing — mirrors callController.createCallRoom's REST-side
      // fix for the same gap. socket.user.blockedUsers is already loaded
      // from the handshake; the target's list needs a fresh lookup since
      // there's no live document for them in this scope. A blocked target
      // is treated the same as "not currently online" — silently skipped,
      // same "don't confirm a block exists" policy used elsewhere in this
      // codebase (e.g. a blocked profile 404s rather than 403ing with a
      // message that reveals why).
      const target = await User.findById(targetId).select('blockedUsers')
      if (!target) continue
      const iBlockedThem = socket.user.blockedUsers.some((id) => id.toString() === targetId.toString())
      const theyBlockedMe = target.blockedUsers.some((id) => id.toString() === socket.user._id.toString())
      if (iBlockedThem || theyBlockedMe) continue

      const targetSocketId = onlineUsers.get(targetId.toString())
      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming_call', {
          roomId,
          callType, // 'video' | 'audio'
          caller: { id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
        })
      }
    }
  } catch (err) {
    console.error('call_initiate error:', err.message)
  }
})

// Accept call
socket.on('call_accept', ({ roomId, callerId }) => {
  const callerSocketId = onlineUsers.get(callerId.toString())
  if (callerSocketId) {
    io.to(callerSocketId).emit('call_accepted', { roomId, acceptedBy: socket.user._id })
  }
  socket.join(`call_${roomId}`)
})

// Reject call
socket.on('call_reject', ({ roomId, callerId }) => {
  const callerSocketId = onlineUsers.get(callerId.toString())
  if (callerSocketId) {
    io.to(callerSocketId).emit('call_rejected', { roomId, rejectedBy: socket.user._id })
  }
})

// Join the actual call room (both parties after accept)
socket.on('join_call_room', async ({ roomId }) => {
  socket.join(`call_${roomId}`)

  await CallSession.findOneAndUpdate(
    { roomId },
    {
      status: 'active',
      startedAt: new Date(),
      $push: { 'participants.$[elem].joinedAt': new Date() },
    },
    { arrayFilters: [{ 'elem.user': socket.user._id }] }
  ).catch(() => {})

  // Notify others in room that this user joined
  socket.to(`call_${roomId}`).emit('user_joined_call', {
    userId: socket.user._id, name: socket.user.name, avatar: socket.user.avatar,
  })
})

// WebRTC signaling: offer
socket.on('webrtc_offer', ({ roomId, offer, targetUserId }) => {
  const targetSocketId = onlineUsers.get(targetUserId.toString())
  if (targetSocketId) {
    io.to(targetSocketId).emit('webrtc_offer', {
      offer, roomId, fromUserId: socket.user._id,
    })
  }
})

// WebRTC signaling: answer
socket.on('webrtc_answer', ({ roomId, answer, targetUserId }) => {
  const targetSocketId = onlineUsers.get(targetUserId.toString())
  if (targetSocketId) {
    io.to(targetSocketId).emit('webrtc_answer', {
      answer, roomId, fromUserId: socket.user._id,
    })
  }
})

// WebRTC signaling: ICE candidates
socket.on('webrtc_ice_candidate', ({ roomId, candidate, targetUserId }) => {
  const targetSocketId = onlineUsers.get(targetUserId.toString())
  if (targetSocketId) {
    io.to(targetSocketId).emit('webrtc_ice_candidate', {
      candidate, roomId, fromUserId: socket.user._id,
    })
  }
})

// Toggle mute/camera state broadcast
socket.on('call_media_toggle', ({ roomId, type, enabled }) => {
  socket.to(`call_${roomId}`).emit('peer_media_toggle', {
    userId: socket.user._id, type, enabled,
  })
})

// Screen share signaling
socket.on('screen_share_start', ({ roomId }) => {
  socket.to(`call_${roomId}`).emit('peer_screen_share_start', { userId: socket.user._id })
})
socket.on('screen_share_stop', ({ roomId }) => {
  socket.to(`call_${roomId}`).emit('peer_screen_share_stop', { userId: socket.user._id })
})

// Leave call
socket.on('leave_call', async ({ roomId }) => {
  socket.leave(`call_${roomId}`)
  socket.to(`call_${roomId}`).emit('user_left_call', { userId: socket.user._id })

  try {
    const call = await CallSession.findOne({ roomId })
    if (call && call.status === 'active') {
      const remainingInRoom = io.sockets.adapter.rooms.get(`call_${roomId}`)
      if (!remainingInRoom || remainingInRoom.size === 0) {
        call.status = 'ended'
        call.endedAt = new Date()
        call.duration = call.startedAt ? Math.round((call.endedAt - call.startedAt) / 1000) : 0
        await call.save()
      }
    }
  } catch {}
})
  // Send message via socket
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, replyTo } = data

      // Verify conversation participant (the public campus room is open to everyone)
      const conversation = await Conversation.findById(conversationId)
      if (!conversation) return
      if (!conversation.isPublic && !conversation.participants.some(p => p.toString() === socket.user._id.toString())) {
        return
      }

      // NEW: block enforcement for 1:1 DMs. A conversation can already exist
      // from before either user blocked the other, so this is re-checked on
      // every send, not just at conversation-creation time. Group chats
      // (clubs/study groups) intentionally aren't affected — leaving a group
      // is the correct way to stop seeing those messages.
      if (!conversation.isPublic && !conversation.isGroup) {
        const otherParticipantId = conversation.participants.find(
          (p) => p.toString() !== socket.user._id.toString()
        )
        if (otherParticipantId) {
          const otherUser = await User.findById(otherParticipantId).select('blockedUsers')
          const iBlockedThem = socket.user.blockedUsers?.some((id) => id.toString() === otherParticipantId.toString())
          const theyBlockedMe = otherUser?.blockedUsers?.some((id) => id.toString() === socket.user._id.toString())
          if (iBlockedThem || theyBlockedMe) {
            return socket.emit('message_error', { message: 'Unable to send message.' })
          }
        }
      }

      // Create message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.user._id,
        content,
        type: 'text',
        replyTo: replyTo || undefined,
        readBy: [socket.user._id],
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
        const otherParticipants = conversation.participants
          .filter(p => p.toString() !== socket.user._id.toString())

        for (const participantId of otherParticipants) {
          await Conversation.findByIdAndUpdate(conversationId, {
            $inc: { [`unreadCount.${participantId}`]: 1 },
          })

          // Send real-time notification to other participant
          const recipientSocketId = onlineUsers.get(participantId.toString())
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_message', {
              message,
              conversationId,
            })
            io.to(recipientSocketId).emit('conversation_updated', {
              conversationId,
              lastMessage: message,
            })
          }
        }
      }

      // Send to all in conversation room
      io.to(`conv_${conversationId}`).emit('message_received', message)

    } catch (err) {
      socket.emit('message_error', { message: err.message })
    }
  })

  // Typing indicator
  // SECURITY FIX: previously broadcast to the room with no check that the
  // sender is actually a participant — Socket.IO's socket.to(room) doesn't
  // require the emitting socket to be a room member, so anyone who merely
  // guessed a conversationId could spam fake typing indicators to its real
  // participants. Not a data leak, but not correct either.
  socket.on('typing_start', async ({ conversationId }) => {
    if (!(await canAccessConversation(socket.user._id, conversationId))) return
    socket.to(`conv_${conversationId}`).emit('user_typing', {
      userId: socket.user._id,
      userName: socket.user.name,
      conversationId,
    })
  })

  socket.on('typing_stop', async ({ conversationId }) => {
    if (!(await canAccessConversation(socket.user._id, conversationId))) return
    socket.to(`conv_${conversationId}`).emit('user_stop_typing', {
      userId: socket.user._id,
      conversationId,
    })
  })

  // Message read
  // SECURITY FIX: previously marked messages read / reset the unread
  // counter for ANY conversationId with no membership check.
  socket.on('message_read', async ({ conversationId }) => {
    try {
      if (!(await canAccessConversation(socket.user._id, conversationId))) return
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          readBy: { $ne: socket.user._id },
        },
        { $addToSet: { readBy: socket.user._id } }
      )
      await Conversation.findByIdAndUpdate(conversationId, {
        [`unreadCount.${socket.user._id}`]: 0,
      })
      socket.to(`conv_${conversationId}`).emit('messages_read', {
        userId: socket.user._id,
        conversationId,
      })
    } catch {}
  })

  // React to message
  // SECURITY FIX: previously reacted to ANY message by ID with no check
  // that (a) the caller belongs to the conversation, or (b) the message
  // actually belongs to the conversationId supplied — a caller could react
  // to a message from a conversation they're not part of, or announce it
  // under an unrelated conversationId.
  socket.on('react_message', async ({ messageId, emoji, conversationId }) => {
    try {
      if (!(await canAccessConversation(socket.user._id, conversationId))) return

      const message = await Message.findById(messageId)
      if (!message) return
      if (message.conversation.toString() !== conversationId.toString()) return

      const existingIdx = message.reactions.findIndex(
        r => r.user.toString() === socket.user._id.toString()
      )

      if (existingIdx !== -1) {
        if (message.reactions[existingIdx].emoji === emoji) {
          message.reactions.splice(existingIdx, 1)
        } else {
          message.reactions[existingIdx].emoji = emoji
        }
      } else {
        message.reactions.push({ emoji, user: socket.user._id })
      }

      await message.save()

      io.to(`conv_${conversationId}`).emit('message_reacted', {
        messageId,
        reactions: message.reactions,
      })
    } catch {}
  })
  // Group message via socket
  // SECURITY FIX: previously verified membership in `groupId` but trusted
  // `conversationId` as a separate, independent value from the client — a
  // member of Group A could supply Group A's groupId (passes the
  // membership check) paired with Group B's conversationId, and the
  // message would be saved and broadcast into Group B's conversation.
  // Now the conversation is resolved FROM the group server-side, never
  // trusted from the client.
socket.on('send_group_message', async (data) => {
  try {
    const { groupId, content, replyTo } = data

    const group = await StudyGroup.findById(groupId)
    if (!group) return

    const isMember = group.members.some(
      m => m.user.toString() === socket.user._id.toString()
    )
    if (!isMember) return
    if (!group.conversation) return

    const conversationId = group.conversation

    const message = await Message.create({
      conversation: conversationId,
      sender: socket.user._id,
      content,
      type: 'text',
      replyTo: replyTo || undefined,
      readBy: [socket.user._id],
    })

    await message.populate('sender', 'name avatar branch year')

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    })

    group.messageCount = (group.messageCount || 0) + 1
    await group.save()

    io.to(`conv_${conversationId}`).emit('message_received', message)
  } catch (err) {
    socket.emit('message_error', { message: err.message })
  }
})
  // SECURITY FIX: same client-supplied-conversationId issue as the group
  // handler above — resolve the conversation from the club instead.
socket.on('send_club_message', async (data) => {
  try {
    const { clubId, content } = data
    const club = await Club.findById(clubId)
    if (!club) return

    const isMember = club.members.some(m => m.user.toString() === socket.user._id.toString())
    if (!isMember) return
    if (!club.conversation) return

    const conversationId = club.conversation

    const message = await Message.create({
      conversation: conversationId,
      sender: socket.user._id,
      content,
      type: 'text',
      readBy: [socket.user._id],
    })
    await message.populate('sender', 'name avatar branch year')

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    })

    io.to(`conv_${conversationId}`).emit('message_received', message)
  } catch (err) {
    socket.emit('message_error', { message: err.message })
  }
})

// Track active editors per doc: docId -> Map(socketId -> {userId, name, color, cursorPos})
const docEditors = new Map()
const editorColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444']

// SECURITY FIX: previously joined the room and started tracking this user
// as an active editor with zero check that they're allowed to view/edit
// this doc — same missing-authorization pattern as join_whiteboard above.
socket.on('join_doc', async ({ docId }) => {
  const doc = await getCollabDocForAuth(docId)
  if (!canViewCollabDoc(doc, socket.user._id)) return

  socket.join(`doc_${docId}`)

  if (!docEditors.has(docId)) docEditors.set(docId, new Map())
  const editors = docEditors.get(docId)
  const color = editorColors[editors.size % editorColors.length]

  editors.set(socket.id, {
    userId: socket.user._id.toString(),
    name: socket.user.name,
    avatar: socket.user.avatar,
    color,
    cursorPos: 0,
  })

  // Broadcast updated editor list
  io.to(`doc_${docId}`).emit('doc_editors', Array.from(editors.values()))
})

socket.on('leave_doc', ({ docId }) => {
  socket.leave(`doc_${docId}`)
  const editors = docEditors.get(docId)
  if (editors) {
    editors.delete(socket.id)
    io.to(`doc_${docId}`).emit('doc_editors', Array.from(editors.values()))
  }
})

// Real-time content sync (operational — simple last-write-wins per chunk)
// SECURITY FIX: previously ANY authenticated socket could persist content
// to ANY document by ID, whether or not they'd ever joined its room or had
// any edit rights — this was the most serious of the socket gaps, since it
// silently overwrote real document content via $inc'd version, not just
// leaked visibility.
socket.on('doc_change', async ({ docId, content, title }) => {
  try {
    const doc = await getCollabDocForAuth(docId)
    if (!canEditCollabDoc(doc, socket.user._id)) return

    socket.to(`doc_${docId}`).emit('doc_updated', {
      content, title,
      editedBy: { id: socket.user._id, name: socket.user.name },
    })

    // Debounced save handled client-side; this just saves on each change
    await CollabDoc.findByIdAndUpdate(docId, {
      content, title,
      lastEditedBy: socket.user._id,
      $inc: { version: 1 },
    })
  } catch (err) {
    console.error('doc_change error:', err.message)
  }
})

// Cursor position broadcast
socket.on('cursor_move', ({ docId, cursorPos, selectionEnd }) => {
  const editors = docEditors.get(docId)
  if (editors?.has(socket.id)) {
    editors.get(socket.id).cursorPos = cursorPos
    editors.get(socket.id).selectionEnd = selectionEnd
  }
  socket.to(`doc_${docId}`).emit('cursor_updated', {
    userId: socket.user._id,
    name: socket.user.name,
    cursorPos,
    selectionEnd,
    color: editors?.get(socket.id)?.color,
  })
})

// Clean up on disconnect
docEditors.forEach((editors, docId) => {
  if (editors.has(socket.id)) {
    editors.delete(socket.id)
    io.to(`doc_${docId}`).emit('doc_editors', Array.from(editors.values()))
  }
})
  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.name}`)
    onlineUsers.delete(socket.user._id.toString())
    socket.broadcast.emit('user_offline', { userId: socket.user._id })
  })
})

// ─── EXPRESS APP ────────────────────────────────────────────────────
// Middleware, all 45 route mounts, the health check, and the global
// error handler live in ./app.js (imported above) — see that file for
// why. Nothing else needs to happen here on the Express side; from
// here down it's just DB connection, cron jobs, and starting the server.

// ─── START SERVER ─────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected')
    await seedBadges()
    await seedSkills()
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch((err) => console.error('❌ DB connection failed:', err.message))


// Check for reminders every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date()
    const events = await CalendarEvent.find({
      'reminder.enabled': true,
      'reminder.sent': false,
      startDate: { $gte: now },
    })

    for (const event of events) {
      const reminderTime = new Date(event.startDate.getTime() - event.reminder.minutesBefore * 60000)
      if (now >= reminderTime) {
        await createNotification({
          recipient: event.user,
          type: 'event',
          title: `⏰ Reminder: ${event.title}`,
          message: `Starting in ${event.reminder.minutesBefore} minutes`,
          link: '/calendar',
        })
        event.reminder.sent = true
        await event.save()
      }
    }
  } catch (err) {
    console.error('Reminder cron error:', err.message)
  }
})


// Daily digests — runs every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const prefs = await DigestPreference.find({ enabled: true, frequency: 'daily' })
    for (const pref of prefs) {
      const user = await User.findById(pref.user)
      if (!user) continue
      const data = await buildDigestData(user, pref.sections, 1)
      const html = buildDigestHTML(data)
      await sendDigestEmail(user.email, user.name, html)
      pref.lastSentAt = new Date()
      await pref.save()
      // DIGEST-01 FIX: reset the periodXp accumulator now that its value
      // has actually been included in a sent digest — see
      // utils/digestBuilder.js and models/UserStats.js.
      await UserStats.updateOne({ user: pref.user }, { $set: { periodXp: 0 } })
    }
    console.log(`✅ Sent ${prefs.length} daily digests`)
  } catch (err) {
    console.error('Daily digest cron error:', err.message)
  }
})

// Weekly digests — runs every Monday at 8 AM
cron.schedule('0 8 * * 1', async () => {
  try {
    const prefs = await DigestPreference.find({ enabled: true, frequency: 'weekly' })
    for (const pref of prefs) {
      const user = await User.findById(pref.user)
      if (!user) continue
      const data = await buildDigestData(user, pref.sections, 7)
      const html = buildDigestHTML(data)
      await sendDigestEmail(user.email, user.name, html)
      pref.lastSentAt = new Date()
      await pref.save()
      // DIGEST-01 FIX: see the daily digest job above for why.
      await UserStats.updateOne({ user: pref.user }, { $set: { periodXp: 0 } })
    }
    console.log(`✅ Sent ${prefs.length} weekly digests`)
  } catch (err) {
    console.error('Weekly digest cron error:', err.message)
  }
})