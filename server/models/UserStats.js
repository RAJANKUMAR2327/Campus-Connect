import mongoose from 'mongoose'

const userStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    xp: { type: Number, default: 0 },
    // CORRECTNESS FIX (DIGEST-01): tracks XP earned since the user's last
    // digest email was sent, reset to 0 by the digest cron jobs after
    // each send (see index.js). This replaces deriving "XP earned this
    // period" by filtering xpHistory by date — xpHistory is capped at
    // the most recent 100 entries, so a very active user (100+
    // XP-earning actions within a single digest window) would have had
    // older-but-still-in-window entries silently evicted before the
    // digest ran, undercounting their reported weekly XP. This
    // accumulator isn't subject to that cap.
    periodXp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    badges: [{
      badgeId: String,
      earnedAt: { type: Date, default: Date.now },
    }],
    stats: {
      notesUploaded: { type: Number, default: 0 },
      notesDownloaded: { type: Number, default: 0 },
      eventsAttended: { type: Number, default: 0 },
      eventsCreated: { type: Number, default: 0 },
      postsCreated: { type: Number, default: 0 },
      commentsPosted: { type: Number, default: 0 },
      quizzesCompleted: { type: Number, default: 0 },
      questionsAdded: { type: Number, default: 0 },
      lostFoundResolved: { type: Number, default: 0 },
      mentorshipSessions: { type: Number, default: 0 },
      clubsJoined: { type: Number, default: 0 },
      studyGroupsJoined: { type: Number, default: 0 },
    },
    xpHistory: [{
      action: String,
      xp: Number,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
)

userStatsSchema.index({ xp: -1 })

export default mongoose.model('UserStats', userStatsSchema)