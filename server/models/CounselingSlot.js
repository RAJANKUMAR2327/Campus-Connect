import mongoose from 'mongoose'

const counselingSlotSchema = new mongoose.Schema(
  {
    counselorName: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true }, // e.g. "Academic stress", "General wellness"
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // "HH:MM"
    durationMinutes: { type: Number, default: 30 },
    location: { type: String, trim: true }, // room / "Online"
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookingNote: { type: String, trim: true, maxlength: 300 }, // optional note from student
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

counselingSlotSchema.index({ date: 1, isBooked: 1 })

export default mongoose.model('CounselingSlot', counselingSlotSchema)
