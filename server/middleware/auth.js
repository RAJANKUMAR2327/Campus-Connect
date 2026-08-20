import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Protect any route — must be logged in
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' })
    }

    // A deleted (anonymized) account should behave, from every other
    // client's perspective, exactly as if the document were gone — but see
    // User.js for why we keep the document itself around.
    if (user.isDeleted) {
      return res.status(401).json({ message: 'User no longer exists.' })
    }

    // NEW: a deactivated account can't use any API until the owner logs in
    // again (which reactivates it — see authController.login). This is the
    // single enforcement point for every one of the 43+ route groups, so a
    // deactivated user genuinely can't act anywhere in the app with a
    // pre-existing token, without needing to touch every controller.
    if (user.isDeactivated) {
      return res.status(401).json({
        message: 'This account is deactivated. Log in again to reactivate it.',
        deactivated: true,
      })
    }

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.' })
  }
}