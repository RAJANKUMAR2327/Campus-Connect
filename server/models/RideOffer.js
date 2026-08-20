import mongoose from 'mongoose'

const rideOfferSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['offer', 'request'], default: 'offer' }, // offering a ride or looking for one

    fromLocation: { type: String, required: true, trim: true },
    toLocation: { type: String, required: true, trim: true },
    fromCoords: { lat: Number, lng: Number },
    toCoords: { lat: Number, lng: Number },

    departureTime: { type: Date, required: true },
    isRecurring: { type: Boolean, default: false },
    recurringDays: [{ type: Number }], // 0-6 for recurring weekly trips

    totalSeats: { type: Number, default: 3 },
    availableSeats: { type: Number, default: 3 },
    pricePerSeat: { type: Number, default: 0 }, // 0 = free/split fuel cost

    vehicleType: { type: String, enum: ['car', 'bike', 'auto', 'other'], default: 'car' },
    vehicleInfo: { type: String, trim: true }, // "White Swift Dzire"

    notes: { type: String, trim: true, maxlength: 300 },
    college: { type: String, trim: true },

    passengers: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
      joinedAt: { type: Date, default: Date.now },
    }],

    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
)

rideOfferSchema.index({ fromLocation: 'text', toLocation: 'text' })
rideOfferSchema.index({ college: 1, departureTime: 1, status: 1 })

export default mongoose.model('RideOffer', rideOfferSchema)