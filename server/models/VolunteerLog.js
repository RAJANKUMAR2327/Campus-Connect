import mongoose from 'mongoose'

const volunteerLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    organization: { type: String, trim: true },
    category: {
      type: String,
      enum: ['community-service', 'ngo', 'campus-event', 'teaching', 'environmental', 'other'],
      default: 'community-service',
    },
    description: { type: String, trim: true, maxlength: 500 },
    hours: { type: Number, required: true, min: 0.5 },
    date: { type: Date, required: true },
    proofUrl: { type: String }, // optional Cloudinary URL of a certificate/photo
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

volunteerLogSchema.index({ user: 1, date: -1 })

export default mongoose.model('VolunteerLog', volunteerLogSchema)
