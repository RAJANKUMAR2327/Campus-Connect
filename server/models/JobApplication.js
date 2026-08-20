import mongoose from 'mongoose'

const applicationStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: String,
})

const jobApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['internship', 'full-time', 'part-time'],
      default: 'internship',
    },
    source: {
      type: String,
      enum: ['oncampus', 'offcampus', 'referral', 'linkedin', 'naukri', 'company-website', 'other'],
      default: 'oncampus',
    },
    location: { type: String, trim: true },
    workMode: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite',
    },
    package: { type: String, trim: true }, // "12 LPA" or "30k/month"
    jobUrl: { type: String, trim: true },
    appliedDate: { type: Date, default: Date.now },
    deadline: { type: Date },

    status: {
      type: String,
      enum: ['wishlist', 'applied', 'oa-test', 'interview-1', 'interview-2',
             'interview-3', 'hr-round', 'offer', 'rejected', 'withdrawn', 'accepted'],
      default: 'wishlist',
    },
    statusHistory: [applicationStatusHistorySchema],

    referredBy: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactEmail: { type: String, trim: true },

    notes: { type: String, trim: true },
    resumeVersion: { type: String, trim: true }, // which resume version used

    interviewRounds: [{
      round: String,
      date: Date,
      mode: { type: String, enum: ['online', 'offline', 'phone'] },
      notes: String,
      result: { type: String, enum: ['pending', 'passed', 'failed'] },
    }],

    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },

    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
)

jobApplicationSchema.index({ user: 1, status: 1 })
jobApplicationSchema.index({ user: 1, appliedDate: -1 })

export default mongoose.model('JobApplication', jobApplicationSchema)