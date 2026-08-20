import mongoose from 'mongoose'

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  row: Number,
  col: Number,
  hasPowerOutlet: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, // false if seat is broken/under maintenance
})

const libraryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Silent Zone A", "Group Study Room 1"
    type: {
      type: String,
      enum: ['silent', 'group-study', 'computer-lab', 'discussion-room', 'reading-room'],
      default: 'silent',
    },
    floor: { type: String, trim: true },
    capacity: { type: Number, required: true },
    seats: [seatSchema],
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '22:00' },
    maxBookingHours: { type: Number, default: 3 },
    college: { type: String, trim: true },
    amenities: [String], // ["WiFi", "AC", "Whiteboard", "Projector"]
    isActive: { type: Boolean, default: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
)

export default mongoose.model('LibraryZone', libraryZoneSchema)