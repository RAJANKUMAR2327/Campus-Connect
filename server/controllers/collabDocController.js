import CollabDoc from '../models/CollabDoc.js'
import { getCollabDocForAuth, canEditCollabDoc } from '../utils/resourceAuth.js'
import crypto from 'crypto'
import { createNotification } from './notificationController.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createDoc = async (req, res) => {
  try {
    const { title, subject } = req.body
    const shareCode = crypto.randomBytes(6).toString('hex')

    const doc = await CollabDoc.create({
      title: title || 'Untitled Document',
      subject,
      owner: req.user._id,
      shareCode,
      collaborators: [{ user: req.user._id, role: 'editor' }],
    })

    await doc.populate('owner', 'name avatar')
    res.status(201).json({ message: 'Document created!', doc })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyDocs = async (req, res) => {
  try {
    const docs = await CollabDoc.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id },
      ],
    })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name avatar')
      .populate('lastEditedBy', 'name')
      .select('-content')

    res.json({ docs })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getDocById = async (req, res) => {
  try {
    const doc = await CollabDoc.findById(req.params.id)
      .populate('owner', 'name avatar')
      .populate('collaborators.user', 'name avatar branch year')
      .populate('lastEditedBy', 'name')

    if (!doc) return res.status(404).json({ message: 'Document not found.' })

    const isCollaborator = doc.collaborators.some(
      c => c.user._id.toString() === req.user._id.toString()
    )
    if (!isCollaborator && !doc.isPublic) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    res.json({ doc })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getDocByShareCode = async (req, res) => {
  try {
    const doc = await CollabDoc.findOne({ shareCode: req.params.code })
      .populate('owner', 'name avatar')
      .populate('collaborators.user', 'name avatar branch year')

    if (!doc) return res.status(404).json({ message: 'Invalid share link.' })
    res.json({ doc })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const joinViaShareCode = async (req, res) => {
  try {
    const doc = await CollabDoc.findOne({ shareCode: req.params.code })
    if (!doc) return res.status(404).json({ message: 'Invalid share link.' })

    const isCollaborator = doc.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    )
    if (!isCollaborator) {
      doc.collaborators.push({ user: req.user._id, role: 'editor' })
      await doc.save()

      await createNotification({
        recipient: doc.owner,
        type: 'system',
        title: 'New collaborator',
        message: `${req.user.name} joined "${doc.title}"`,
        link: `/notes/collab/${doc._id}`,
        actor: req.user._id,
      })
    }

    res.json({ message: 'Joined document!', docId: doc._id })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const updateDoc = async (req, res) => {
  try {
    const { title, content } = req.body
    const doc = await CollabDoc.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Document not found.' })

    // SECURITY FIX: previously ANY authenticated user could save changes to
    // ANY document by ID — no ownership/collaborator check existed at all.
    if (!canEditCollabDoc(doc, req.user._id)) {
      return res.status(403).json({ message: 'You do not have edit access to this document.' })
    }

    if (title !== undefined) doc.title = title
    if (content !== undefined) doc.content = content
    doc.lastEditedBy = req.user._id
    doc.version += 1

    await doc.save()
    res.json({ message: 'Saved!', version: doc.version })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const updateCollaboratorRole = async (req, res) => {
  try {
    const { userId, role } = req.body
    const doc = await CollabDoc.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Document not found.' })

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can manage roles.' })
    }

    const collab = doc.collaborators.find(c => c.user.toString() === userId)
    if (collab) collab.role = role

    await doc.save()
    res.json({ message: 'Role updated!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const removeCollaborator = async (req, res) => {
  try {
    const doc = await CollabDoc.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Document not found.' })

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can remove collaborators.' })
    }

    doc.collaborators = doc.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    )
    await doc.save()
    res.json({ message: 'Collaborator removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteDoc = async (req, res) => {
  try {
    const doc = await CollabDoc.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Document not found.' })

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete.' })
    }

    await doc.deleteOne()
    res.json({ message: 'Document deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const togglePublic = async (req, res) => {
  try {
    const doc = await CollabDoc.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Document not found.' })
    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' })
    }
    doc.isPublic = !doc.isPublic
    await doc.save()
    res.json({ isPublic: doc.isPublic })
  } catch (err) {
    sendServerError(res, err)
  }
}