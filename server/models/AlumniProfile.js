import mongoose from 'mongoose'

const alumniProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    graduationYear: { type: Number, required: true },
    currentCompany: { type: String, trim: true },
    currentRole: { type: String, trim: true },
    industry: {
      type: String,
      trim: true,
      enum: ['software', 'core-engineering', 'consulting', 'finance', 'government',
             'research', 'higher-studies', 'entrepreneurship', 'other'],
      default: 'software',
    },
    location: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    linkedIn: { type: String, trim: true },
    willingToMentor: { type: Boolean, default: true },
    skills: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

alumniProfileSchema.index({ industry: 1, graduationYear: 1 })

export default mongoose.model('AlumniProfile', alumniProfileSchema)
