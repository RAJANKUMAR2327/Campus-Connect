import Whiteboard from '../models/Whiteboard.js'
import crypto from 'crypto'
import { canEditWhiteboard } from '../utils/resourceAuth.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createWhiteboard = async (req, res) => {
  try {
    const { title, sourceType, sourceId } = req.body
    const shareCode = crypto.randomBytes(6).toString('hex')

    const board = await Whiteboard.create({
      title: title || 'Untitled Board',
      owner: req.user._id,
      collaborators: [{ user: req.user._id }],
      shareCode, sourceType, sourceId,
    })

    await board.populate('owner', 'name avatar')
    res.status(201).json({ message: 'Whiteboard created!', board })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyWhiteboards = async (req, res) => {
  try {
    const boards = await Whiteboard.find({
      $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }],
    })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name avatar')
      .select('-strokes')

    res.json({ boards })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getWhiteboardById = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id)
      .populate('owner', 'name avatar')
      .populate('collaborators.user', 'name avatar')

    if (!board) return res.status(404).json({ message: 'Whiteboard not found.' })

    const isCollaborator = board.collaborators.some(c => c.user._id.toString() === req.user._id.toString())
    if (!isCollaborator && !board.isPublic) return res.status(403).json({ message: 'Access denied.' })

    res.json({ board })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const joinViaShareCode = async (req, res) => {
  try {
    const board = await Whiteboard.findOne({ shareCode: req.params.code })
    if (!board) return res.status(404).json({ message: 'Invalid share link.' })

    const isCollaborator = board.collaborators.some(c => c.user.toString() === req.user._id.toString())
    if (!isCollaborator) {
      board.collaborators.push({ user: req.user._id })
      await board.save()
    }
    res.json({ boardId: board._id })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const clearWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id)
    if (!board) return res.status(404).json({ message: 'Not found.' })

    // SECURITY FIX: previously ANY authenticated user could clear ANY
    // whiteboard by ID — no ownership/collaborator check existed at all.
    if (!canEditWhiteboard(board, req.user._id)) {
      return res.status(403).json({ message: 'You do not have edit access to this whiteboard.' })
    }

    board.strokes = []
    await board.save()
    res.json({ message: 'Cleared!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id)
    if (!board) return res.status(404).json({ message: 'Not found.' })
    if (board.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized.' })
    await board.deleteOne()
    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}