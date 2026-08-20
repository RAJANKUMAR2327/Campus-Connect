import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isGroup: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false }, // true for the single campus-wide chat room
    groupName: String,
    groupAvatar: String,
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

conversationSchema.index({ participants: 1 })
conversationSchema.index({ lastMessageAt: -1 })

export default mongoose.model('Conversation', conversationSchema)