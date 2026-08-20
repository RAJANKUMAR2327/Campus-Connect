import mongoose from 'mongoose'

const placementStatSchema = new mongoose.Schema(
  {
    college: { type: String, required: true },
    year: { type: Number, required: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    package: { type: Number }, // in LPA
    branch: { type: String, trim: true },
    studentCount: { type: Number, default: 1 },
    type: {
      type: String,
      enum: ['oncampus', 'offcampus', 'internship'],
      default: 'oncampus',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

export default mongoose.model('PlacementStat', placementStatSchema)