// SECURITY FIX. Previously, REST endpoints checked ownership/collaborator
// status for CollabDocs and Whiteboards, but the Socket.IO handlers for the
// exact same resources (doc_change, stroke_complete, undo_stroke,
// clear_board) did none of these checks — any authenticated socket could
// write to any document or whiteboard just by knowing/guessing its ID.
// These helpers are now the SINGLE source of truth for "can this user touch
// this resource", called from both app.js/controllers and index.js/sockets,
// so the two layers can't silently diverge again.
import Conversation from '../models/Conversation.js'
import CollabDoc from '../models/CollabDoc.js'
import Whiteboard from '../models/Whiteboard.js'

const idsEqual = (a, b) => a && b && a.toString() === b.toString()

// ─── CONVERSATIONS ──────────────────────────────────────────────────
// True if userId is allowed to read/write in this conversation: it's the
// public campus-wide room, or they're a listed participant.
export async function canAccessConversation(userId, conversationId) {
  if (!conversationId) return false
  const conversation = await Conversation.findById(conversationId).select('participants isPublic')
  if (!conversation) return false
  if (conversation.isPublic) return true
  return conversation.participants.some((p) => idsEqual(p, userId))
}

// ─── COLLABORATIVE DOCS ─────────────────────────────────────────────
export async function getCollabDocForAuth(docId) {
  return CollabDoc.findById(docId).select('owner collaborators isPublic')
}

export function canViewCollabDoc(doc, userId) {
  if (!doc) return false
  if (idsEqual(doc.owner, userId)) return true
  if (doc.isPublic) return true
  return doc.collaborators.some((c) => idsEqual(c.user, userId))
}

export function canEditCollabDoc(doc, userId) {
  if (!doc) return false
  if (idsEqual(doc.owner, userId)) return true
  return doc.collaborators.some((c) => idsEqual(c.user, userId) && c.role === 'editor')
}

// ─── WHITEBOARDS ─────────────────────────────────────────────────────
export async function getWhiteboardForAuth(boardId) {
  return Whiteboard.findById(boardId).select('owner collaborators isPublic')
}

// Whiteboards don't have a viewer/editor role split (unlike CollabDocs) —
// any collaborator can draw. Being a collaborator or the board being public
// grants edit access; anyone else is denied.
export function canEditWhiteboard(board, userId) {
  if (!board) return false
  if (idsEqual(board.owner, userId)) return true
  if (board.isPublic) return true
  return board.collaborators.some((c) => idsEqual(c.user, userId))
}
