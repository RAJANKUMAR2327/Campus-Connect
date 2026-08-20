import mongoose from 'mongoose'

const callSessionSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: Date,
      leftAt: Date,
    }],
    type: {
      type: String,
      enum: ['mentorship', 'study-group', 'one-on-one', 'club'],
      default: 'one-on-one',
    },
    sourceId: { type: mongoose.Schema.Types.ObjectId }, // mentorshipRequest/studyGroup/club id
    status: {
      type: String,
      enum: ['ringing', 'active', 'ended', 'missed'],
      default: 'ringing',
    },
    startedAt: Date,
    endedAt: Date,
    duration: Number, // seconds
  },
  { timestamps: true }
)

export default mongoose.model('CallSession', callSessionSchema)