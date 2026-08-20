import mongoose from 'mongoose'

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description too long'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    negotiable: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['books', 'electronics', 'clothing', 'furniture', 'cycles', 'other'],
      default: 'other',
    },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    images: [String], // Cloudinary URLs
    contact: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

listingSchema.index({ title: 'text', description: 'text' })
listingSchema.index({ category: 1, status: 1, price: 1 })

export default mongoose.model('Listing', listingSchema)