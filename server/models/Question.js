import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    topic: { type: String, trim: true },
    branch: { type: String, trim: true },
    year: { type: Number, min: 1, max: 5 },
    semester: { type: Number, min: 1, max: 10 },
    examYear: { type: Number }, // e.g. 2023
    examType: {
      type: String,
      enum: ['mid-sem', 'end-sem', 'quiz', 'assignment', 'practice'],
      default: 'practice',
    },
    type: {
      type: String,
      enum: ['mcq', 'short', 'long', 'numerical', 'coding'],
      default: 'short',
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: [{ type: String, trim: true }], // for MCQ
    answer: { type: String, trim: true },
    explanation: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    marks: { type: Number, default: 1 },
    tags: [{ type: String, trim: true }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verified: { type: Boolean, default: false },
    imageUrl: { type: String },
  },
  { timestamps: true }
)

questionSchema.index({ subject: 'text', topic: 'text', question: 'text' })
questionSchema.index({ branch: 1, year: 1, subject: 1, examType: 1 })

export default mongoose.model('Question', questionSchema)