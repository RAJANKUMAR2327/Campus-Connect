import rateLimit from 'express-rate-limit'

// Tight limit on login: the classic brute-force target. Keyed by IP.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Registration abuse / spam-account creation
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many accounts created from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Password reset requests — prevents email-bombing a target and limits token-guessing
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many password reset requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// AI proxy calls cost real money per request — keep this tight
export const aiChatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: { message: 'Too many AI requests. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
})
export const adminActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// NEW: data export queries 15 collections at once — cheap to abuse by
// spamming the button, expensive for the DB if someone does. Generous
// enough that a real user re-downloading a few times never hits it.
export const dataExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many export requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})
