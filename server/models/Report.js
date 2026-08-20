import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Post', 'Comment', 'Note', 'Listing', 'Confession', 'User'],
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'],
    },
    details: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'actioned', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
)

reportSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Report', reportSchema)
