import mongoose from 'mongoose'

const mentorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: { type: String, trim: true, maxlength: 500 },
    expertise: [{ type: String, trim: true }], // ["DSA", "Web Dev", "Placements"]
    domains: [{
      type: String,
      enum: ['academics', 'placements', 'projects', 'competitive-programming',
             'research', 'higher-studies', 'internships', 'career-guidance',
             'soft-skills', 'entrepreneurship'],
    }],
    experience: { type: String, trim: true }, // "Placed at Google", "2nd year CP enthusiast"
    availability: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    maxMentees: { type: Number, default: 5 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    linkedIn: String,
    achievements: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

mentorProfileSchema.index({ domains: 1, isActive: 1 })

export default mongoose.model('MentorProfile', mentorProfileSchema)