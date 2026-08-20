import mongoose from 'mongoose'

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [80, 'Name too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    branch: { type: String, trim: true },
    year: { type: Number, min: 1, max: 5 },
    tags: [{ type: String, trim: true }],
    avatar: { type: String, default: '' },
    coverColor: {
      type: String,
      default: '#6366f1',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
      joinedAt: { type: Date, default: Date.now },
    }],
    maxMembers: { type: Number, default: 50 },
    isPrivate: { type: Boolean, default: false },
    joinRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    resources: [{
      title: String,
      url: String,
      type: { type: String, enum: ['link', 'note', 'file'] },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now },
    }],
    // Linked conversation for group chat
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    meetingLink: { type: String, trim: true },
    nextMeeting: { type: Date },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

studyGroupSchema.index({ subject: 'text', name: 'text', description: 'text' })
studyGroupSchema.index({ branch: 1, year: 1 })

export default mongoose.model('StudyGroup', studyGroupSchema)