import mongoose from 'mongoose'

const mentorshipRequestSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { type: String, trim: true, maxlength: 500 },
    domain: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'ended'],
      default: 'pending',
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
)

mentorshipRequestSchema.index({ mentor: 1, status: 1 })
mentorshipRequestSchema.index({ mentee: 1, status: 1 })

export default mongoose.model('MentorshipRequest', mentorshipRequestSchema)