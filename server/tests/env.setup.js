// Runs once before the whole test run. Sets fake, non-secret env vars so
// app.js's dotenv.config() has nothing real to load (there IS no committed
// .env in this repo — see the security audit) and every test run is fully
// self-contained and reproducible regardless of who runs it or where.
process.env.JWT_SECRET = 'test-only-secret-do-not-use-in-production'
process.env.JWT_EXPIRES_IN = '1h'
process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
process.env.NODE_ENV = 'test'
// Intentionally NOT set: MONGO_URI (tests use mongodb-memory-server instead),
// EMAIL_HOST (so register() takes the "no email configured" fallback path —
// see authController.js), CLOUDINARY_*, GEMINI_API_KEY, VAPID_* — none of the
// tests in this suite exercise those integrations.
