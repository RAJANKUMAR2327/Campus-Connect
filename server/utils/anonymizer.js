import crypto from 'crypto'

// SECURITY FIX (AUTH-04): this used to fold process.env.JWT_SECRET into
// the anonymization hash below, reusing the session-signing secret for a
// completely unrelated purpose. That's a key-reuse smell with two real
// consequences: rotating JWT_SECRET for unrelated reasons (e.g. after a
// suspected leak) would silently change every existing anonymous
// confession's identity too, and if JWT_SECRET ever did leak, an attacker
// could not just forge sessions but also de-anonymize confession authors
// by brute-forcing the userId space (a small, enumerable set of Mongo
// ObjectIds) — two independent security properties collapsing to one
// point of failure. This now uses its own dedicated secret instead.
const ANON_SALT = process.env.ANON_SALT || (() => {
  // Not treated as fatal (unlike a missing JWT_SECRET, which breaks every
  // authenticated request immediately and obviously) — confessions are a
  // narrower feature, and failing the whole server over a missing salt
  // for one feature would be disproportionate. Falls back to a random
  // value generated once at process startup: this is still unpredictable
  // (not a fixed, guessable default), just not stable across restarts.
  console.warn(
    'ANON_SALT is not set — using a random value generated at startup. ' +
    'Anonymous confession identities will not stay consistent across ' +
    'server restarts until ANON_SALT is configured. Set it in production.'
  )
  return crypto.randomBytes(32).toString('hex')
})()

// Generate a consistent but untraceable hash per user per confession thread
// This lets a user be recognized as "the same anon" within a thread (for replies)
// without exposing their real identity to anyone
export const generateAuthorHash = (userId, salt = '') => {
  return crypto
    .createHash('sha256')
    .update(`${userId}-${salt}-${ANON_SALT}`)
    .digest('hex')
    .slice(0, 12)
}

// Generate a friendly anonymous display name from the hash
const animals = ['Panda', 'Fox', 'Owl', 'Wolf', 'Tiger', 'Eagle', 'Dolphin', 'Lion', 'Bear', 'Hawk', 'Otter', 'Raven']
const adjectives = ['Mysterious', 'Curious', 'Silent', 'Wandering', 'Hidden', 'Quiet', 'Secret', 'Anonymous', 'Masked', 'Shadow']

export const getAnonymousName = (hash) => {
  const num1 = parseInt(hash.slice(0, 4), 16) % adjectives.length
  const num2 = parseInt(hash.slice(4, 8), 16) % animals.length
  return `${adjectives[num1]} ${animals[num2]}`
}

export const getAnonymousAvatarColor = (hash) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6']
  const idx = parseInt(hash.slice(8, 10), 16) % colors.length
  return colors[idx]
}