import mongoose from 'mongoose'

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
})

const postSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['post', 'announcement', 'poll', 'event_share'],
      default: 'post',
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Post too long'],
    },
    images: [String], // Cloudinary URLs
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For announcements
    isAnnouncement: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },

    // Reactions
    reactions: {
      like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      celebrate: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      support: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      insightful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },

    // Poll
    poll: {
      question: String,
      options: [pollOptionSchema],
      endsAt: Date,
      allowMultiple: { type: Boolean, default: false },
    },

    // Visibility
    visibility: {
      type: String,
      enum: ['everyone', 'college', 'branch', 'year'],
      default: 'everyone',
    },
    college: String,
    branch: String,
    year: Number,

    tags: [String],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

postSchema.index({ createdAt: -1 })
postSchema.index({ college: 1, createdAt: -1 })
postSchema.index({ content: 'text' })

export default mongoose.model('Post', postSchema)