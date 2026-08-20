import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../../utils/escapeHtml.js'
import { buildDigestHTML } from '../../utils/digestEmailTemplate.js'

// Pure-function unit tests — no DB, no network. These directly cover the
// stored-HTML-injection fix (INJ-04) applied to outbound digest emails.

describe('escapeHtml', () => {
  it('leaves plain text unchanged', () => {
    expect(escapeHtml('Data Structures Notes')).toBe('Data Structures Notes')
  })

  it('escapes every HTML metacharacter', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#39;')
  })

  it('neutralizes a classic script-injection payload', () => {
    const payload = '<img src=x onerror="alert(1)">'
    const escaped = escapeHtml(payload)
    expect(escaped).not.toContain('<img')
    expect(escaped).not.toContain('onerror="alert')
    expect(escaped).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
  })

  it('handles empty, null, and undefined input without throwing', () => {
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('escapes & before other entities so escaping is not double-applied', () => {
    // If & were escaped after < / >, "&lt;" would become "&amp;lt;" — wrong.
    // Escaping & first avoids this.
    expect(escapeHtml('<')).not.toContain('&amp;lt;')
  })
})

describe('buildDigestHTML — stored HTML injection (SECURITY FIX)', () => {
  const baseData = {
    user: { name: 'Priya Nair' },
    periodDays: 7,
  }

  it('a malicious note title does not appear unescaped in the output HTML', () => {
    const payload = '<img src=x onerror="alert(document.cookie)">'
    const html = buildDigestHTML({
      ...baseData,
      topNotes: [{ title: payload, subject: 'DS', uploader: { name: 'Attacker' } }],
    })

    expect(html).not.toContain(payload)
    expect(html).not.toContain('<img src=x onerror=')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(document.cookie)&quot;&gt;')
  })

  it('a malicious uploader display name does not appear unescaped in the output HTML', () => {
    const payload = '<a href="https://phish.example">Click here</a>'
    const html = buildDigestHTML({
      ...baseData,
      topNotes: [{ title: 'Real Notes', subject: 'DS', uploader: { name: payload } }],
    })

    expect(html).not.toContain(payload)
    expect(html).not.toContain('<a href="https://phish.example">')
  })

  it('a malicious event title/venue does not appear unescaped in the output HTML', () => {
    const payload = '<script>alert(1)</script>'
    const html = buildDigestHTML({
      ...baseData,
      upcomingEvents: [{ title: payload, date: new Date(), venue: payload }],
    })

    expect(html).not.toContain(payload)
    expect(html).not.toContain('<script>')
  })

  it('a malicious placement title/company/package does not appear unescaped in the output HTML', () => {
    const payload = '"><svg onload=alert(1)>'
    const html = buildDigestHTML({
      ...baseData,
      newPlacements: [{ title: payload, company: payload, package: payload }],
    })

    expect(html).not.toContain(payload)
    expect(html).not.toContain('<svg onload=')
  })

  it('the recipient\'s own display name is escaped too, even though it is lower-risk', () => {
    const html = buildDigestHTML({
      user: { name: '<b>Not Actually Bold</b>' },
      periodDays: 1,
    })
    expect(html).not.toContain('<b>Not Actually Bold</b>')
  })

  it('legitimate content with no special characters still renders normally (guard is not overly strict)', () => {
    const html = buildDigestHTML({
      ...baseData,
      topNotes: [{ title: 'Data Structures Unit 3', subject: 'DS', uploader: { name: 'Rahul Singh' } }],
      upcomingEvents: [{ title: 'Tech Fest 2026', date: new Date(), venue: 'Main Auditorium' }],
    })
    expect(html).toContain('Data Structures Unit 3')
    expect(html).toContain('Rahul Singh')
    expect(html).toContain('Tech Fest 2026')
    expect(html).toContain('Main Auditorium')
  })
})
