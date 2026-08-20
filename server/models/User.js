import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
    branch: {
      type: String,
      trim: true, // e.g. "CSE", "ECE", "Mechanical"
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    college: {
      type: String,
      trim: true, // e.g. "BITS Pilani"
    },
    avatar: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // SECURITY FIX: these grant password-reset/email-verification capability
    // on their own (no password needed) — they're credentials, not display
    // data. Previously had no select:false, so GET /api/auth/me and the
    // admin user list both returned them in full to whoever fetched the
    // user document. select:false means every query now excludes them by
    // default; call .select('+resetPasswordToken') etc. explicitly in the
    // one or two controllers that actually need to read them.
    verifyToken: { type: String, select: false },
    verifyTokenExpiry: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },

    // ─── PRIVACY & BLOCKING (new) ──────────────────────────────────
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['everyone', 'college', 'connections'], // 'connections' reserved for a future follow/connect system
        default: 'college',
      },
      whoCanMessage: {
        type: String,
        enum: ['everyone', 'college', 'nobody'],
        default: 'everyone',
      },
      showEmail: { type: Boolean, default: false },
    },
    // Users this account has blocked. Blocking is one-directional and
    // symmetric in effect: a blocked user can't message/see-online-status
    // of the blocker, and the blocker won't see the blocked user's content
    // surfaced to them either (enforced in controllers, not at the DB layer).
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeactivated: { type: Boolean, default: false },

    // SECURITY/DATA-INTEGRITY FIX: account deletion used to be a hard
    // `findByIdAndDelete`, which left every other collection's reference to
    // this user (post authors, conversation participants, club/study-group
    // members, follower/following lists, message senders, etc.) pointing
    // at a document that no longer existed. `.populate()` on any of those
    // then returns null, and the frontend has no error boundary — a
    // deleted user's old post can crash the entire Feed page for anyone
    // who still has it in view. Deletion now anonymizes the document in
    // place (like Reddit/many platforms' "[deleted]" pattern) instead of
    // removing it, so every existing reference keeps resolving to a real,
    // populated (just anonymized) document. See authController.deleteAccount.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // ─── FOLLOW / CONNECT SYSTEM (new) ─────────────────────────────
    // One-directional follow graph (like Twitter/Instagram, not a mutual
    // "friend request"). "Connections" for the purposes of
    // privacy.profileVisibility = 'connections' means MUTUAL follows
    // (both directions) — see followController.isConnection().
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

userSchema.index({ blockedUsers: 1 })
userSchema.index({ followers: 1 })
userSchema.index({ following: 1 })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare entered password with hashed
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

// True if this user has blocked otherUserId (either as an ObjectId or string)
userSchema.methods.hasBlocked = function (otherUserId) {
  return this.blockedUsers.some((id) => id.toString() === otherUserId.toString())
}

// True if this user is following otherUserId
userSchema.methods.isFollowing = function (otherUserId) {
  return this.following.some((id) => id.toString() === otherUserId.toString())
}

export default mongoose.model('User', userSchema)