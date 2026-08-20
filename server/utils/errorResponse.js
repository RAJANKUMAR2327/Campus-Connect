// SECURITY FIX: every controller in this codebase used to respond to a
// caught error with `res.status(500).json({ message: err.message })`,
// forwarding raw Mongoose/driver/library error text (which can include
// internal details — index names, collection/database names, schema
// constraints) straight to the client on any unexpected failure.
//
// app.js's global error-handling middleware already documents the correct
// policy — only forward err.message for errors explicitly marked "safe"
// (err.status set by our own code) — but that policy only applies to
// errors that reach it via next(err). No controller in this codebase ever
// calls next(err); every one of them catches its own errors and responds
// directly, bypassing the global handler entirely. This helper makes that
// same, already-agreed-upon policy reachable from every controller instead
// of just the (in practice, never-hit) global handler.
//
// Usage: replace `res.status(500).json({ message: err.message })` with
// `sendServerError(res, err)`. The full error is always logged
// server-side regardless of what the client sees.
export const sendServerError = (res, err, fallback = 'Something went wrong. Please try again.') => {
  console.error(err.stack || err.message)
  const isSafeAppError = typeof err.status === 'number'
  res.status(err.status || 500).json({
    message: isSafeAppError ? err.message : fallback,
  })
}
