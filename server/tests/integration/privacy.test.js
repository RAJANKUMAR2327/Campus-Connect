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

// Helper: register + login a user, return { token, user }
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

describe('GET/PATCH /api/privacy/settings', () => {
  it('returns sensible defaults for a new user', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .get('/api/privacy/settings')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.privacy.profileVisibility).toBe('college')
    expect(res.body.privacy.whoCanMessage).toBe('everyone')
    expect(res.body.privacy.showEmail).toBe(false)
  })

  it('updates settings with valid values', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ whoCanMessage: 'nobody', showEmail: true })
    expect(res.status).toBe(200)
    expect(res.body.privacy.whoCanMessage).toBe('nobody')
    expect(res.body.privacy.showEmail).toBe(true)
  })

  it('rejects an invalid enum value with 400, not silently accepting it', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ whoCanMessage: 'literally-anyone-with-this-string' })
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/privacy/settings')
    expect(res.status).toBe(401)
  })
})

describe('Blocking: POST/DELETE /api/privacy/block/:userId, GET /api/privacy/blocked', () => {
  it('blocks a user and lists them', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    const blockRes = await request(app)
      .post(`/api/privacy/block/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(blockRes.status).toBe(200)

    const listRes = await request(app)
      .get('/api/privacy/blocked')
      .set('Authorization', `Bearer ${alice.token}`)
    expect(listRes.body.blockedUsers).toHaveLength(1)
    expect(listRes.body.blockedUsers[0]._id).toBe(bob.user.id)
  })

  it('is idempotent — blocking the same user twice does not error or duplicate', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    await request(app).post(`/api/privacy/block/${bob.user.id}`).set('Authorization', `Bearer ${alice.token}`)
    const second = await request(app).post(`/api/privacy/block/${bob.user.id}`).set('Authorization', `Bearer ${alice.token}`)
    expect(second.status).toBe(200)

    const dbUser = await User.findById(alice.user.id)
    expect(dbUser.blockedUsers).toHaveLength(1)
  })

  it('rejects self-blocking', async () => {
    const alice = await createUser({ name: 'Alice' })
    const res = await request(app)
      .post(`/api/privacy/block/${alice.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(400)
  })

  it('404s when blocking a nonexistent user', async () => {
    const alice = await createUser({ name: 'Alice' })
    const fakeId = '64a000000000000000000000'
    const res = await request(app)
      .post(`/api/privacy/block/${fakeId}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })

  it('unblocking someone never blocked is a harmless no-op', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    const res = await request(app)
      .delete(`/api/privacy/block/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
  })

  it('unblocks a previously blocked user', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app).post(`/api/privacy/block/${bob.user.id}`).set('Authorization', `Bearer ${alice.token}`)
    const res = await request(app).delete(`/api/privacy/block/${bob.user.id}`).set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
    const dbUser = await User.findById(alice.user.id)
    expect(dbUser.blockedUsers).toHaveLength(0)
  })
})

describe('Blocking enforcement in chat (getOrCreateConversation)', () => {
  it('prevents starting a DM once the recipient has blocked the sender', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    // Bob blocks Alice
    await request(app).post(`/api/privacy/block/${alice.user.id}`).set('Authorization', `Bearer ${bob.token}`)

    // Alice tries to message Bob
    const res = await request(app)
      .get(`/api/chat/conversations/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(403)
  })

  it('prevents starting a DM when the sender has blocked the recipient', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    await request(app).post(`/api/privacy/block/${bob.user.id}`).set('Authorization', `Bearer ${alice.token}`)

    const res = await request(app)
      .get(`/api/chat/conversations/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(403)
  })

  it('respects whoCanMessage: nobody even with no block in place', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ whoCanMessage: 'nobody' })

    const res = await request(app)
      .get(`/api/chat/conversations/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(403)
  })

  it('allows a DM between two unrelated, non-blocking users (control case)', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    const res = await request(app)
      .get(`/api/chat/conversations/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
    expect(res.body.conversation).toBeTruthy()
  })
})
