import mongoose from 'mongoose'

const calendarEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['exam', 'assignment', 'event', 'meeting', 'reminder', 'study-group', 'placement', 'other'],
      default: 'other',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    allDay: { type: Boolean, default: false },
    location: { type: String, trim: true },
    color: { type: String, default: '#6366f1' },
    reminder: {
      enabled: { type: Boolean, default: false },
      minutesBefore: { type: Number, default: 30 },
      sent: { type: Boolean, default: false },
    },
    // Link to source (auto-synced from app)
    sourceType: {
      type: String,
      enum: ['manual', 'event', 'placement', 'study-group', 'club', 'mentorship'],
      default: 'manual',
    },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      until: Date,
    },
  },
  { timestamps: true }
)

calendarEventSchema.index({ user: 1, startDate: 1 })

export default mongoose.model('CalendarEvent', calendarEventSchema)