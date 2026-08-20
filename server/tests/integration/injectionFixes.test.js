import '../env.setup.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import crypto from 'crypto'

// AUTH-03: reset/verify tokens are now hashed before storage, so the DB
// no longer holds a directly-usable raw token (see authController.js's
// hashToken). Tests that need the real raw token (e.g. to prove a
// legitimate reset with the correct token still works) have to capture it
// at the point it's actually sent, not read it back out of the DB.
// Mocking the email module — rather than requiring real SMTP config in
// this test environment — lets us intercept exactly that value while
// still exercising the real controller code end-to-end.
vi.mock('../../utils/email.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendAccountExistsEmail: vi.fn().mockResolvedValue(undefined),
}))
import { sendPasswordResetEmail, sendVerificationEmail, sendAccountExistsEmail } from '../../utils/email.js'

import app from '../../app.js'
import User from '../../models/User.js'
import JobApplication from '../../models/JobApplication.js'
import UserStats from '../../models/UserStats.js'
import Event from '../../models/Event.js'
import SeatBooking from '../../models/SeatBooking.js'
import CallSession from '../../models/CallSession.js'
import GpaRecord from '../../models/GpaRecord.js'
import Badge from '../../models/Badge.js'
import { awardXP } from '../../utils/xpEngine.js'
import { buildDigestData } from '../../utils/digestBuilder.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setupTestDB.js'

// See tests/setupTestDB.js for why these tests require normal internet
// access to run (mongodb-memory-server downloads a real mongod binary on
// first use) and could not be executed inside the sandboxed environment
// these changes were authored in.

beforeAll(async () => {
  await setupTestDB()
})

afterAll(async () => {
  await teardownTestDB()
})

beforeEach(async () => {
  await clearTestDB()
})

// ─── NoSQL operator injection (SECURITY FIX) ─────────────────────────
//
// authController.js used to pass `email`/`token` straight from req.body /
// req.query into Mongoose `findOne` filters with no type check. Since
// Express's default query parser (`qs`) turns bracket notation into nested
// objects, and JSON bodies can contain objects for any field, an attacker
// could send e.g. `?token[$ne]=` or `{"email":{"$ne":null}}` and have Mongo
// interpret it as an operator instead of a value — matching an arbitrary
// document rather than failing safely.
//
// The most severe instance: an attacker could call forgotPassword for a
// victim's email (no inbox access required), then call
// `resetPassword?token[$ne]=` to match "any user with a currently pending,
// non-expired reset token" and overwrite THAT user's password — full
// account takeover with zero knowledge of the real reset token.
//
// These tests reproduce the exact exploit shapes against the live route
// stack (not just unit-testing the guard in isolation) and assert they are
// rejected with 400 and have no effect on any user's data.

const victim = {
  name: 'Priya Nair',
  email: 'priya@college.edu',
  password: 'correcthorse1',
  branch: 'ECE',
  year: 3,
  college: 'BITS Pilani',
}

const attacker = {
  name: 'Rohan Mehta',
  email: 'rohan@college.edu',
  password: 'correcthorse2',
  branch: 'ECE',
  year: 3,
  college: 'BITS Pilani',
}

const registerAndVerify = async (payload) => {
  await request(app).post('/api/auth/register').send(payload)
  // EMAIL_HOST is intentionally unset in tests, so register() auto-verifies.
}

describe('NoSQL operator injection (SECURITY FIX)', () => {
  describe('POST /api/auth/register', () => {
    it('rejects an object-typed email instead of querying with it', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...victim, email: { $ne: null } })
      expect(res.status).toBe(400)
      expect(await User.countDocuments({})).toBe(0)
    })
  })

  describe('POST /api/auth/login', () => {
    it('rejects an object-typed email (would otherwise match the first user matching the operator)', async () => {
      await registerAndVerify(victim)
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: { $gt: '' }, password: 'irrelevant' })
      expect(res.status).toBe(400)
      expect(res.body.token).toBeUndefined()
    })
  })

  describe('POST /api/auth/forgot-password + GET/POST reset-password — the critical exploit chain', () => {
    it('the full documented exploit chain is closed end-to-end', async () => {
      await registerAndVerify(victim)
      await registerAndVerify(attacker)

      // Step 1: attacker triggers a real reset token for the victim
      // (forgotPassword is intentionally public — no inbox proof required).
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: victim.email })

      const victimBefore = await User.findOne({ email: victim.email }).select('+resetPasswordToken')
      expect(victimBefore.resetPasswordToken).toBeTruthy() // token really is pending

      // Step 2: attacker tries to hijack it via operator injection instead
      // of the real token — this is the exact previously-exploitable call.
      const res = await request(app)
        .post('/api/auth/reset-password')
        .query({ token: { $ne: '' } })
        .send({ password: 'attackerchosenpassword' })

      expect(res.status).toBe(400)

      // Victim's password must be untouched, and must NOT be the
      // attacker-chosen one.
      const victimAfter = await User.findOne({ email: victim.email }).select('+password')
      const loginWithOriginalPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: victim.email, password: victim.password })
      const loginWithAttackerPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: victim.email, password: 'attackerchosenpassword' })

      expect(loginWithOriginalPassword.status).toBe(200) // still works
      expect(loginWithAttackerPassword.status).toBe(401) // attacker's guess fails
    })

    it('a legitimate reset with the real token still works (guard is not overly strict)', async () => {
      await registerAndVerify(victim)
      sendPasswordResetEmail.mockClear()
      await request(app).post('/api/auth/forgot-password').send({ email: victim.email })

      // Capture the RAW token from the (mocked) email send — the DB now
      // only holds its SHA-256 hash (AUTH-03), so reading resetPasswordToken
      // back out of the User document would give a value that can no
      // longer be used as the actual reset token.
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
      const rawToken = sendPasswordResetEmail.mock.calls[0][1]
      expect(rawToken).toBeTruthy()

      const user = await User.findOne({ email: victim.email }).select('+resetPasswordToken')
      expect(user.resetPasswordToken).not.toBe(rawToken) // stored value is the hash, not the raw token

      const res = await request(app)
        .post('/api/auth/reset-password')
        .query({ token: rawToken })
        .send({ password: 'brandNewPassword1' })

      expect(res.status).toBe(200)
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: victim.email, password: 'brandNewPassword1' })
      expect(login.status).toBe(200)
    })
  })

  // ─── AUTH-03: reset/verify tokens hashed at rest (SECURITY FIX) ────
  //
  // resetPasswordToken/verifyToken used to be stored exactly as generated
  // — a raw, directly-usable value. Now hashed with SHA-256 before
  // storage (see authController.js's hashToken), so a DB exposure alone
  // no longer hands out working reset/verify tokens.
  describe('Reset tokens are hashed at rest, not stored raw (SECURITY FIX)', () => {
    const tokenVictim = {
      name: 'Aarav Bose', email: 'aarav@college.edu', password: 'correcthorse25',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }

    it('the stored resetPasswordToken is the SHA-256 hash of the raw token, not the raw token itself', async () => {
      await request(app).post('/api/auth/register').send(tokenVictim)
      sendPasswordResetEmail.mockClear()
      await request(app).post('/api/auth/forgot-password').send({ email: tokenVictim.email })

      const rawToken = sendPasswordResetEmail.mock.calls[0][1]
      const user = await User.findOne({ email: tokenVictim.email }).select('+resetPasswordToken')

      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      expect(user.resetPasswordToken).toBe(expectedHash)
      expect(user.resetPasswordToken).not.toBe(rawToken)
      expect(user.resetPasswordToken).toHaveLength(64) // hex-encoded SHA-256 is always 64 chars
    })

    it('the raw stored value (if leaked) cannot itself be used as the reset token', async () => {
      await request(app).post('/api/auth/register').send(tokenVictim)
      await request(app).post('/api/auth/forgot-password').send({ email: tokenVictim.email })
      const user = await User.findOne({ email: tokenVictim.email }).select('+resetPasswordToken')

      // Simulates exactly the scenario this fix defends against: an
      // attacker who has obtained the stored DB value directly (e.g. a
      // leaked backup) tries to use it as-is.
      const res = await request(app)
        .post('/api/auth/reset-password')
        .query({ token: user.resetPasswordToken })
        .send({ password: 'shouldNotWork1' })

      expect(res.status).toBe(400)
    })
  })

  // ─── AUTH-05: registration account enumeration (SECURITY FIX) ──────
  //
  // register() used to return a distinct "Email already registered."
  // response when the email was taken — inconsistent with login/
  // forgotPassword, which both use identical wording regardless of
  // outcome. The response is now the same either way; the real account
  // owner is notified privately by email instead (mirroring exactly how
  // forgotPassword already handles this same distinction).
  describe('POST /api/auth/register — account enumeration (SECURITY FIX)', () => {
    const existingUser = {
      name: 'Kiran Patel', email: 'kiran@college.edu', password: 'correcthorse26',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }

    it('returns the exact same status and body whether or not the email is already registered', async () => {
      const newAccountRes = await request(app).post('/api/auth/register').send(existingUser)

      const duplicateRes = await request(app).post('/api/auth/register').send(existingUser)

      expect(duplicateRes.status).toBe(newAccountRes.status)
      expect(duplicateRes.body).toEqual(newAccountRes.body)
    })

    it('does not create a duplicate account when the email is already registered', async () => {
      await request(app).post('/api/auth/register').send(existingUser)
      await request(app).post('/api/auth/register').send(existingUser)

      const count = await User.countDocuments({ email: existingUser.email })
      expect(count).toBe(1)
    })

    it('notifies the real account owner privately instead of exposing it via the response (when email is configured)', async () => {
      await request(app).post('/api/auth/register').send(existingUser)
      sendVerificationEmail.mockClear()
      sendAccountExistsEmail.mockClear()

      const originalEmailHost = process.env.EMAIL_HOST
      process.env.EMAIL_HOST = 'smtp.example.com' // simulate a configured environment
      const res = await request(app).post('/api/auth/register').send(existingUser)
      process.env.EMAIL_HOST = originalEmailHost

      expect(sendAccountExistsEmail).toHaveBeenCalledWith(existingUser.email)
      expect(sendVerificationEmail).not.toHaveBeenCalled() // no new account, no verification email
      expect(res.body.message).toMatch(/check your email/i)
    })
  })

  describe('GET /api/auth/verify-email', () => {
    it('rejects an object-typed token instead of querying with it', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: { $ne: '' } })
      expect(res.status).toBe(400)
    })
  })
})

// ─── INJ-02: library QR check-in injection (SECURITY FIX) ────────────
//
// libraryController.js's checkIn used to pass `qrCode` straight from
// req.body into `SeatBooking.findOne({ qrCode, status: 'upcoming' })` with
// no type check. A crafted {"qrCode": {"$ne": null}} body would match an
// arbitrary "upcoming" booking rather than the one the real QR code
// identifies — letting anyone check in to (and thereby occupy/hijack)
// another student's seat reservation without ever seeing their code.
describe('POST /api/library/check-in — QR operator injection (SECURITY FIX)', () => {
  const student = {
    name: 'Kavya Iyer', email: 'kavya@college.edu', password: 'correcthorse3',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  const registerAndLogin = async (payload) => {
    await request(app).post('/api/auth/register').send(payload)
    const login = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })
    return login.body.token
  }

  it('rejects an object-typed qrCode instead of matching an arbitrary upcoming booking', async () => {
    const token = await registerAndLogin(student)

    // Create a real zone + booking so an "upcoming" booking genuinely
    // exists in the collection — if the injection worked, this is exactly
    // the record it would hijack. (Self-promote to admin just to create
    // the zone fixture — createZone is admin-only; irrelevant to the bug
    // under test, which is on the student-facing check-in endpoint.)
    const selfAsAdmin = await User.findOne({ email: student.email })
    selfAsAdmin.role = 'admin'
    await selfAsAdmin.save()

    const zoneRes = await request(app)
      .post('/api/library/zones')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Silent Zone', type: 'silent', floor: '2', capacity: 4 })
    const zoneId = zoneRes.body.zone._id

    await request(app)
      .post('/api/library/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        zoneId, seatNumber: 'A1', date: '2099-01-01',
        startTime: '10:00', endTime: '11:00', purpose: 'Studying',
      })

    const res = await request(app)
      .post('/api/library/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrCode: { $ne: null } })

    expect(res.status).toBe(404) // rejected, not "matched something"
  })
})

// ─── INJ-03: job application mass assignment (SECURITY FIX) ──────────
//
// jobApplicationController.js's updateApplication used to do
// `Object.assign(application, req.body)`, writing every key in the request
// body directly onto the document — including `user`, which is not meant
// to be client-settable at all. An attacker updating their own application
// (passing the ownership check, since it's their own _id) could reassign
// it to another student's account, or overwrite statusHistory/
// interviewRounds wholesale, bypassing the dedicated endpoints meant to
// control those fields.
describe('PATCH /api/applications/:id — mass assignment (SECURITY FIX)', () => {
  const owner = {
    name: 'Dev Sharma', email: 'dev@college.edu', password: 'correcthorse4',
    branch: 'CSE', year: 3, college: 'BITS Pilani',
  }
  const victim = {
    name: 'Meera Rao', email: 'meera@college.edu', password: 'correcthorse5',
    branch: 'CSE', year: 3, college: 'BITS Pilani',
  }

  const registerAndLogin = async (payload) => {
    await request(app).post('/api/auth/register').send(payload)
    const login = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })
    return login.body.token
  }

  it('does not allow reassigning the application to another user via req.body.user', async () => {
    const ownerToken = await registerAndLogin(owner)
    const victimUser = await (async () => {
      await request(app).post('/api/auth/register').send(victim)
      return User.findOne({ email: victim.email })
    })()

    const created = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ company: 'Acme Corp', role: 'SWE Intern', type: 'internship', source: 'referral' })
    const appId = created.body.application._id

    await request(app)
      .patch(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ user: victimUser._id.toString(), company: 'Still Acme Corp' })

    const application = await JobApplication.findById(appId)
    expect(application.user.toString()).toBe((await User.findOne({ email: owner.email }))._id.toString())
    expect(application.company).toBe('Still Acme Corp') // legitimate field still updates
  })

  it('does not allow overwriting statusHistory wholesale via req.body', async () => {
    const ownerToken = await registerAndLogin(owner)

    const created = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ company: 'Beta Inc', role: 'Analyst', type: 'full-time', source: 'campus' })
    const appId = created.body.application._id
    const originalHistoryLength = created.body.application.statusHistory.length

    await request(app)
      .patch(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ statusHistory: [] })

    const application = await JobApplication.findById(appId)
    expect(application.statusHistory.length).toBe(originalHistoryLength)
  })
})

// ─── API-01: raw error-message leakage (SECURITY FIX) ────────────────
//
// Every controller used to do `res.status(500).json({ message: err.message
// })`, forwarding raw Mongoose/driver error text straight to the client —
// e.g. a CastError message like `Cast to ObjectId failed for value
// "not-a-valid-id" (type string) at path "_id" for model "JobApplication"`,
// which reveals internal schema/model naming. app.js's global handler
// already had a policy of only forwarding "safe" (explicitly marked)
// error messages, but no controller ever called next(err), so that policy
// never actually applied to anything a controller caught locally — which
// was every single error. sendServerError() (utils/errorResponse.js)
// applies that same policy from inside the controllers themselves.
describe('Raw error-message leakage (SECURITY FIX)', () => {
  const student2 = {
    name: 'Arjun Nair', email: 'arjun@college.edu', password: 'correcthorse6',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  it('a malformed ObjectId triggers a generic message, not the raw Mongoose CastError text', async () => {
    await request(app).post('/api/auth/register').send(student2)
    const login = await request(app).post('/api/auth/login').send({ email: student2.email, password: student2.password })
    const token = login.body.token

    const res = await request(app)
      .get('/api/applications/not-a-valid-object-id')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(500)
    // The old, leaking behavior would put "CastError", "ObjectId", or the
    // literal malformed value inside the message. None of that should be
    // visible to the client now.
    const message = res.body.message || ''
    expect(message).not.toMatch(/CastError/i)
    expect(message).not.toMatch(/ObjectId/i)
    expect(message).not.toMatch(/not-a-valid-object-id/i)
    expect(message).not.toMatch(/at path/i)
    // A generic, user-facing message should still be present.
    expect(message.length).toBeGreaterThan(0)
  })
})

// ─── DB-01: cascading account deletion (DATA-INTEGRITY FIX) ──────────
//
// deleteAccount used to be a hard `findByIdAndDelete`, leaving every other
// collection's reference to the user dangling. It now anonymizes the User
// document in place instead of removing it, so existing references (a
// post's author, a follower list, etc.) keep resolving to a real document.
describe('Account deletion no longer orphans references (DATA-INTEGRITY FIX)', () => {
  const deleter = {
    name: 'Sanjay Gupta', email: 'sanjay@college.edu', password: 'correcthorse7',
    branch: 'CSE', year: 4, college: 'BITS Pilani',
  }
  const follower = {
    name: 'Neha Verma', email: 'neha@college.edu', password: 'correcthorse8',
    branch: 'CSE', year: 4, college: 'BITS Pilani',
  }

  const registerAndLogin = async (payload) => {
    await request(app).post('/api/auth/register').send(payload)
    const login = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })
    return login.body.token
  }

  it('a post by a deleted user still populates a real (anonymized) author, not null', async () => {
    const deleterToken = await registerAndLogin(deleter)

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${deleterToken}`)
      .send({ content: 'A post that will outlive its author.', visibility: 'everyone' })
    const postId = created.body.post._id

    await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${deleterToken}`)
      .send({ password: deleter.password })

    const deletedUser = await User.findById(created.body.post.author._id).select('+password')
    expect(deletedUser).not.toBeNull() // document still exists
    expect(deletedUser.isDeleted).toBe(true)
    expect(deletedUser.name).toBe('Deleted User')
    expect(deletedUser.email).not.toBe(deleter.email) // no longer usable/identifying

    // A still-logged-in follower should be able to view the post without
    // the API crashing on a null author.
    const followerToken = await registerAndLogin(follower)
    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${followerToken}`)
    expect(feed.status).toBe(200)
    const post = feed.body.posts.find(p => p._id === postId)
    expect(post.author).not.toBeNull()
    expect(post.author.name).toBe('Deleted User')
  })

  it('removes the deleted user from other users\' followers/following lists', async () => {
    const deleterToken = await registerAndLogin(deleter)
    const followerToken = await registerAndLogin(follower)
    const deleterUser = await User.findOne({ email: deleter.email })

    await request(app)
      .post(`/api/users/${deleterUser._id}/follow`)
      .set('Authorization', `Bearer ${followerToken}`)

    await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${deleterToken}`)
      .send({ password: deleter.password })

    const followerUser = await User.findOne({ email: follower.email })
    expect(followerUser.following.map(String)).not.toContain(deleterUser._id.toString())
  })

  it('a deleted account can no longer log in', async () => {
    const deleterToken = await registerAndLogin(deleter)
    await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${deleterToken}`)
      .send({ password: deleter.password })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: deleter.email, password: deleter.password })
    expect(res.status).toBe(401)
  })
})

// ─── AUTH-01: getPostById visibility bypass (SECURITY FIX) ───────────
//
// Post.visibility (everyone/college/branch/year) was enforced by getFeed's
// query but not by getPostById, which fetched by ID with no visibility
// check — anyone with a post's ID could read it directly regardless of
// scope. Both endpoints now build their query from the same shared
// visibilityFilter() predicate in postController.js.
describe('GET /api/posts/:id — visibility bypass (SECURITY FIX)', () => {
  const yearThreeStudent = {
    name: 'Ishaan Kapoor', email: 'ishaan@college.edu', password: 'correcthorse9',
    branch: 'CSE', year: 3, college: 'BITS Pilani',
  }
  const yearOneStudent = {
    name: 'Ananya Das', email: 'ananya@college.edu', password: 'correcthorse10',
    branch: 'CSE', year: 1, college: 'BITS Pilani',
  }

  const registerAndLogin = async (payload) => {
    await request(app).post('/api/auth/register').send(payload)
    const login = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })
    return login.body.token
  }

  it('a "year"-scoped post is NOT directly fetchable by a different-year viewer via GET /api/posts/:id', async () => {
    const authorToken = await registerAndLogin(yearThreeStudent)
    const outsiderToken = await registerAndLogin(yearOneStudent)

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'Only my batch should see this.', visibility: 'year' })
    const postId = created.body.post._id

    // Confirms the pre-existing feed-level fix still holds (this is the
    // case authorizationFixes.test.js already covers).
    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${outsiderToken}`)
    expect(feed.body.posts.find(p => p._id === postId)).toBeUndefined()

    // This is the specific gap AUTH-01 closes: direct fetch by ID used to
    // bypass the above entirely.
    const direct = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
    expect(direct.status).toBe(404)
  })

  it('the author can still fetch their own scoped post directly', async () => {
    const authorToken = await registerAndLogin(yearThreeStudent)
    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'My own year-scoped post.', visibility: 'year' })
    const postId = created.body.post._id

    const direct = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authorToken}`)
    expect(direct.status).toBe(200)
  })

  it('a same-year viewer can still fetch the post directly (guard is not overly strict)', async () => {
    const authorToken = await registerAndLogin(yearThreeStudent)
    const sameYearPeer = {
      name: 'Rahul Singh', email: 'rahul@college.edu', password: 'correcthorse11',
      branch: 'CSE', year: 3, college: 'BITS Pilani',
    }
    const peerToken = await registerAndLogin(sameYearPeer)

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'Same batch should see this.', visibility: 'year' })
    const postId = created.body.post._id

    const direct = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${peerToken}`)
    expect(direct.status).toBe(200)
  })
})

// ─── DB-04: ATTEND_EVENT XP dead code (BUG FIX) ───────────────────────
//
// eventController.js's toggleAttendance used to have its awardXP() call
// sitting *after* an unconditional `return` inside the "event is full"
// branch — unreachable dead code. RSVPing to an event never actually
// awarded the (real, defined) ATTEND_EVENT XP. Moved to fire on a
// successful join instead.
describe('PATCH /api/events/:id/attend — XP award (BUG FIX)', () => {
  const attendee = {
    name: 'Tara Menon', email: 'tara@college.edu', password: 'correcthorse12',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  const registerAndLogin = async (payload) => {
    await request(app).post('/api/auth/register').send(payload)
    const login = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })
    return login.body.token
  }

  it('awards ATTEND_EVENT XP when a user successfully RSVPs', async () => {
    const organizerToken = await registerAndLogin(attendee)
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Tech Talk', description: 'A talk.', category: 'technical',
        date: '2099-01-01T10:00:00.000Z', endDate: '2099-01-01T12:00:00.000Z',
        venue: 'Auditorium',
      })
    const eventId = created.body.event._id
    const organizerId = (await User.findOne({ email: attendee.email }))._id

    const statsBefore = await UserStats.findOne({ user: organizerId })
    const xpBefore = statsBefore?.xp || 0
    const attendedBefore = statsBefore?.stats?.eventsAttended || 0

    const res = await request(app)
      .patch(`/api/events/${eventId}/attend`)
      .set('Authorization', `Bearer ${organizerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.attending).toBe(true)

    const statsAfter = await UserStats.findOne({ user: organizerId })
    expect(statsAfter.xp).toBe(xpBefore + 10) // XP_VALUES.ATTEND_EVENT
    expect(statsAfter.stats.eventsAttended).toBe(attendedBefore + 1)
  })

  it('does NOT award XP when the event is full (guard is not overly generous)', async () => {
    const organizerToken = await registerAndLogin(attendee)
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Tiny Workshop', description: 'Limited seats.', category: 'technical',
        date: '2099-01-01T10:00:00.000Z', endDate: '2099-01-01T12:00:00.000Z',
        venue: 'Room 101', maxParticipants: 1,
      })
    const eventId = created.body.event._id

    // Organizer fills the only slot.
    await request(app).patch(`/api/events/${eventId}/attend`).set('Authorization', `Bearer ${organizerToken}`)

    const latecomer = {
      name: 'Vikram Rao', email: 'vikram@college.edu', password: 'correcthorse13',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }
    const latecomerToken = await registerAndLogin(latecomer)
    const latecomerId = (await User.findOne({ email: latecomer.email }))._id

    const res = await request(app)
      .patch(`/api/events/${eventId}/attend`)
      .set('Authorization', `Bearer ${latecomerToken}`)
    expect(res.status).toBe(400) // event full

    const stats = await UserStats.findOne({ user: latecomerId })
    expect(stats?.xp || 0).toBe(0) // rejected attempt earns nothing
  })
})

// ─── DB-03: event RSVP capacity race condition (DATA-INTEGRITY FIX) ──
//
// toggleAttendance used to read the event, check capacity in application
// code, then separately push+save — three non-atomic steps. Two
// concurrent RSVPs near capacity could both pass the check before either
// committed. This is now a single atomic findOneAndUpdate with the
// capacity condition in the query filter itself. This test is the one
// that actually matters for a race-condition claim — the sequential tests
// above only prove the endpoint still works correctly one request at a
// time, which a broken TOCTOU implementation would also pass.
describe('PATCH /api/events/:id/attend — concurrent RSVP race (DATA-INTEGRITY FIX)', () => {
  const organizer = {
    name: 'Kabir Joshi', email: 'kabir@college.edu', password: 'correcthorse14',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  it('exactly one of two simultaneous RSVPs succeeds when only one seat remains', async () => {
    await request(app).post('/api/auth/register').send(organizer)
    const organizerLogin = await request(app).post('/api/auth/login').send({ email: organizer.email, password: organizer.password })
    const organizerToken = organizerLogin.body.token

    const created = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'One Seat Left', description: 'Race condition test.', category: 'technical',
        date: '2099-01-01T10:00:00.000Z', endDate: '2099-01-01T12:00:00.000Z',
        venue: 'Room 202', maxParticipants: 1,
      })
    const eventId = created.body.event._id

    // Two different students racing for the single remaining seat.
    const racerA = {
      name: 'Racer A', email: 'racera@college.edu', password: 'correcthorse15',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }
    const racerB = {
      name: 'Racer B', email: 'racerb@college.edu', password: 'correcthorse16',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }
    await request(app).post('/api/auth/register').send(racerA)
    await request(app).post('/api/auth/register').send(racerB)
    const tokenA = (await request(app).post('/api/auth/login').send({ email: racerA.email, password: racerA.password })).body.token
    const tokenB = (await request(app).post('/api/auth/login').send({ email: racerB.email, password: racerB.password })).body.token

    // Genuinely concurrent — both fired before either resolves.
    const [resA, resB] = await Promise.all([
      request(app).patch(`/api/events/${eventId}/attend`).set('Authorization', `Bearer ${tokenA}`),
      request(app).patch(`/api/events/${eventId}/attend`).set('Authorization', `Bearer ${tokenB}`),
    ])

    const statuses = [resA.status, resB.status].sort()
    expect(statuses).toEqual([200, 400]) // exactly one succeeds, one is rejected as full

    const finalEvent = await Event.findById(eventId)
    expect(finalEvent.attendees.length).toBe(1) // never exceeds maxParticipants, even under the race
  })
})

// ─── DB-02: library seat double-booking race condition (DATA-INTEGRITY FIX) ──
//
// createBooking's overlap check and the eventual SeatBooking.create() used
// to be two separate, non-atomic steps. This now acquires an advisory lock
// (models/BookingLock.js) keyed to the exact zone+seat+date before
// checking for overlaps, so a second concurrent request for the same seat
// can't slip in between the check and the write.
describe('POST /api/library/bookings — concurrent double-booking race (DATA-INTEGRITY FIX)', () => {
  it('exactly one of two simultaneous bookings for the same seat/time succeeds', async () => {
    const admin = {
      name: 'Library Admin', email: 'libadmin@college.edu', password: 'correcthorse17',
      branch: 'CSE', year: 4, college: 'BITS Pilani',
    }
    await request(app).post('/api/auth/register').send(admin)
    const adminUser = await User.findOne({ email: admin.email })
    adminUser.role = 'admin'
    await adminUser.save()
    const adminToken = (await request(app).post('/api/auth/login').send({ email: admin.email, password: admin.password })).body.token

    const zoneRes = await request(app)
      .post('/api/library/zones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Contested Zone', type: 'silent', floor: '3', capacity: 4, maxBookingHours: 4 })
    const zoneId = zoneRes.body.zone._id

    const racerA = {
      name: 'Book Racer A', email: 'bookracera@college.edu', password: 'correcthorse18',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }
    const racerB = {
      name: 'Book Racer B', email: 'bookracerb@college.edu', password: 'correcthorse19',
      branch: 'CSE', year: 2, college: 'BITS Pilani',
    }
    await request(app).post('/api/auth/register').send(racerA)
    await request(app).post('/api/auth/register').send(racerB)
    const tokenA = (await request(app).post('/api/auth/login').send({ email: racerA.email, password: racerA.password })).body.token
    const tokenB = (await request(app).post('/api/auth/login').send({ email: racerB.email, password: racerB.password })).body.token

    const bookingPayload = {
      zoneId, seatNumber: 'A1', date: '2099-06-01',
      startTime: '10:00', endTime: '11:00', purpose: 'Studying',
    }

    // Genuinely concurrent — both fired before either resolves.
    const [resA, resB] = await Promise.all([
      request(app).post('/api/library/bookings').set('Authorization', `Bearer ${tokenA}`).send(bookingPayload),
      request(app).post('/api/library/bookings').set('Authorization', `Bearer ${tokenB}`).send(bookingPayload),
    ])

    const statuses = [resA.status, resB.status].sort()
    // One succeeds (201); the other is rejected either as a genuine
    // overlap (400) or, if it arrived while the winner still held the
    // lock, as "try again" (409) — either is a correct rejection, unlike
    // the old behavior where both could succeed.
    expect(statuses[0]).toBe(201)
    expect([400, 409]).toContain(statuses[1])

    const bookingsForSeat = await SeatBooking.find({ zone: zoneId, seatNumber: 'A1', date: '2099-06-01' })
    expect(bookingsForSeat.length).toBe(1) // never double-booked, even under the race
  })
})

// ─── PRIV-01: call-initiation blocking bypass (PRIVACY FIX) ──────────
//
// createCallRoom used to build a call room from raw participantIds with
// zero blocking check — a user blocked by someone (or who had blocked
// them) could still ring them, bypassing the blocking system this
// codebase otherwise carefully enforces for profiles/followers/DMs (see
// followController.js). Now checks blocking in both directions against
// every requested participant before creating the room.
describe('POST /api/calls/room — blocking bypass (PRIVACY FIX)', () => {
  const caller = {
    name: 'Nikhil Verma', email: 'nikhil@college.edu', password: 'correcthorse20',
    branch: 'CSE', year: 3, college: 'BITS Pilani',
  }
  const blocker = {
    name: 'Pooja Shah', email: 'pooja@college.edu', password: 'correcthorse21',
    branch: 'CSE', year: 3, college: 'BITS Pilani',
  }

  const registerAndLogin = async (payload) => {
    await request(app).post('/api/auth/register').send(payload)
    const login = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })
    return login.body.token
  }

  it('cannot create a call room with someone who has blocked the caller', async () => {
    const callerToken = await registerAndLogin(caller)
    const blockerToken = await registerAndLogin(blocker)
    const callerId = (await User.findOne({ email: caller.email }))._id
    const blockerId = (await User.findOne({ email: blocker.email }))._id

    // blocker blocks caller
    await request(app)
      .post(`/api/privacy/block/${callerId}`)
      .set('Authorization', `Bearer ${blockerToken}`)

    const res = await request(app)
      .post('/api/calls/room')
      .set('Authorization', `Bearer ${callerToken}`)
      .send({ type: 'one-on-one', participantIds: [blockerId.toString()] })

    expect(res.status).toBe(403)
    const rooms = await CallSession.find({ initiator: callerId })
    expect(rooms.length).toBe(0) // no room was created
  })

  it('cannot create a call room with someone the caller has blocked', async () => {
    const callerToken = await registerAndLogin(caller)
    const otherToken = await registerAndLogin(blocker)
    const callerId = (await User.findOne({ email: caller.email }))._id
    const otherId = (await User.findOne({ email: blocker.email }))._id
    void otherToken

    // caller blocks the other user this time (reverse direction)
    await request(app)
      .post(`/api/privacy/block/${otherId}`)
      .set('Authorization', `Bearer ${callerToken}`)

    const res = await request(app)
      .post('/api/calls/room')
      .set('Authorization', `Bearer ${callerToken}`)
      .send({ type: 'one-on-one', participantIds: [otherId.toString()] })

    expect(res.status).toBe(403)
  })

  it('a normal, unblocked call still works (guard is not overly strict)', async () => {
    const callerToken = await registerAndLogin(caller)
    const otherToken = await registerAndLogin(blocker)
    void otherToken
    const otherId = (await User.findOne({ email: blocker.email }))._id

    const res = await request(app)
      .post('/api/calls/room')
      .set('Authorization', `Bearer ${callerToken}`)
      .send({ type: 'one-on-one', participantIds: [otherId.toString()] })

    expect(res.status).toBe(201)
    expect(res.body.roomId).toBeTruthy()
  })
})

// ─── API-02: comment pagination (PERFORMANCE FIX) ─────────────────────
//
// getComments used to be an unbounded Comment.find() with no
// .skip()/.limit(). Now paginated with a generous default (50) so normal
// threads render exactly as before, while a pathologically large thread
// is capped instead of returned in full.
describe('GET /api/comments/:targetType/:targetId — pagination (PERFORMANCE FIX)', () => {
  const commenter = {
    name: 'Divya Pillai', email: 'divya@college.edu', password: 'correcthorse22',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  it('caps results at the requested limit and reports the true total via pagination metadata', async () => {
    await request(app).post('/api/auth/register').send(commenter)
    const token = (await request(app).post('/api/auth/login').send({ email: commenter.email, password: commenter.password })).body.token
    const targetId = new mongoose.Types.ObjectId().toString()

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/comments/note/${targetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: `Comment number ${i}` })
    }

    const res = await request(app)
      .get(`/api/comments/note/${targetId}`)
      .query({ limit: 2, page: 1 })
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.comments.length).toBe(2) // capped by limit, not all 5
    expect(res.body.pagination.total).toBe(5) // true total, not comments.length
    expect(res.body.pagination.hasMore).toBe(true)
  })

  it('a normal-sized thread still returns everything in one call by default (guard is not overly strict)', async () => {
    await request(app).post('/api/auth/register').send(commenter)
    const token = (await request(app).post('/api/auth/login').send({ email: commenter.email, password: commenter.password })).body.token
    const targetId = new mongoose.Types.ObjectId().toString()

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/comments/note/${targetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: `Comment number ${i}` })
    }

    const res = await request(app)
      .get(`/api/comments/note/${targetId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.comments.length).toBe(5) // default limit (50) doesn't truncate a normal thread
  })
})

// ─── API-03: alumni directory pagination + in-DB search (PERFORMANCE FIX) ──
//
// getAlumniDirectory used to fetch the entire unfiltered directory into
// memory on every text search, THEN filter in JS. Search now runs as part
// of the DB query (including matching on the linked user's name, which
// the old in-memory version also supported), and results are paginated.
describe('GET /api/alumni — pagination + search (PERFORMANCE FIX)', () => {
  const alumnus = {
    name: 'Searchable Person', email: 'searchable@college.edu', password: 'correcthorse23',
    branch: 'CSE', year: 4, college: 'BITS Pilani',
  }
  const otherAlumnus = {
    name: 'Someone Else', email: 'someoneelse@college.edu', password: 'correcthorse24',
    branch: 'CSE', year: 4, college: 'BITS Pilani',
  }

  const registerLoginAndCreateProfile = async (payload, profileFields) => {
    await request(app).post('/api/auth/register').send(payload)
    const token = (await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password })).body.token
    await request(app)
      .post('/api/alumni')
      .set('Authorization', `Bearer ${token}`)
      .send({ graduationYear: 2022, ...profileFields })
    return token
  }

  it('search matches by the linked user\'s name via the DB query, not just company/role', async () => {
    await registerLoginAndCreateProfile(alumnus, { currentCompany: 'Acme Corp', currentRole: 'Engineer' })
    const otherToken = await registerLoginAndCreateProfile(otherAlumnus, { currentCompany: 'Beta Inc', currentRole: 'Analyst' })

    const res = await request(app)
      .get('/api/alumni')
      .query({ search: 'Searchable' }) // matches alumnus's NAME, not company/role
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(200)
    expect(res.body.profiles.length).toBe(1)
    expect(res.body.profiles[0].user.name).toBe('Searchable Person')
  })

  it('respects pagination limit and reports the true total', async () => {
    const token = await registerLoginAndCreateProfile(alumnus, { currentCompany: 'Acme Corp' })
    await registerLoginAndCreateProfile(otherAlumnus, { currentCompany: 'Beta Inc' })

    const res = await request(app)
      .get('/api/alumni')
      .query({ limit: 1, page: 1 })
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.profiles.length).toBe(1)
    expect(res.body.pagination.total).toBe(2)
    expect(res.body.pagination.hasMore).toBe(true)
  })
})

// ─── GPA-01: CGPA compounding rounding error (CORRECTNESS FIX) ────────
//
// getGpaRecords used to reconstruct each semester's total grade points as
// `sgpa * totalCredits`, but sgpa was already rounded to 2 decimal places
// when the semester was created — multiplying a rounded average back out
// introduces a small but real, compounding rounding error that grows
// with every additional semester. Records now also store the raw,
// unrounded totalPoints, and CGPA sums that instead.
describe('GPA CGPA calculation — rounding correctness (CORRECTNESS FIX)', () => {
  const student = {
    name: 'Rounding Test Student', email: 'roundingtest@college.edu', password: 'correcthorse27',
    branch: 'CSE', year: 3, college: 'BITS Pilani',
  }

  it('produces the mathematically correct CGPA, not the value the old reconstruction method would give', async () => {
    await request(app).post('/api/auth/register').send(student)
    const token = (await request(app).post('/api/auth/login').send({ email: student.email, password: student.password })).body.token

    // Worked example (verified independently before writing this test):
    // Semester 1 — one course, credits=1000, gradePoint=8.004999.
    //   totalPoints = 8004.999, sgpa = round(8004.999/1000, 2) = 8.00
    //   (rounds DOWN, since .004999 < .005)
    // Semester 2 — one course, credits=1, gradePoint=10. No rounding error.
    //
    // OLD (buggy) CGPA: (8.00*1000 + 10*1) / 1001 = 8010/1001 = 8.00
    // NEW (correct) CGPA: (8004.999 + 10) / 1001 = 8014.999/1001 = 8.01
    // These are deliberately unrealistic credit values chosen purely to
    // make the compounding rounding error visible in the final 2-decimal
    // CGPA — not meant to represent a realistic semester course load.
    await request(app)
      .post('/api/gpa')
      .set('Authorization', `Bearer ${token}`)
      .send({
        semesterLabel: 'Semester 1',
        courses: [{ name: 'Mega Course', credits: 1000, grade: 'O', gradePoint: 8.004999 }],
      })
    await request(app)
      .post('/api/gpa')
      .set('Authorization', `Bearer ${token}`)
      .send({
        semesterLabel: 'Semester 2',
        courses: [{ name: 'Small Course', credits: 1, grade: 'O', gradePoint: 10 }],
      })

    const res = await request(app)
      .get('/api/gpa')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.cgpa).toBe(8.01) // the mathematically correct value
    expect(res.body.cgpa).not.toBe(8.00) // what the old reconstruction bug would have produced
  })

  it('stores the raw totalPoints alongside the rounded sgpa on each record', async () => {
    await request(app).post('/api/auth/register').send(student)
    const token = (await request(app).post('/api/auth/login').send({ email: student.email, password: student.password })).body.token

    const created = await request(app)
      .post('/api/gpa')
      .set('Authorization', `Bearer ${token}`)
      .send({
        semesterLabel: 'Semester 1',
        courses: [{ name: 'Course A', credits: 3, grade: 'A', gradePoint: 8 }, { name: 'Course B', credits: 4, grade: 'B', gradePoint: 7 }],
      })

    // totalPoints = 3*8 + 4*7 = 52, exact — no rounding involved here,
    // but this confirms the raw value is genuinely persisted, not just
    // used transiently in-memory.
    expect(created.body.record.totalPoints).toBe(52)
    expect(created.body.record.sgpa).toBe(Number((52 / 7).toFixed(2)))
  })

  it('gracefully falls back to the old reconstruction for pre-existing records with no stored totalPoints', async () => {
    await request(app).post('/api/auth/register').send(student)
    const token = (await request(app).post('/api/auth/login').send({ email: student.email, password: student.password })).body.token
    const user = await User.findOne({ email: student.email })

    // Simulates a record created before this fix shipped — no
    // totalPoints field at all, only sgpa + totalCredits.
    await GpaRecord.create({
      user: user._id, semesterLabel: 'Legacy Semester',
      courses: [{ name: 'Old Course', credits: 4, grade: 'A', gradePoint: 8 }],
      sgpa: 8.00, totalCredits: 4,
      // totalPoints intentionally omitted
    })

    const res = await request(app)
      .get('/api/gpa')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200) // does not error out on the missing field
    expect(res.body.cgpa).toBe(8.00) // falls back to sgpa*totalCredits for this one record
  })
})

// ─── GAM-01: XP-awarding race condition (DATA-INTEGRITY FIX) ──────────
//
// awardXP used to be a read-modify-write (findOne → mutate → save()) with
// no atomic operation guaranteeing an increment isn't lost if two
// XP-earning actions race. Core fields are now updated via a single
// atomic findOneAndUpdate using $inc/$push.
describe('XP awarding — concurrent race (DATA-INTEGRITY FIX)', () => {
  const xpRacer = {
    name: 'XP Racer', email: 'xpracer@college.edu', password: 'correcthorse28',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  it('two simultaneous XP-earning actions both land — neither increment is lost', async () => {
    await request(app).post('/api/auth/register').send(xpRacer)
    const token = (await request(app).post('/api/auth/login').send({ email: xpRacer.email, password: xpRacer.password })).body.token
    const userId = (await User.findOne({ email: xpRacer.email }))._id

    // CREATE_POST awards 5 XP each (see utils/xpEngine.js XP_VALUES).
    // Genuinely concurrent — both fired before either resolves.
    await Promise.all([
      request(app).post('/api/posts').set('Authorization', `Bearer ${token}`).send({ content: 'Post A', visibility: 'everyone' }),
      request(app).post('/api/posts').set('Authorization', `Bearer ${token}`).send({ content: 'Post B', visibility: 'everyone' }),
    ])

    const stats = await UserStats.findOne({ user: userId })
    expect(stats.xp).toBe(10) // both +5s landed — the old read-modify-write could lose one
    expect(stats.stats.postsCreated).toBe(2)
    expect(stats.xpHistory.length).toBe(2)
  })
})

// ─── GAM-03: badge-award batching (PERFORMANCE/ATOMICITY FIX) ─────────
//
// checkAndAwardBadges used to call stats.save() once per newly-qualifying
// badge. Now collects all qualifying badges and applies them (plus their
// combined XP bonus) in a single update.
describe('Badge awarding — batched update (PERFORMANCE/ATOMICITY FIX)', () => {
  const badgeEarner = {
    name: 'Badge Earner', email: 'badgeearner@college.edu', password: 'correcthorse29',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  it('awards a badge and its XP bonus, and totalXP reported by the action reflects the bonus too', async () => {
    // Threshold of 1 postsCreated — the very first CREATE_POST action
    // will immediately qualify for this badge.
    await Badge.create({
      badgeId: 'first-post', name: 'First Post', description: 'Made your first post',
      icon: '📝', xpReward: 50, criteria: { type: 'count', field: 'postsCreated', threshold: 1 },
    })

    await request(app).post('/api/auth/register').send(badgeEarner)
    const token = (await request(app).post('/api/auth/login').send({ email: badgeEarner.email, password: badgeEarner.password })).body.token
    const userId = (await User.findOne({ email: badgeEarner.email }))._id

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'My first post!', visibility: 'everyone' })

    const stats = await UserStats.findOne({ user: userId })
    expect(stats.badges.map((b) => b.badgeId)).toContain('first-post')
    // CREATE_POST (5) + badge bonus (50) = 55 total.
    expect(stats.xp).toBe(55)
  })

  it('does not re-award an already-earned badge on a later action', async () => {
    await Badge.create({
      badgeId: 'first-post', name: 'First Post', description: 'Made your first post',
      icon: '📝', xpReward: 50, criteria: { type: 'count', field: 'postsCreated', threshold: 1 },
    })

    await request(app).post('/api/auth/register').send(badgeEarner)
    const token = (await request(app).post('/api/auth/login').send({ email: badgeEarner.email, password: badgeEarner.password })).body.token
    const userId = (await User.findOne({ email: badgeEarner.email }))._id

    await request(app).post('/api/posts').set('Authorization', `Bearer ${token}`).send({ content: 'Post 1', visibility: 'everyone' })
    await request(app).post('/api/posts').set('Authorization', `Bearer ${token}`).send({ content: 'Post 2', visibility: 'everyone' })

    const stats = await UserStats.findOne({ user: userId })
    const firstPostBadges = stats.badges.filter((b) => b.badgeId === 'first-post')
    expect(firstPostBadges.length).toBe(1) // only awarded once, not once per qualifying action
    expect(stats.xp).toBe(60) // 5 + 50 + 5 (second post's XP, no second badge bonus)
  })
})

// ─── DIGEST-01: xpEarnedThisPeriod undercounting past the history cap ──
// (CORRECTNESS FIX)
//
// xpEarnedThisPeriod used to be derived by filtering stats.xpHistory
// (capped at 100 entries) by date. A very active user (100+ XP-earning
// actions within one digest window) would have older-but-still-in-window
// entries silently evicted before the digest ran, undercounting their
// reported weekly XP. A dedicated periodXp accumulator (reset by the
// digest cron job after each send) isn't subject to that cap.
describe('Digest XP tracking survives beyond the xpHistory cap (CORRECTNESS FIX)', () => {
  const veryActiveStudent = {
    name: 'Very Active Student', email: 'veryactive@college.edu', password: 'correcthorse30',
    branch: 'CSE', year: 2, college: 'BITS Pilani',
  }

  it('periodXp — and the digest data derived from it — reflects the true total, not just the last 100 entries', async () => {
    await request(app).post('/api/auth/register').send(veryActiveStudent)
    const user = await User.findOne({ email: veryActiveStudent.email })

    // 105 XP-earning actions, each worth 5 XP (DAILY_LOGIN) — deliberately
    // more than the 100-entry xpHistory cap. Called directly rather than
    // through 105 HTTP round-trips purely for test speed; the underlying
    // function is identical either way.
    for (let i = 0; i < 105; i++) {
      await awardXP(user._id, 'DAILY_LOGIN', null)
    }

    const stats = await UserStats.findOne({ user: user._id })
    expect(stats.xpHistory.length).toBe(100) // the cap itself still works as designed
    expect(stats.xp).toBe(105 * 5)
    expect(stats.periodXp).toBe(105 * 5) // NOT subject to the same cap

    const digestData = await buildDigestData(user, { gamification: true }, 7)
    expect(digestData.gamification.xpEarnedThisPeriod).toBe(105 * 5)
    // What the old, buggy (xpHistory-filtering) implementation would have
    // reported instead — only the most recent 100 entries' worth.
    expect(digestData.gamification.xpEarnedThisPeriod).not.toBe(100 * 5)
  })

  it('the cron-job reset pattern correctly zeroes periodXp after a digest is sent', async () => {
    await request(app).post('/api/auth/register').send(veryActiveStudent)
    const user = await User.findOne({ email: veryActiveStudent.email })
    await awardXP(user._id, 'DAILY_LOGIN', null)

    let stats = await UserStats.findOne({ user: user._id })
    expect(stats.periodXp).toBe(5)

    // Simulates exactly what index.js's digest cron jobs do after
    // actually sending a digest.
    await UserStats.updateOne({ user: user._id }, { $set: { periodXp: 0 } })

    stats = await UserStats.findOne({ user: user._id })
    expect(stats.periodXp).toBe(0)
    expect(stats.xp).toBe(5) // total XP is untouched — only the period accumulator resets
  })
})
