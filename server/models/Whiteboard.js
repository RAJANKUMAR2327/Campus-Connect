import mongoose from 'mongoose'

const strokeSchema = new mongoose.Schema({
  id: String,
  tool: { type: String, enum: ['pen', 'eraser', 'rectangle', 'circle', 'line', 'text'], default: 'pen' },
  color: String,
  width: Number,
  points: [{ x: Number, y: Number }], // for pen/eraser strokes
  startX: Number, startY: Number, endX: Number, endY: Number, // for shapes
  text: String, fontSize: Number, // for text tool
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
})

const whiteboardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled Board' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now },
    }],
    strokes: [strokeSchema],
    backgroundColor: { type: String, default: '#ffffff' },
    shareCode: { type: String, unique: true },
    isPublic: { type: Boolean, default: false },
    sourceType: {
      type: String,
      enum: ['standalone', 'study-group', 'mentorship', 'club'],
      default: 'standalone',
    },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

whiteboardSchema.index({ owner: 1 })
whiteboardSchema.index({ 'collaborators.user': 1 })

export default mongoose.model('Whiteboard', whiteboardSchema)