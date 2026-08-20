import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Integration tests spin up a real (in-memory) MongoDB per file and can
    // take a few seconds each to start — give them room rather than flaking.
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
