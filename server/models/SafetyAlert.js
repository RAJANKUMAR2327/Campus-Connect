import mongoose from 'mongoose'

const safetyAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
)

safetyAlertSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('SafetyAlert', safetyAlertSchema)
