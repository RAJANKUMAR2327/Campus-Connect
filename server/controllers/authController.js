import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import GpaRecord from '../models/GpaRecord.js'
import AttendanceSubject from '../models/AttendanceSubject.js'
import Task from '../models/Task.js'
import DigestPreference from '../models/DigestPreference.js'
import PushSubscription from '../models/PushSubscription.js'
import UserStats from '../models/UserStats.js'
import Notification from '../models/Notification.js'
import { sendVerificationEmail, sendPasswordResetEmail, sendAccountExistsEmail } from '../utils/email.js'
import { isPlainString } from '../utils/validation.js'
import { sendServerError } from '../utils/errorResponse.js'
import { isAllowedEmailDomain } from '../utils/allowedEmailDomains.js'

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })

// SECURITY FIX (AUTH-03): verifyToken/resetPasswordToken used to be stored
// in the DB exactly as generated — a raw, random hex string. They're
// already protected by select:false (never returned in normal queries),
// but that's the only layer of defense: if the DB were ever exposed (a
// backup leak, misconfigured access, a bug elsewhere), the stored values
// were directly usable to verify an email or reset a password with no
// extra step required. Standard practice (e.g. what Django does) is to
// hash the token before storing it and compare hashes on lookup — the raw
// token is still what's emailed to the user and what appears in the URL,
// but the DB never holds a value that's independently usable on its own.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

// SECURITY FIX: every value below that ever reaches a Mongoose query filter
// (email, token) MUST be a plain string first — see utils/validation.js for
// why. This was most severe on resetPassword: an attacker could trigger
// forgotPassword for a victim's email (no inbox access needed), then call
// resetPassword?token[$ne]= to match "any user with a pending reset token"
// and overwrite that user's password — full account takeover with no
// knowledge of the real token. isPlainString() closes that off at every
// call site that builds a query from user input.

// ─── REGISTER ─────────────────────────────────────────────────────
// SECURITY FIX: email verification is now actually enforced. Previously
// every new account was auto-verified (isVerified: true) and the
// verification email was never sent, so the isVerified gate at login
// was decorative. If email sending isn't configured (no EMAIL_HOST in
// this environment), we fail soft to the old auto-verified behavior so
// local/dev setups without SMTP configured still work — but we log a
// warning so this doesn't go unnoticed in production.
export const register = async (req, res) => {
  try {
    const { name, email, password, branch, year, college } = req.body

    if (!isPlainString(email)) {
      return res.status(400).json({ message: 'A valid email is required.' })
    }

    if (!isAllowedEmailDomain(email)) {
      return res.status(400).json({ message: 'Registration is restricted to specific email domains. Please use your college email.' })
    }

    const emailConfigured = !!process.env.EMAIL_HOST

    // SECURITY FIX (AUTH-05): this used to return a distinct 400
    // ("Email already registered.") when the email was already in use —
    // revealing account existence through the API response, inconsistent
    // with login/forgotPassword, which both deliberately use identical
    // wording regardless of outcome. The response is now the same either
    // way; if the email is already registered, the real account owner is
    // notified privately by email instead (see sendAccountExistsEmail),
    // mirroring exactly how forgotPassword already handles this same
    // distinction — a real difference in what happens, but not one an
    // attacker can observe through the HTTP response.
    const existing = await User.findOne({ email })
    if (existing) {
      if (emailConfigured) {
        try {
          await sendAccountExistsEmail(email)
        } catch (mailErr) {
          console.error('Failed to send account-exists notice:', mailErr.message)
        }
      }
      return res.status(201).json({
        message: emailConfigured
          ? 'Registration successful! Please check your email to verify your account.'
          : 'Registration successful!',
      })
    }

    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const user = await User.create({
      name, email, password, branch, year, college,
      verifyToken: hashToken(verifyToken), verifyTokenExpiry,
      isVerified: !emailConfigured, // only auto-verify when we can't actually send a verification email
    })

    if (emailConfigured) {
      try {
        await sendVerificationEmail(email, verifyToken)
      } catch (mailErr) {
        console.error('Failed to send verification email:', mailErr.message)
      }
    } else {
      console.warn('EMAIL_HOST not set — skipping email verification, auto-verifying new user.')
    }

    res.status(201).json({
      message: emailConfigured
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful!',
    })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query
    if (!isPlainString(token)) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' })
    }
    // NEW: select:false hides this field by default now — must ask for it
    // explicitly since we need to clear it below.
    const user = await User.findOne({
      verifyToken: hashToken(token),
      verifyTokenExpiry: { $gt: Date.now() },
    }).select('+verifyToken +verifyTokenExpiry')
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' })
    }
    user.isVerified = true
    user.verifyToken = undefined
    user.verifyTokenExpiry = undefined
    await user.save()
    res.json({ message: 'Email verified successfully! You can now log in.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!isPlainString(email) || !isPlainString(password)) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' })
    }

    // NEW: logging back in reactivates a deactivated account (the standard
    // pattern — Instagram/Twitter-style). This is the ONLY way back in,
    // since `protect` rejects every other request from a deactivated user.
    let reactivated = false
    if (user.isDeactivated) {
      user.isDeactivated = false
      await user.save()
      reactivated = true
    }

    const token = signToken(user._id)
    res.json({
      token,
      reactivated,
      message: reactivated ? 'Welcome back! Your account has been reactivated.' : undefined,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        year: user.year,
        college: user.college,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── DEACTIVATE ACCOUNT (soft, reversible) ─────────────────────────
// Distinct from deleteAccount: no data is removed. The account simply
// can't be used (protect middleware rejects it) and disappears from other
// users' view (getPublicProfile / chat search treat it like a blocked
// user) until the owner logs back in, which auto-reactivates it.
export const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body
    if (!password) {
      return res.status(400).json({ message: 'Password is required to deactivate your account.' })
    }

    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password.' })
    }

    user.isDeactivated = true
    await user.save()

    res.json({ message: 'Account deactivated. Log in again anytime to reactivate it.' })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── GET ME ───────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({ user })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE PROFILE ───────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, branch, year, college } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, branch, year, college },
      { new: true, runValidators: true }
    )
    res.json({ message: 'Profile updated!', user })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!isPlainString(email)) {
      // Same generic response as "no such user" — don't let the shape of
      // the input distinguish "malformed" from "doesn't exist" either.
      return res.json({ message: 'If that email exists, a reset link has been sent.' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' })
    }
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = hashToken(resetToken)
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()
    // BUG FIX: this used to call sendPasswordResetEmail unconditionally,
    // with no try/catch — unlike register(), which already handles "email
    // isn't configured" gracefully. In any environment without EMAIL_HOST
    // set (local dev, this test suite, a misconfigured deploy), that
    // throw would propagate to the outer catch and turn every password
    // reset request into a 500, even though the token was already
    // generated and saved successfully. The token is still valid and
    // usable (e.g. by a developer reading it directly, or once email is
    // configured) regardless of whether the send itself succeeds.
    try {
      await sendPasswordResetEmail(email, resetToken)
    } catch (mailErr) {
      console.error('Failed to send password reset email:', mailErr.message)
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.query
    const { password } = req.body
    if (!isPlainString(token) || !isPlainString(password)) {
      return res.status(400).json({ message: 'Invalid or expired reset link.' })
    }
    // NEW: select:false hides this field by default now — must ask for it
    // explicitly since we need to clear it below.
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpiry: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpiry')
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link.' })
    }
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined
    await user.save()
    res.json({ message: 'Password reset successful. You can now log in.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image.' })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    )

    res.json({ message: 'Avatar updated!', avatar: user.avatar, user })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE ACCOUNT ───────────────────────────────────────────────
// SECURITY FIX: password is now REQUIRED (previously optional — a stolen
// or idle token alone was enough to permanently delete an account).
// DATA-INTEGRITY FIX: account deletion used to be a hard
// `findByIdAndDelete`, which left dangling references throughout the
// database — post authors, conversation participants, club/study-group
// members, message senders, notification actors — all pointing at a
// document that no longer existed. `.populate()` on any of those returns
// null, and the frontend has no error boundary to catch what happens next:
// a single deleted account can crash the whole Feed page for anyone who
// still has one of that user's posts in view.
//
// This now anonymizes the account in place (the common "[deleted user]"
// pattern) instead of removing the document — see User.js's isDeleted
// field — so every existing reference keeps resolving to a real,
// populated (just anonymized) user, and login/protect/the socket
// handshake all reject the account going forward regardless.
//
// What's actually removed vs. anonymized:
//   - The User document itself: anonymized, not deleted, so shared
//     content (posts, comments, messages, memberships) keeps rendering.
//   - This user's id is pulled out of every OTHER user's followers/
//     following arrays — those lists are specifically about relationships
//     with real people, unlike e.g. a post's author field, so there's no
//     reason to leave a "Deleted User" entry sitting in someone's list.
//   - Purely personal, single-owner records that no other user's UI ever
//     depends on (GPA, attendance, tasks, digest/push preferences, XP
//     stats, this user's own notification inbox) are hard-deleted — no
//     reason to retain a deleted account's private academic records
//     indefinitely, and nothing else references them.
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete your account.' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password.' })
    }

    const userId = user._id

    user.name = 'Deleted User'
    user.email = `deleted-${userId}@deleted.campusconnect.local`
    user.avatar = ''
    user.branch = null
    user.college = null
    user.year = null
    user.blockedUsers = []
    user.followers = []
    user.following = []
    user.privacy = { profileVisibility: 'college', whoCanMessage: 'nobody', showEmail: false }
    // Overwritten with a random, never-guessable value — belt-and-suspenders
    // alongside the isDeleted checks in protect/login/socket auth, in case
    // one of those is ever bypassed or refactored incorrectly later.
    user.password = crypto.randomBytes(32).toString('hex')
    user.isDeleted = true
    user.deletedAt = new Date()
    user.isVerified = false
    user.verifyToken = null
    user.verifyTokenExpiry = null
    user.resetPasswordToken = null
    user.resetPasswordExpiry = null
    await user.save()

    // Bounded (2 queries), cheap cleanup of the one reference type that's
    // genuinely about a relationship with a real person rather than
    // authorship of shared content.
    await User.updateMany({ followers: userId }, { $pull: { followers: userId } })
    await User.updateMany({ following: userId }, { $pull: { following: userId } })

    // Hard-delete purely personal, single-owner data with no other user
    // depending on it.
    await Promise.all([
      GpaRecord.deleteMany({ user: userId }),
      AttendanceSubject.deleteMany({ user: userId }),
      Task.deleteMany({ user: userId }),
      DigestPreference.deleteMany({ user: userId }),
      PushSubscription.deleteMany({ user: userId }),
      UserStats.deleteMany({ user: userId }),
      Notification.deleteMany({ recipient: userId }),
    ])

    res.json({ message: 'Account deleted successfully.' })
  } catch (err) {
    sendServerError(res, err)
  }
}