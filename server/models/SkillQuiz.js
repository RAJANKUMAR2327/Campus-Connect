import mongoose from 'mongoose'

const skillQuizSchema = new mongoose.Schema(
  {
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    questions: [{
      question: String,
      options: [String],
      correctAnswer: String, // letter A/B/C/D
    }],
    passingScore: { type: Number, default: 70 }, // percentage
  },
  { timestamps: true }
)

export default mongoose.model('SkillQuiz', skillQuizSchema)