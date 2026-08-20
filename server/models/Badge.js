import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // emoji
  category: {
    type: String,
    enum: ['notes', 'events', 'community', 'placement', 'streak', 'special'],
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  xpReward: { type: Number, default: 50 },
  criteria: {
    type: { type: String }, // "count" | "streak" | "milestone"
    field: String, // e.g. "notesUploaded"
    threshold: Number,
  },
})

export default mongoose.model('Badge', badgeSchema)