import mongoose from 'mongoose'

const confessionCommentSchema = new mongoose.Schema(
  {
    confession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Confession',
      required: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    authorHash: { type: String, required: true },
    realAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: String }], // hashes
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
)

confessionCommentSchema.index({ confession: 1, createdAt: -1 })

export default mongoose.model('ConfessionComment', confessionCommentSchema)