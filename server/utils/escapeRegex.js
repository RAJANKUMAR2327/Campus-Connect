// Escapes regex metacharacters in user-supplied search input before it's
// used to build a `new RegExp(...)`. Without this, a crafted search string
// can trigger catastrophic backtracking (ReDoS) against MongoDB's regex
// engine. Every controller that builds a RegExp from `req.query`/`req.body`
// text should run it through this first.
export const escapeRegex = (str) =>
  String(str ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
