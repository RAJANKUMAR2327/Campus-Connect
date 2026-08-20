import mongoose from 'mongoose'

const paperSetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },
    year: { type: Number },
    semester: { type: Number },
    examYear: { type: Number, required: true },
    examType: {
      type: String,
      enum: ['mid-sem', 'end-sem', 'quiz', 'assignment'],
      default: 'end-sem',
    },
    duration: { type: Number }, // minutes
    totalMarks: { type: Number },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    }],
    fileUrl: { type: String }, // uploaded PDF
    filePublicId: { type: String },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloads: { type: Number, default: 0 },
    college: { type: String, trim: true },
  },
  { timestamps: true }
)

paperSetSchema.index({ subject: 1, examYear: -1 })

export default mongoose.model('PaperSet', paperSetSchema)