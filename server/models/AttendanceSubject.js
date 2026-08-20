import mongoose from 'mongoose'

const attendanceLogSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['present', 'absent'], required: true },
  },
  { _id: false }
)

const attendanceSubjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6366f1' },
    minRequiredPercent: { type: Number, default: 75, min: 0, max: 100 },
    totalClasses: { type: Number, default: 0 },
    attendedClasses: { type: Number, default: 0 },
    log: [attendanceLogSchema], // recent history, most recent last
  },
  { timestamps: true }
)

attendanceSubjectSchema.index({ user: 1 })

export default mongoose.model('AttendanceSubject', attendanceSubjectSchema)
