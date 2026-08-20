import '../env.setup.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../app.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../setupTestDB.js'

// SECURITY FIX REGRESSION TESTS. These cover the P0 findings from the
// security audit: CollabDoc.updateDoc and Whiteboard.clearWhiteboard had
// NO authorization check at all (any authenticated user could edit/wipe
// any document or board by ID), and Post.visibility was stored but never
// enforced when reading the feed. The equivalent Socket.IO-layer fixes
// (join_conversation, doc_change, stroke_complete, etc. in index.js) can't
// be exercised through supertest since they're WebSocket events, not HTTP
// routes — those were verified by direct code reading instead (see the
// improvement report). These tests cover everything reachable over REST.

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

describe('CollabDoc authorization (SECURITY FIX)', () => {
  it('owner can update their own document', async () => {
    const alice = await createUser({ name: 'Alice' })
    const create = await request(app)
      .post('/api/collab-docs')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Notes' })
    const docId = create.body.doc._id

    const res = await request(app)
      .patch(`/api/collab-docs/${docId}`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'hello' })
    expect(res.status).toBe(200)
  })

  it('a random authenticated user CANNOT update someone else\'s document — this was the exact bug', async () => {
    const alice = await createUser({ name: 'Alice' })
    const mallory = await createUser({ name: 'Mallory' })
    const create = await request(app)
      .post('/api/collab-docs')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice\'s private notes' })
    const docId = create.body.doc._id

    const res = await request(app)
      .patch(`/api/collab-docs/${docId}`)
      .set('Authorization', `Bearer ${mallory.token}`)
      .send({ content: 'vandalized' })
    expect(res.status).toBe(403)
  })

  it('a viewer-role collaborator cannot edit (only editor role can)', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    const create = await request(app)
      .post('/api/collab-docs')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared doc' })
    const docId = create.body.doc._id
    const shareCode = create.body.doc.shareCode

    await request(app)
      .post(`/api/collab-docs/join/${shareCode}`)
      .set('Authorization', `Bearer ${bob.token}`)
    // Downgrade Bob to viewer
    await request(app)
      .patch(`/api/collab-docs/${docId}/collaborators`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ userId: bob.user.id, role: 'viewer' })

    const res = await request(app)
      .patch(`/api/collab-docs/${docId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ content: 'trying to edit as viewer' })
    expect(res.status).toBe(403)
  })

  it('an editor-role collaborator CAN edit', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    const create = await request(app)
      .post('/api/collab-docs')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared doc' })
    const docId = create.body.doc._id
    const shareCode = create.body.doc.shareCode

    // joinViaShareCode defaults new collaborators to 'editor' per the model
    await request(app)
      .post(`/api/collab-docs/join/${shareCode}`)
      .set('Authorization', `Bearer ${bob.token}`)

    const res = await request(app)
      .patch(`/api/collab-docs/${docId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ content: 'editing as editor' })
    expect(res.status).toBe(200)
  })
})

describe('Whiteboard authorization (SECURITY FIX)', () => {
  it('owner can clear their own whiteboard', async () => {
    const alice = await createUser({ name: 'Alice' })
    const create = await request(app)
      .post('/api/whiteboards')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'My board' })
    const boardId = create.body.board._id

    const res = await request(app)
      .patch(`/api/whiteboards/${boardId}/clear`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(res.status).toBe(200)
  })

  it('a random authenticated user CANNOT clear someone else\'s whiteboard — this was the exact bug', async () => {
    const alice = await createUser({ name: 'Alice' })
    const mallory = await createUser({ name: 'Mallory' })
    const create = await request(app)
      .post('/api/whiteboards')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice\'s board' })
    const boardId = create.body.board._id

    const res = await request(app)
      .patch(`/api/whiteboards/${boardId}/clear`)
      .set('Authorization', `Bearer ${mallory.token}`)
    expect(res.status).toBe(403)
  })

  it('a joined collaborator CAN clear the board (whiteboards have no viewer/editor split)', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    const create = await request(app)
      .post('/api/whiteboards')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared board' })
    const boardId = create.body.board._id
    const shareCode = create.body.board.shareCode

    await request(app)
      .post(`/api/whiteboards/join/${shareCode}`)
      .set('Authorization', `Bearer ${bob.token}`)

    const res = await request(app)
      .patch(`/api/whiteboards/${boardId}/clear`)
      .set('Authorization', `Bearer ${bob.token}`)
    expect(res.status).toBe(200)
  })
})

describe('Post visibility enforcement (SECURITY FIX)', () => {
  it('a "year"-scoped post is visible to a same-college, same-year viewer', async () => {
    const author = await createUser({ name: 'Author', college: 'BITS Pilani', year: 2 })
    const viewer = await createUser({ name: 'Viewer', college: 'BITS Pilani', year: 2 })
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.token}`)
      .send({ content: 'Year-2 only announcement', visibility: 'year' })

    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${viewer.token}`)
    expect(feed.body.posts.some(p => p.content === 'Year-2 only announcement')).toBe(true)
  })

  it('a "year"-scoped post is NOT visible to a different-year viewer — this was the exact bug', async () => {
    const author = await createUser({ name: 'Author', college: 'BITS Pilani', year: 2 })
    const viewer = await createUser({ name: 'Viewer', college: 'BITS Pilani', year: 4 })
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.token}`)
      .send({ content: 'Year-2 only announcement', visibility: 'year' })

    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${viewer.token}`)
    expect(feed.body.posts.some(p => p.content === 'Year-2 only announcement')).toBe(false)
  })

  it('a "college"-scoped post is not visible to a different-college viewer', async () => {
    const author = await createUser({ name: 'Author', college: 'BITS Pilani' })
    const viewer = await createUser({ name: 'Viewer', college: 'IIT Delhi' })
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.token}`)
      .send({ content: 'BITS-only post', visibility: 'college' })

    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${viewer.token}`)
    expect(feed.body.posts.some(p => p.content === 'BITS-only post')).toBe(false)
  })

  it('an "everyone"-scoped post is visible regardless of college/branch/year', async () => {
    const author = await createUser({ name: 'Author', college: 'BITS Pilani' })
    const viewer = await createUser({ name: 'Viewer', college: 'IIT Delhi', year: 1 })
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.token}`)
      .send({ content: 'Public post', visibility: 'everyone' })

    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${viewer.token}`)
    expect(feed.body.posts.some(p => p.content === 'Public post')).toBe(true)
  })

  it('authors can always see their own posts regardless of scope', async () => {
    const author = await createUser({ name: 'Author', college: 'BITS Pilani', year: 2 })
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${author.token}`)
      .send({ content: 'My own year-2 post', visibility: 'year' })

    const feed = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${author.token}`)
    expect(feed.body.posts.some(p => p.content === 'My own year-2 post')).toBe(true)
  })
})
