import mongoose from 'mongoose'

const collabDocSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Document',
    },
    content: {
      type: String,
      default: '',
    },
    subject: { type: String, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
      addedAt: { type: Date, default: Date.now },
    }],
    isPublic: { type: Boolean, default: false }, // anyone with link can view
    shareCode: { type: String, unique: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
)

collabDocSchema.index({ owner: 1 })
collabDocSchema.index({ 'collaborators.user': 1 })

export default mongoose.model('CollabDoc', collabDocSchema)