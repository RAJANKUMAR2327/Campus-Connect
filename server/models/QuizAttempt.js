import mongoose from 'mongoose'

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [{
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedAnswer: String,
      isCorrect: Boolean,
      timeTaken: Number, // seconds
    }],
    subject: String,
    totalQuestions: Number,
    correctAnswers: Number,
    score: Number, // percentage
    timeTaken: Number, // total seconds
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.model('QuizAttempt', quizAttemptSchema)