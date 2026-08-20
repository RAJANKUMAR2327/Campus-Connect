import '../env.setup.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../app.js'
import User from '../../models/User.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setupTestDB.js'

beforeAll(async () => {
  await setupTestDB()
})

afterAll(async () => {
  await teardownTestDB()
})

beforeEach(async () => {
  await clearTestDB()
})

const createUser = async (overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `user${Math.random().toString(36).slice(2)}@college.edu`,
    password: 'correcthorse',
    branch: 'CSE',
    year: 2,
    college: 'BITS Pilani',
    ...overrides,
  }
  await request(app).post('/api/auth/register').send(payload)
  const login = await request(app).post('/api/auth/login').send({
    email: payload.email,
    password: payload.password,
  })
  return { token: login.body.token, user: login.body.user, payload }
}

describe('POST /api/auth/deactivate-account', () => {
  it('requires a password, like delete-account', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('rejects the wrong password', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrong-one' })
    expect(res.status).toBe(400)
    const dbUser = await User.findOne({})
    expect(dbUser.isDeactivated).toBe(false)
  })

  it('deactivates without deleting any data (distinct from delete-account)', async () => {
    const { token, payload } = await createUser()
    const res = await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: payload.password })
    expect(res.status).toBe(200)

    const dbUser = await User.findOne({ email: payload.email })
    expect(dbUser).not.toBeNull() // still exists — this is the key difference from delete
    expect(dbUser.isDeactivated).toBe(true)
  })

  it('immediately invalidates the current token for every other endpoint', async () => {
    const { token, payload } = await createUser()
    await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: payload.password })

    // Same token, now-deactivated account, hits any protected route
    const res = await request(app)
      .get('/api/privacy/settings')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
    expect(res.body.deactivated).toBe(true)
  })
})

describe('Login reactivation flow', () => {
  it('reactivates automatically on next successful login', async () => {
    const { token, payload } = await createUser()
    await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: payload.password })

    const loginRes = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: payload.password,
    })
    expect(loginRes.status).toBe(200)
    expect(loginRes.body.reactivated).toBe(true)

    const dbUser = await User.findOne({ email: payload.email })
    expect(dbUser.isDeactivated).toBe(false)

    // The NEW token from this login works normally again
    const meRes = await request(app)
      .get('/api/privacy/settings')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
    expect(meRes.status).toBe(200)
  })

  it('does not report reactivated:true for a normal (never-deactivated) login', async () => {
    const { payload } = await createUser()
    const loginRes = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: payload.password,
    })
    expect(loginRes.body.reactivated).toBe(false)
  })
})

describe('Deactivated users are hidden from others', () => {
  it('a deactivated user\'s profile 404s for other viewers', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ password: bob.payload.password })

    const res = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })

  it('a deactivated user does not appear in chat search results', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob Deactivated' })
    await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ password: bob.payload.password })

    const res = await request(app)
      .get('/api/chat/search?q=Deactivated')
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.body.users).toHaveLength(0)
  })

  it('cannot start a new DM with a deactivated user', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ password: bob.payload.password })

    const res = await request(app)
      .get(`/api/chat/conversations/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })

  it('cannot be followed while deactivated', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ password: bob.payload.password })

    const res = await request(app)
      .post(`/api/users/${bob.user.id}/follow`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })
})
