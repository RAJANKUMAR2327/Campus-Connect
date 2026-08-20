import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verify your CampusConnect account',
    html: `
      <h2>Welcome to CampusConnect!</h2>
      <p>Click the link below to verify your college email:</p>
      <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  })
}

export const sendPasswordResetEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your CampusConnect password',
    html: `
      <h2>Password Reset</h2>
      <p>Click below to reset your password. Link expires in 1 hour.</p>
      <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Reset Password
      </a>
    `,
  })
}

// SECURITY FIX (AUTH-05): sent instead of a distinguishing HTTP response
// when someone tries to register with an email that's already in use —
// see authController.js's register(). Keeps the API response identical
// either way (matching the existing enumeration-hardening on login and
// forgotPassword), while still letting the real account owner know what
// happened, in case they'd genuinely forgotten they already had an
// account or someone else is probing their email.
export const sendAccountExistsEmail = async (to) => {
  const url = `${process.env.CLIENT_URL}/login`
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Someone tried to sign up with your email',
    html: `
      <h2>Already have an account?</h2>
      <p>Someone just tried to create a new CampusConnect account using this email address, but you already have one.</p>
      <p>If this was you, you can just log in as usual — no need to sign up again.</p>
      <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
        Log In
      </a>
      <p>If this wasn't you, no action is needed — your account is safe and no new account was created.</p>
    `,
  })
}
export const sendDigestEmail = async (to, name, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `📬 Your CampusConnect Digest, ${name}`,
    html,
  })
}