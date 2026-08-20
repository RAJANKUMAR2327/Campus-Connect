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

describe('Follow / unfollow', () => {
  it('follows a user and increments follower/following counts', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })

    const res = await request(app)
      .post(`/api/users/${bob.user.id}/follow`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)

    const bobProfile = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(bobProfile.body.profile.followerCount).toBe(1)
    expect(bobProfile.body.profile.isFollowing).toBe(true)
    expect(bobProfile.body.profile.followsYou).toBe(false)
  })

  it('is idempotent — following twice does not double-count', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app).post(`/api/users/${bob.user.id}/follow`).set('Authorization', `Bearer ${alice.token}`)
    await request(app).post(`/api/users/${bob.user.id}/follow`).set('Authorization', `Bearer ${alice.token}`)

    const followers = await request(app)
      .get(`/api/users/${bob.user.id}/followers`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(followers.body.followers).toHaveLength(1)
  })

  it('rejects following yourself', async () => {
    const alice = await createUser({ name: 'Alice' })
    const res = await request(app)
      .post(`/api/users/${alice.user.id}/follow`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(400)
  })

  it('404s when following a nonexistent user', async () => {
    const alice = await createUser({ name: 'Alice' })
    const res = await request(app)
      .post('/api/users/64a000000000000000000000/follow')
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })

  it('prevents following someone who has blocked you', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app).post(`/api/privacy/block/${alice.user.id}`).set('Authorization', `Bearer ${bob.token}`)

    const res = await request(app)
      .post(`/api/users/${bob.user.id}/follow`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(403)
  })

  it('unfollows correctly and removes both sides of the edge', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app).post(`/api/users/${bob.user.id}/follow`).set('Authorization', `Bearer ${alice.token}`)
    const res = await request(app)
      .delete(`/api/users/${bob.user.id}/follow`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)

    const followers = await request(app)
      .get(`/api/users/${bob.user.id}/followers`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(followers.body.followers).toHaveLength(0)
  })

  it('marks a mutual follow correctly on both profiles', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await request(app).post(`/api/users/${bob.user.id}/follow`).set('Authorization', `Bearer ${alice.token}`)
    await request(app).post(`/api/users/${alice.user.id}/follow`).set('Authorization', `Bearer ${bob.token}`)

    const bobProfileFromAlice = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(bobProfileFromAlice.body.profile.isFollowing).toBe(true)
    expect(bobProfileFromAlice.body.profile.followsYou).toBe(true)
  })
})

describe('GET /api/users/:userId/profile — privacy enforcement', () => {
  it('always allows viewing your own profile', async () => {
    const alice = await createUser({ name: 'Alice' })
    const res = await request(app)
      .get(`/api/users/${alice.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
    expect(res.body.profile.isSelf).toBe(true)
  })

  it('defaults to college-only visibility — same-college viewer can see it', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'BITS Pilani' })
    const res = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
  })

  it('defaults to college-only visibility — different-college viewer is blocked', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'IIT Delhi' })
    const res = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(403)
    // Even when blocked, a minimal name/avatar is still returned (not a 404) —
    // distinct from the blocking case, where the profile fully disappears.
    expect(res.body.limited.name).toBe('Bob')
  })

  it('"everyone" visibility overrides the college restriction', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'IIT Delhi' })
    await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ profileVisibility: 'everyone' })

    const res = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
  })

  it('"connections" visibility requires a MUTUAL follow, not just one-directional', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'BITS Pilani' })
    await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ profileVisibility: 'connections' })

    // Alice follows Bob, but Bob doesn't follow back — not a connection yet
    await request(app).post(`/api/users/${bob.user.id}/follow`).set('Authorization', `Bearer ${alice.token}`)
    const notYet = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(notYet.status).toBe(403)

    // Bob follows Alice back — now it's mutual
    await request(app).post(`/api/users/${alice.user.id}/follow`).set('Authorization', `Bearer ${bob.token}`)
    const nowAllowed = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(nowAllowed.status).toBe(200)
  })

  it('blocking hides the profile entirely with a 404, unlike a plain privacy restriction', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'BITS Pilani' })
    await request(app).post(`/api/privacy/block/${alice.user.id}`).set('Authorization', `Bearer ${bob.token}`)

    const res = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })

  it('hides email unless showEmail is enabled or viewing your own profile', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'BITS Pilani' })

    const hidden = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(hidden.body.profile.email).toBeUndefined()

    await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ showEmail: true })

    const shown = await request(app)
      .get(`/api/users/${bob.user.id}/profile`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(shown.body.profile.email).toBe(bob.payload.email)
  })

  it('404s for a nonexistent user id', async () => {
    const alice = await createUser({ name: 'Alice' })
    const res = await request(app)
      .get('/api/users/64a000000000000000000000/profile')
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(404)
  })

  it('rejects unauthenticated access', async () => {
    const alice = await createUser({ name: 'Alice' })
    const res = await request(app).get(`/api/users/${alice.user.id}/profile`)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/users/:userId/followers, /following — privacy enforcement (SECURITY FIX regression test)', () => {
  it('blocks followers list access exactly like the profile — this was previously ungated', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'IIT Delhi' })
    await request(app).post(`/api/users/${bob.user.id}/follow`).set('Authorization', `Bearer ${alice.token}`)

    // Different college, default 'college' visibility → should be denied,
    // exactly as the profile endpoint would deny it.
    const res = await request(app)
      .get(`/api/users/${bob.user.id}/followers`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(403)
  })

  it('blocking hides the followers/following lists with a 404, same as the profile', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'BITS Pilani' })
    await request(app).post(`/api/privacy/block/${alice.user.id}`).set('Authorization', `Bearer ${bob.token}`)

    const followers = await request(app)
      .get(`/api/users/${bob.user.id}/followers`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(followers.status).toBe(404)

    const following = await request(app)
      .get(`/api/users/${bob.user.id}/following`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(following.status).toBe(404)
  })

  it('"everyone" visibility allows the social graph to be viewed cross-college', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    const bob = await createUser({ name: 'Bob', college: 'IIT Delhi' })
    await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ profileVisibility: 'everyone' })

    const res = await request(app)
      .get(`/api/users/${bob.user.id}/followers`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
  })

  it('can always view your own followers/following regardless of your own visibility setting', async () => {
    const alice = await createUser({ name: 'Alice', college: 'BITS Pilani' })
    await request(app)
      .patch('/api/privacy/settings')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ profileVisibility: 'connections' })

    const res = await request(app)
      .get(`/api/users/${alice.user.id}/followers`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
  })
})
