import mongoose from 'mongoose'

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: { type: String, trim: true }, // optional label, e.g. "Data Structures"
    durationMinutes: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['focus', 'break'], default: 'focus' },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

studySessionSchema.index({ user: 1, completedAt: -1 })

export default mongoose.model('StudySession', studySessionSchema)
