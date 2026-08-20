import { describe, it, expect } from 'vitest'
import { generateAuthorHash, getAnonymousName, getAnonymousAvatarColor } from '../../utils/anonymizer.js'

// Pure-function unit tests — no DB, no network. These directly cover the
// AUTH-04 fix: generateAuthorHash used to fold process.env.JWT_SECRET
// into the hash, reusing the session-signing secret for an unrelated
// purpose. It now uses its own dedicated ANON_SALT instead.

describe('generateAuthorHash', () => {
  it('is deterministic — the same userId+salt always produces the same hash', () => {
    const a = generateAuthorHash('user123', 'thread456')
    const b = generateAuthorHash('user123', 'thread456')
    expect(a).toBe(b)
  })

  it('produces a different hash for a different userId (same thread)', () => {
    const a = generateAuthorHash('user123', 'thread456')
    const b = generateAuthorHash('user789', 'thread456')
    expect(a).not.toBe(b)
  })

  it('produces a different hash for a different thread (same user) — "different anon per thread"', () => {
    const a = generateAuthorHash('user123', 'threadA')
    const b = generateAuthorHash('user123', 'threadB')
    expect(a).not.toBe(b)
  })

  it('does not depend on process.env.JWT_SECRET (the key-reuse this fix removes)', () => {
    const before = generateAuthorHash('user123', 'thread456')
    const originalSecret = process.env.JWT_SECRET
    process.env.JWT_SECRET = 'a-completely-different-value-that-would-have-changed-the-old-hash'
    const after = generateAuthorHash('user123', 'thread456')
    process.env.JWT_SECRET = originalSecret

    // Before this fix, this assertion would have failed — the hash used
    // to be derived in part from JWT_SECRET, so rotating it would have
    // silently changed every existing anonymous identity.
    expect(after).toBe(before)
  })

  it('returns a 12-character hex string', () => {
    const hash = generateAuthorHash('user123', 'thread456')
    expect(hash).toMatch(/^[0-9a-f]{12}$/)
  })
})

describe('getAnonymousName / getAnonymousAvatarColor', () => {
  it('are deterministic for the same hash (so a user reads as "the same anon" within a thread)', () => {
    const hash = generateAuthorHash('user123', 'thread456')
    expect(getAnonymousName(hash)).toBe(getAnonymousName(hash))
    expect(getAnonymousAvatarColor(hash)).toBe(getAnonymousAvatarColor(hash))
  })

  it('produce a valid "Adjective Animal" name and a valid hex color', () => {
    const hash = generateAuthorHash('user123', 'thread456')
    expect(getAnonymousName(hash)).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    expect(getAnonymousAvatarColor(hash)).toMatch(/^#[0-9a-f]{6}$/)
  })
})
