import mongoose from 'mongoose'

const lostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
    category: {
      type: String,
      enum: ['electronics', 'books', 'clothing', 'accessories', 'documents', 'other'],
      default: 'other',
    },
    location: {
      type: String,
      trim: true, // e.g. "Near C-block", "Library entrance"
    },
    date: {
      type: Date,
      default: Date.now,
    },
    images: [String], // Cloudinary URLs
    contact: {
      type: String,
      trim: true, // phone or any contact info
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

lostFoundSchema.index({ title: 'text', description: 'text' })
lostFoundSchema.index({ type: 1, status: 1, category: 1 })

export default mongoose.model('LostFound', lostFoundSchema)