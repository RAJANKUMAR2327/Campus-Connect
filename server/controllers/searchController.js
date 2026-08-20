import Note from '../models/Note.js'
import LostFound from '../models/LostFound.js'
import Event from '../models/Event.js'
import Listing from '../models/Listing.js'
import Placement from '../models/Placement.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { sendServerError } from '../utils/errorResponse.js'

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Query too short.' })
    }

    const regex = new RegExp(escapeRegex(q), 'i')

    const [notes, lostFound, events, listings, placements] = await Promise.all([
      Note.find({
        $or: [{ title: regex }, { subject: regex }, { description: regex }],
        isApproved: true,
      }).limit(5).select('title subject branch year fileUrl uploader').populate('uploader', 'name'),

      LostFound.find({
        $or: [{ title: regex }, { description: regex }],
        status: 'open',
      }).limit(5).select('title type category location postedBy').populate('postedBy', 'name'),

      Event.find({
        $or: [{ title: regex }, { description: regex }],
        isApproved: true,
      }).limit(5).select('title category date venue createdBy').populate('createdBy', 'name'),

      Listing.find({
        $or: [{ title: regex }, { description: regex }],
        status: 'available',
      }).limit(5).select('title price category condition seller').populate('seller', 'name'),

      Placement.find({
        $or: [{ title: regex }, { company: regex }, { description: regex }],
      }).limit(5).select('title type company role package postedBy').populate('postedBy', 'name'),
    ])

    res.json({
      results: {
        notes: notes.map(n => ({ ...n._doc, _type: 'note' })),
        lostFound: lostFound.map(l => ({ ...l._doc, _type: 'lostfound' })),
        events: events.map(e => ({ ...e._doc, _type: 'event' })),
        listings: listings.map(l => ({ ...l._doc, _type: 'listing' })),
        placements: placements.map(p => ({ ...p._doc, _type: 'placement' })),
      },
      total: notes.length + lostFound.length + events.length + listings.length + placements.length,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}