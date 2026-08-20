import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description too long'],
    },
    category: {
      type: String,
      enum: ['academic', 'cultural', 'sports', 'technical', 'placement', 'other'],
      default: 'other',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: Date,
    venue: {
      type: String,
      trim: true, // e.g. "Auditorium A", "CR-7"
    },
    organizer: {
      type: String,
      trim: true, // e.g. "CSE Department", "Student Council"
    },
    banner: String, // Cloudinary URL
    registrationLink: String,
    maxParticipants: Number,

    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
)

eventSchema.index({ title: 'text', description: 'text' })
eventSchema.index({ date: 1, category: 1 })

export default mongoose.model('Event', eventSchema)