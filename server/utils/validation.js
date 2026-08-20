// Shared guard against NoSQL operator injection. Any value taken from
// req.body / req.query / req.params and used as a Mongoose query filter
// value MUST pass through this first.
//
// Why this matters: Express's default query parser (`qs`) turns bracket
// notation into nested objects (e.g. `?token[$ne]=` becomes
// `req.query.token = { $ne: '' }`), and JSON request bodies can contain
// objects for any field. If that object is passed straight into a Mongoose
// filter — e.g. `Model.findOne({ someField: value })` — Mongo treats a
// `$`-prefixed key as a query operator instead of a value to match,
// letting an attacker match an arbitrary document instead of the one they
// were supposed to identify. See authController.js (SECURITY FIX comment)
// for the specific exploit chain this was found to enable on password
// reset, and libraryController.js's checkIn for a second, independent
// instance on the QR check-in code.
export const isPlainString = (v) => typeof v === 'string' && v.trim().length > 0
