import { describe, it, expect } from 'vitest'
import { isAllowedEmailDomain } from '../../utils/allowedEmailDomains.js'

// Pure-function unit tests — no DB, no network. These directly cover the
// CFG-02 fix: ALLOWED_DOMAINS was documented but never actually enforced
// anywhere. isAllowedEmailDomain() takes an explicit domains list so this
// doesn't need env-var/module-reload gymnastics to test both the
// "restricted" and "unrestricted" configurations.

describe('isAllowedEmailDomain', () => {
  it('allows any domain when the list is ["*"] (the default, unrestricted config)', () => {
    expect(isAllowedEmailDomain('student@college.edu', ['*'])).toBe(true)
    expect(isAllowedEmailDomain('anyone@gmail.com', ['*'])).toBe(true)
  })

  it('allows any domain when the list is empty (unset ALLOWED_DOMAINS)', () => {
    expect(isAllowedEmailDomain('anyone@gmail.com', [])).toBe(true)
  })

  it('rejects a non-matching domain when the list is a real restriction', () => {
    expect(isAllowedEmailDomain('student@gmail.com', ['college.edu'])).toBe(false)
  })

  it('allows a matching domain when the list is a real restriction', () => {
    expect(isAllowedEmailDomain('student@college.edu', ['college.edu'])).toBe(true)
  })

  it('supports multiple allowed domains (e.g. main + alumni)', () => {
    const domains = ['college.edu', 'alumni.college.edu']
    expect(isAllowedEmailDomain('student@college.edu', domains)).toBe(true)
    expect(isAllowedEmailDomain('grad@alumni.college.edu', domains)).toBe(true)
    expect(isAllowedEmailDomain('random@gmail.com', domains)).toBe(false)
  })

  it('matching is case-insensitive', () => {
    expect(isAllowedEmailDomain('student@COLLEGE.EDU', ['college.edu'])).toBe(true)
  })

  it('rejects malformed input without throwing', () => {
    expect(isAllowedEmailDomain('not-an-email', ['college.edu'])).toBe(false)
    expect(isAllowedEmailDomain('', ['college.edu'])).toBe(false)
    expect(isAllowedEmailDomain(undefined, ['college.edu'])).toBe(false)
  })

  it('defaults to the real env-derived list when no domains argument is passed (production call shape)', () => {
    // env.setup.js does not set ALLOWED_DOMAINS, so the module's default
    // export should resolve to unrestricted — this is the exact call
    // shape authController.register actually uses.
    expect(isAllowedEmailDomain('anyone@example.com')).toBe(true)
  })
})
