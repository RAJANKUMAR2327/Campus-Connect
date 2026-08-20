import mongoose from 'mongoose'

const endorsementSchema = new mongoose.Schema({
  endorser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, trim: true, maxlength: 200 },
  createdAt: { type: Date, default: Date.now },
})

const userSkillSchema = new mongoose.Schema(
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
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    endorsements: [endorsementSchema],
    isVerified: { type: Boolean, default: false }, // verified via quiz or admin
    verificationMethod: {
      type: String,
      enum: ['none', 'quiz', 'peer-endorsement', 'admin', 'certificate-upload'],
      default: 'none',
    },
    quizScore: { type: Number }, // if verified via quiz
    certificateUrl: { type: String }, // if verified via uploaded certificate
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

userSkillSchema.index({ user: 1, skill: 1 }, { unique: true })

export default mongoose.model('UserSkill', userSkillSchema)