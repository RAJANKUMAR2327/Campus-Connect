import mongoose from 'mongoose'
import crypto from 'crypto'

const digitalCredentialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    verificationMethod: { type: String, required: true },
    proficiency: { type: String, required: true },
    score: Number,
    verificationCode: { type: String, unique: true, required: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: Date, // optional expiry for time-sensitive skills
    isPublic: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

digitalCredentialSchema.pre('save', function (next) {
  if (!this.verificationCode) {
    this.verificationCode = 'CC-' + crypto.randomBytes(6).toString('hex').toUpperCase()
  }
  next()
})

export default mongoose.model('DigitalCredential', digitalCredentialSchema)