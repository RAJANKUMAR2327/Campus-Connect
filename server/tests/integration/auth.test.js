import '../env.setup.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../app.js'
import User from '../../models/User.js'
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

const validUser = {
  name: 'Asha Kapoor',
  email: 'asha@college.edu',
  password: 'correcthorse',
  branch: 'CSE',
  year: 2,
  college: 'BITS Pilani',
}

const registerAndVerify = async (overrides = {}) => {
  const payload = { ...validUser, ...overrides }
  await request(app).post('/api/auth/register').send(payload)
  // EMAIL_HOST is intentionally unset in tests, so register() takes the
  // "no email configured" fallback and auto-verifies — see authController.js.
  return payload
}

describe('POST /api/auth/register', () => {
  it('creates a new user on valid input', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser)
    expect(res.status).toBe(201)
    const user = await User.findOne({ email: validUser.email })
    expect(user).not.toBeNull()
    expect(user.name).toBe(validUser.name)
  })

  it('never returns the password hash in the response', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser)
    expect(JSON.stringify(res.body)).not.toContain(validUser.password)
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validUser)
    const res = await request(app).post('/api/auth/register').send(validUser)
    expect(res.status).toBe(400)
  })

  it('auto-verifies when no email provider is configured (dev-friendly fallback)', async () => {
    await request(app).post('/api/auth/register').send(validUser)
    const user = await User.findOne({ email: validUser.email })
    expect(user.isVerified).toBe(true)
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and returns a JWT', async () => {
    await registerAndVerify()
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTypeOf('string')
    expect(res.body.user.email).toBe(validUser.email)
  })

  it('rejects an incorrect password', async () => {
    await registerAndVerify()
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: 'wrong-password',
    })
    expect(res.status).toBe(401)
  })

  it('rejects a nonexistent email (without revealing whether the account exists)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@college.edu',
      password: 'whatever123',
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password.')
  })

  it('rejects missing email/password with a 400, not a 500', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/auth/delete-account (SECURITY FIX regression test)', () => {
  const getToken = async () => {
    await registerAndVerify()
    const login = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    })
    return login.body.token
  }

  it('rejects deletion with no password field at all — this is the exact bug that was fixed', async () => {
    const token = await getToken()
    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // no password in body — previously this deleted the account anyway
    expect(res.status).toBe(400)
    const user = await User.findOne({ email: validUser.email })
    expect(user).not.toBeNull() // account must still exist
  })

  it('rejects deletion with the wrong password', async () => {
    const token = await getToken()
    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'not-the-right-password' })
    expect(res.status).toBe(400)
    const user = await User.findOne({ email: validUser.email })
    expect(user).not.toBeNull()
  })

  it('deletes the account when the correct password is supplied', async () => {
    const token = await getToken()
    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: validUser.password })
    expect(res.status).toBe(200)
    const user = await User.findOne({ email: validUser.email })
    expect(user).toBeNull()
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).delete('/api/auth/delete-account').send({ password: 'x' })
    expect(res.status).toBe(401)
  })
})
