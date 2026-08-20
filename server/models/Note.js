import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
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
      maxlength: [500, 'Description too long'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true, // e.g. "Operating Systems", "DBMS"
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true, // e.g. "CSE", "ECE"
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1,
      max: 5,
    },
    semester: {
      type: Number,
      min: 1,
      max: 10,
    },
    tags: [{ type: String, trim: true }], // ["mid-sem", "important", "unit-4"]

    // Cloudinary file info
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String, // needed to delete from Cloudinary
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'doc'],
      default: 'pdf',
    },
    fileSizeKB: Number,
    pageCount: Number,

    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downloadCount: { type: Number, default: 0 },

    isApproved: { type: Boolean, default: true }, // set false if admin moderation needed
  },
  { timestamps: true }
)

// Full-text search index
noteSchema.index({ title: 'text', subject: 'text', tags: 'text' })

// Compound index for fast filtering
noteSchema.index({ branch: 1, year: 1, subject: 1 })

export default mongoose.model('Note', noteSchema)