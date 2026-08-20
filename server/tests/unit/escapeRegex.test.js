import { describe, it, expect } from 'vitest'
import { escapeRegex } from '../../utils/escapeRegex.js'

// Pure-function unit tests — no DB, no network. These always run, in this
// sandbox or anywhere else, and directly cover the ReDoS fix applied across
// 9 controllers (see the security audit / improvement report).
describe('escapeRegex', () => {
  it('leaves plain alphanumeric strings unchanged', () => {
    expect(escapeRegex('CampusConnect')).toBe('CampusConnect')
    expect(escapeRegex('cse101')).toBe('cse101')
  })

  it('escapes every regex metacharacter', () => {
    // Every character regex treats specially, individually
    expect(escapeRegex('.')).toBe('\\.')
    expect(escapeRegex('*')).toBe('\\*')
    expect(escapeRegex('+')).toBe('\\+')
    expect(escapeRegex('?')).toBe('\\?')
    expect(escapeRegex('^')).toBe('\\^')
    expect(escapeRegex('$')).toBe('\\$')
    expect(escapeRegex('{')).toBe('\\{')
    expect(escapeRegex('}')).toBe('\\}')
    expect(escapeRegex('(')).toBe('\\(')
    expect(escapeRegex(')')).toBe('\\)')
    expect(escapeRegex('|')).toBe('\\|')
    expect(escapeRegex('[')).toBe('\\[')
    expect(escapeRegex(']')).toBe('\\]')
    expect(escapeRegex('\\')).toBe('\\\\')
  })

  it('neutralizes a classic catastrophic-backtracking (ReDoS) payload', () => {
    // Before the fix, a search string like this — built into a RegExp and
    // matched against a non-matching target — could hang the event loop for
    // an attacker-controlled amount of time (classic ReDoS shape: nested
    // quantifiers). After escaping, it's just a long literal string with no
    // special regex meaning, so matching is linear-time regardless of input.
    const payload = '(a+)+$'
    const escaped = escapeRegex(payload)
    const regex = new RegExp(escaped, 'i')

    expect(escaped).toBe('\\(a\\+\\)\\+\\$')
    // It should now only match the LITERAL text "(a+)+$", nothing else
    expect(regex.test('(a+)+$')).toBe(true)
    expect(regex.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!')).toBe(false)
  })

  it('handles empty and undefined input without throwing', () => {
    expect(escapeRegex('')).toBe('')
    expect(escapeRegex(undefined)).toBe('')
    expect(escapeRegex(null)).toBe('')
  })

  it('coerces non-string input to a string safely', () => {
    expect(escapeRegex(123)).toBe('123')
  })

  it('a mixed real-world search query is escaped correctly and still matches its literal target', () => {
    const query = 'C++ (intro)'
    const regex = new RegExp(escapeRegex(query), 'i')
    expect(regex.test('Intro to C++ (intro) programming')).toBe(true)
    expect(regex.test('Intro to C programming')).toBe(false)
  })
})
