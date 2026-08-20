import mongoose from 'mongoose'

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: {
      type: String,
      enum: ['programming', 'frameworks', 'databases', 'tools', 'soft-skills', 'design', 'other'],
      default: 'other',
    },
    icon: { type: String, default: '⚡' },
  },
  { timestamps: true }
)

export default mongoose.model('Skill', skillSchema)