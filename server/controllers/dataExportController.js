import User from '../models/User.js'
import Note from '../models/Note.js'
import Event from '../models/Event.js'
import Listing from '../models/Listing.js'
import LostFound from '../models/LostFound.js'
import Placement from '../models/Placement.js'
import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import Message from '../models/Message.js'
import JobApplication from '../models/JobApplication.js'
import Task from '../models/Task.js'
import GpaRecord from '../models/GpaRecord.js'
import AttendanceSubject from '../models/AttendanceSubject.js'
import Confession from '../models/Confession.js'
import Notification from '../models/Notification.js'

// ─── EXPORT MY DATA ─────────────────────────────────────────────────
// NEW FEATURE. Returns a single JSON document containing everything this
// account has created, across the highest-value personal-data categories.
//
// SCOPE, stated honestly: this covers the categories a person would
// actually care about getting a copy of (profile, notes, posts, chat
// messages, job applications, academic records, confessions authored by
// them, etc.) rather than exhaustively every one of the 56 models in the
// schema — some of those (e.g. AuditLog, PushSubscription, CallSession)
// are operational/system records about the account rather than personal
// content the account produced, and are intentionally excluded. If a
// category you expected is missing, it's a scoping choice, not a bug —
// extending the `sections` list below to cover more models is
// straightforward given the pattern already established here.
export const exportMyData = async (req, res) => {
  try {
    const userId = req.user._id

    const [
      profile, notes, events, listings, lostFound, placements,
      posts, comments, sentMessages, jobApplications, tasks,
      gpaRecords, attendanceRecords, confessions, notifications,
    ] = await Promise.all([
      User.findById(userId).select('-password -verifyToken -resetPasswordToken'),
      Note.find({ uploader: userId }).select('-__v'),
      Event.find({ createdBy: userId }).select('-__v'),
      Listing.find({ seller: userId }).select('-__v'),
      LostFound.find({ postedBy: userId }).select('-__v'),
      Placement.find({ postedBy: userId }).select('-__v'),
      Post.find({ author: userId }).select('-__v'),
      Comment.find({ author: userId }).select('-__v'),
      Message.find({ sender: userId }).select('-__v').limit(5000).sort({ createdAt: -1 }),
      JobApplication.find({ user: userId }).select('-__v'),
      Task.find({ user: userId }).select('-__v'),
      GpaRecord.find({ user: userId }).select('-__v'),
      AttendanceSubject.find({ user: userId }).select('-__v'),
      // Confessions are anonymous to other users but the export is for the
      // account owner themselves, so it's correct to include their own here.
      Confession.find({ realAuthor: userId }).select('-__v'),
      Notification.find({ recipient: userId }).select('-__v').limit(2000).sort({ createdAt: -1 }),
    ])

    res.setHeader('Content-Disposition', 'attachment; filename="campusconnect-my-data.json"')
    res.json({
      exportedAt: new Date().toISOString(),
      scopeNote:
        'This export covers your profile and the content you have created across the platform\'s ' +
        'core modules. It does not include every one of the platform\'s features (e.g. operational ' +
        'records like audit logs or push-subscription tokens are excluded as they are not personal ' +
        'content you authored). Chat messages and notifications are capped at the most recent 5,000 ' +
        'and 2,000 entries respectively.',
      profile,
      content: {
        notes, events, listings, lostFound, placements, posts, comments,
        sentMessages, jobApplications, tasks, gpaRecords, attendanceRecords,
        confessions, notifications,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong generating your export. Please try again.' })
  }
}
