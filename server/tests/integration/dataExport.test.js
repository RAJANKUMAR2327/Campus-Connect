import '../env.setup.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../app.js'
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

describe('GET /api/auth/export-my-data', () => {
  it('returns the profile and an empty content object for a brand-new account', async () => {
    const { token, payload } = await createUser()
    const res = await request(app)
      .get('/api/auth/export-my-data')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.profile.email).toBe(payload.email)
    expect(res.body.content.notes).toEqual([])
    expect(res.body.content.tasks).toEqual([])
  })

  it('never includes the password hash or reset/verify tokens', async () => {
    const { token } = await createUser()
    const res = await request(app)
      .get('/api/auth/export-my-data')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.profile.password).toBeUndefined()
    expect(res.body.profile.verifyToken).toBeUndefined()
    expect(res.body.profile.resetPasswordToken).toBeUndefined()
  })

  it('includes a task the user created', async () => {
    const { token } = await createUser()
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Finish assignment', priority: 'high' })

    const res = await request(app)
      .get('/api/auth/export-my-data')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.content.tasks).toHaveLength(1)
    expect(res.body.content.tasks[0].title).toBe('Finish assignment')
  })

  it("does not include another user's data", async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: "Bob's private task" })

    const res = await request(app)
      .get('/api/auth/export-my-data')
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.body.content.tasks).toEqual([])
  })

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/auth/export-my-data')
    expect(res.status).toBe(401)
  })
})
