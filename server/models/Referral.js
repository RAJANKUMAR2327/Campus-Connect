import mongoose from 'mongoose'

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    jobUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    workMode: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'onsite' },
    type: { type: String, enum: ['internship', 'full-time'], default: 'full-time' },
    package: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    eligibility: { type: String, trim: true }, // "CSE/IT, CGPA 7+"
    deadline: { type: Date },
    maxReferrals: { type: Number, default: 5 },
    referralCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    tags: [String],
  },
  { timestamps: true }
)

referralSchema.index({ company: 'text', role: 'text', description: 'text' })
referralSchema.index({ isActive: 1, createdAt: -1 })

export default mongoose.model('Referral', referralSchema)