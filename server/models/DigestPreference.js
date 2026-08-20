import mongoose from 'mongoose'

const digestPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    enabled: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'off'],
      default: 'weekly',
    },
    sections: {
      notes: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      placements: { type: Boolean, default: true },
      marketplace: { type: Boolean, default: false },
      gamification: { type: Boolean, default: true },
      mentorship: { type: Boolean, default: true },
    },
    lastSentAt: Date,
  },
  { timestamps: true }
)

export default mongoose.model('DigestPreference', digestPreferenceSchema)