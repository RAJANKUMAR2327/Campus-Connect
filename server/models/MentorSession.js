import mongoose from 'mongoose'

const mentorSessionSchema = new mongoose.Schema(
  {
    mentorshipRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorshipRequest',
      required: true,
    },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 }, // minutes
    meetingLink: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, trim: true },
  },
  { timestamps: true }
)

mentorSessionSchema.index({ mentor: 1, scheduledAt: 1 })
mentorSessionSchema.index({ mentee: 1, scheduledAt: 1 })

export default mongoose.model('MentorSession', mentorSessionSchema)