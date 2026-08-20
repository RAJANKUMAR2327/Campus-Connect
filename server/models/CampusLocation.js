import mongoose from 'mongoose'

const campusLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['academic', 'hostel', 'canteen', 'library', 'sports', 'medical', 'admin', 'parking', 'other'],
      default: 'other',
    },
    description: { type: String, trim: true, maxlength: 500 },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('CampusLocation', campusLocationSchema)
