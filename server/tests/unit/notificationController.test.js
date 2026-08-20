import { describe, it, expect, vi, afterEach } from 'vitest'
import { createNotification } from '../../controllers/notificationController.js'

// createNotification's own error handling used to be a bare `catch {}` —
// any failure vanished with zero visibility (DB-06). This test doesn't
// need a live database: passing a null `recipient` makes
// `recipient.toString()` throw synchronously, before the function ever
// reaches an actual DB call, which is enough to exercise the catch block
// this fix changed.

describe('createNotification — error visibility (BUG FIX)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not throw when given invalid input (still fire-and-forget, same as before)', async () => {
    await expect(
      createNotification({ recipient: null, type: 'system', title: 't', message: 'm', link: '/x' })
    ).resolves.toBeUndefined()
  })

  it('logs the failure instead of silently swallowing it', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await createNotification({ recipient: null, type: 'system', title: 't', message: 'm', link: '/x' })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toContain('createNotification failed')
  })
})
