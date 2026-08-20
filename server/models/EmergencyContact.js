import mongoose from 'mongoose'

const emergencyContactSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['campus-security', 'medical', 'police', 'fire', 'counseling', 'other'],
      default: 'other',
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default mongoose.model('EmergencyContact', emergencyContactSchema)
