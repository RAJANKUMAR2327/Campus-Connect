import CallSession from '../models/CallSession.js'
import User from '../models/User.js'
import crypto from 'crypto'
import { sendServerError } from '../utils/errorResponse.js'

// SECURITY/PRIVACY FIX: this codebase has a deliberate, carefully-built
// blocking system (see followController.js's canViewProfile — it gates
// profile viewing, followers/following lists, and DM initiation) but
// calling was never wired into it. CallButton.jsx is a generic, reusable
// component (not gated behind an already-open, already-blocking-checked
// conversation), so a user blocked by someone — or who has blocked them —
// could still ring them, and the target's client would render an
// incoming-call prompt with the blocker's name/avatar regardless. This
// checks blocking in both directions against every requested participant
// before a room is created.
export const createCallRoom = async (req, res) => {
  try {
    const { type, sourceId, participantIds } = req.body

    const me = await User.findById(req.user._id).select('blockedUsers')
    const others = await User.find({ _id: { $in: participantIds || [] } }).select('blockedUsers')

    if (others.length !== (participantIds || []).length) {
      return res.status(404).json({ message: 'One or more participants not found.' })
    }

    const blocked = others.some(
      (other) => me.hasBlocked(other._id) || other.hasBlocked(req.user._id)
    )
    if (blocked) {
      // Deliberately generic — same "don't confirm a block exists" policy
      // already used elsewhere in this codebase (e.g. blocked profiles
      // 404 rather than 403) rather than a message that reveals *why*.
      return res.status(403).json({ message: 'Unable to start this call.' })
    }

    const roomId = crypto.randomBytes(8).toString('hex')

    const call = await CallSession.create({
      roomId,
      initiator: req.user._id,
      type, sourceId,
      participants: [
        { user: req.user._id },
        ...(participantIds || []).map(id => ({ user: id })),
      ],
    })

    res.status(201).json({ roomId, callId: call._id })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getCallHistory = async (req, res) => {
  try {
    const calls = await CallSession.find({
      'participants.user': req.user._id,
      status: 'ended',
    })
      .sort({ endedAt: -1 })
      .limit(20)
      .populate('participants.user', 'name avatar')

    res.json({ calls })
  } catch (err) {
    sendServerError(res, err)
  }
}