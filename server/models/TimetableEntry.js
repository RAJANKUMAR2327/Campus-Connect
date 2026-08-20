import mongoose from 'mongoose'

const timetableEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial', 'seminar'],
      default: 'lecture',
    },
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, ... 6 = Saturday
      required: true,
      min: 0, max: 6,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "10:30"
    venue: { type: String, trim: true },
    instructor: { type: String, trim: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
)

timetableEntrySchema.index({ user: 1, dayOfWeek: 1 })

export default mongoose.model('TimetableEntry', timetableEntrySchema)