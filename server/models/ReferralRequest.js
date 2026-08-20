import mongoose from 'mongoose'

const referralRequestSchema = new mongoose.Schema(
  {
    referral: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 500 },
    resumeUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'referred'],
      default: 'pending',
    },
    referrerNotes: { type: String, trim: true },
  },
  { timestamps: true }
)

referralRequestSchema.index({ referral: 1, applicant: 1 }, { unique: true })

export default mongoose.model('ReferralRequest', referralRequestSchema)