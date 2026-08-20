import mongoose from 'mongoose'

const seatBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryZone',
      required: true,
    },
    seatNumber: { type: String, required: true },
    date: { type: String, required: true }, // "2026-06-26" for easy querying
    startTime: { type: String, required: true }, // "14:00"
    endTime: { type: String, required: true }, // "16:00"
    status: {
      type: String,
      enum: ['upcoming', 'checked-in', 'completed', 'cancelled', 'no-show'],
      default: 'upcoming',
    },
    checkedInAt: Date,
    checkedOutAt: Date,
    purpose: { type: String, trim: true }, // "Exam prep", "Group project"
    // For group bookings
    isGroupBooking: { type: Boolean, default: false },
    groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    qrCode: { type: String, unique: true },
  },
  { timestamps: true }
)

seatBookingSchema.index({ zone: 1, date: 1, seatNumber: 1 })
seatBookingSchema.index({ user: 1, date: 1 })

export default mongoose.model('SeatBooking', seatBookingSchema)