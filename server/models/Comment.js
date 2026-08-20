import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [500, 'Comment too long'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Polymorphic — works for notes, events, placements
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['note', 'event', 'placement', 'listing', 'lostfound'],
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

commentSchema.index({ targetId: 1, targetType: 1 })

export default mongoose.model('Comment', commentSchema)