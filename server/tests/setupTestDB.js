import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// Shared lifecycle helpers for integration tests. Each test FILE should call
// setupTestDB() in beforeAll and teardownTestDB() in afterAll, and clearTestDB()
// in afterEach/beforeEach to reset state between tests without paying the cost
// of restarting mongod for every single test.
//
// NOTE: mongodb-memory-server downloads a real mongod binary the first time
// it runs, from https://fastdl.mongodb.org. That download is NOT reachable
// from Anthropic's sandboxed analysis environment (only a small allow-list of
// domains is reachable there — npm/pypi/crates registries, github, etc. —
// and fastdl.mongodb.org isn't on it). On a normal developer machine or in
// CI with regular internet access, this works exactly as intended. These
// integration tests are written and reviewed for correctness but could not
// be executed end-to-end in the environment these changes were authored in;
// run `npm test` yourself to confirm — it should "just work" on first run
// (the binary download happens once and is cached under ~/.cache).
let mongod

export async function setupTestDB() {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  if (mongod) await mongod.stop()
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}
