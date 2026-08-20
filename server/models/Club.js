import mongoose from 'mongoose'

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      maxlength: [80, 'Name too long'],
    },
    tagline: { type: String, trim: true, maxlength: 120 },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description too long'],
    },
    category: {
      type: String,
      enum: ['technical', 'cultural', 'sports', 'literary', 'social', 'entrepreneurship', 'arts', 'other'],
      default: 'other',
    },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    coverColor: { type: String, default: '#6366f1' },

    college: { type: String, trim: true },
    founded: { type: Number },

    president: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coreTeam: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      position: { type: String, trim: true }, // "Vice President", "Tech Lead", etc.
    }],
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now },
    }],

    socialLinks: {
      instagram: String,
      linkedin: String,
      website: String,
      whatsapp: String,
    },

    isRecruiting: { type: Boolean, default: false },
    recruitmentForm: { type: String }, // external form link
    recruitmentDeadline: { type: Date },

    achievements: [{ type: String, trim: true }],

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },

    isVerified: { type: Boolean, default: false }, // verified by admin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

clubSchema.index({ name: 'text', description: 'text', tagline: 'text' })
clubSchema.index({ category: 1, college: 1 })

export default mongoose.model('Club', clubSchema)