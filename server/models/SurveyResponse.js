import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  answer: mongoose.Schema.Types.Mixed, // string, array of strings, or number (rating)
})

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
    respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null if anonymous
    isAnonymous: { type: Boolean, default: false },
    answers: [answerSchema],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

surveyResponseSchema.index({ survey: 1 })

export default mongoose.model('SurveyResponse', surveyResponseSchema)