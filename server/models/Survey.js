import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['single-choice', 'multi-choice', 'rating', 'text', 'yes-no'],
    default: 'single-choice',
  },
  options: [{ type: String, trim: true }], // for choice types
  required: { type: Boolean, default: true },
})

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    college: { type: String, trim: true },
    targetAudience: {
      type: String,
      enum: ['everyone', 'branch', 'year', 'custom'],
      default: 'everyone',
    },
    targetBranch: String,
    targetYear: Number,
    isAnonymous: { type: Boolean, default: false },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isOfficial: { type: Boolean, default: false }, // student council badge
    category: {
      type: String,
      enum: ['academic', 'infrastructure', 'events', 'food', 'transport', 'general', 'feedback'],
      default: 'general',
    },
    responseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

surveySchema.index({ college: 1, isActive: 1, endDate: 1 })

export default mongoose.model('Survey', surveySchema)