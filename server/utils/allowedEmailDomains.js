// CONFIG FIX (CFG-02): ALLOWED_DOMAINS was documented in .env.example
// ("not currently enforced anywhere in the code") but never actually read
// by anything — a campus platform restricting registration to verified
// college email domains was clearly the intent (the config scaffolding
// existed for it), but nothing wired it in, so any email domain could
// register regardless of what this var was set to.
//
// This mirrors app.js's allowedOrigins pattern exactly: `*`, unset, or
// empty means "no restriction" — the same behavior every deployment
// already has today — so wiring this in isn't a policy decision, it's
// making the pre-existing documented config path actually do what it
// already claimed to. The actual choice of which domains (if any) to
// restrict to remains a deployment-time decision via the env var, same as
// ALLOWED_ORIGINS.
//
// Kept in its own module (rather than alongside allowedOrigins in app.js)
// specifically so authController.js can import it without creating a
// circular dependency — app.js imports authRoutes.js, which imports
// authController.js, so authController.js importing back from app.js
// would be a cycle.
export const allowedEmailDomains = (process.env.ALLOWED_DOMAINS || '*')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

// Takes an explicit `domains` list (defaulting to the env-derived one
// above) rather than reading process.env internally, specifically so this
// core logic is directly unit-testable without needing to reload the
// module after changing an env var — production call sites just call
// isAllowedEmailDomain(email) and get the real configured list for free.
export const isAllowedEmailDomain = (email, domains = allowedEmailDomains) => {
  if (domains.length === 0 || domains.includes('*')) return true
  const domain = String(email).split('@')[1]?.toLowerCase()
  return !!domain && domains.includes(domain)
}
