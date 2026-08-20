import mongoose from 'mongoose'

const confessionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Content cannot be empty'],
      trim: true,
      maxlength: [1000, 'Too long'],
    },
    type: {
      type: String,
      enum: ['confession', 'question', 'rant', 'advice'],
      default: 'confession',
    },
    category: {
      type: String,
      enum: ['academics', 'relationships', 'career', 'mental-health',
             'roommate', 'professor', 'campus-life', 'funny', 'other'],
      default: 'other',
    },
    // Anonymous identity hash - consistent per-user-per-post but not traceable
    authorHash: { type: String, required: true },
    // Only stored internally for moderation - never exposed to other users
    realAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    college: { type: String, trim: true }, // for college-scoped feed

    reactions: {
      relate: [{ type: String }], // store hashes, not user IDs, to keep anonymity
      support: [{ type: String }],
      laugh: [{ type: String }],
      hug: [{ type: String }],
    },

    isResolved: { type: Boolean, default: false }, // for questions/advice
    isFlagged: { type: Boolean, default: false },
    flagCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }, // hidden by moderation

    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

confessionSchema.index({ college: 1, createdAt: -1 })
confessionSchema.index({ category: 1 })
confessionSchema.index({ content: 'text' })

export default mongoose.model('Confession', confessionSchema)