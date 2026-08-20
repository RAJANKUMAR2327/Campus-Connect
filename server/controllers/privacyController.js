import User from '../models/User.js'

// ─── GET MY PRIVACY SETTINGS ───────────────────────────────────────
export const getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacy blockedUsers')
    res.json({
      privacy: user.privacy,
      blockedCount: user.blockedUsers.length,
    })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── UPDATE MY PRIVACY SETTINGS ────────────────────────────────────
export const updatePrivacySettings = async (req, res) => {
  try {
    const { profileVisibility, whoCanMessage, showEmail } = req.body

    const allowedVisibility = ['everyone', 'college', 'connections']
    const allowedMessage = ['everyone', 'college', 'nobody']

    if (profileVisibility && !allowedVisibility.includes(profileVisibility)) {
      return res.status(400).json({ message: 'Invalid profileVisibility value.' })
    }
    if (whoCanMessage && !allowedMessage.includes(whoCanMessage)) {
      return res.status(400).json({ message: 'Invalid whoCanMessage value.' })
    }

    const update = {}
    if (profileVisibility) update['privacy.profileVisibility'] = profileVisibility
    if (whoCanMessage) update['privacy.whoCanMessage'] = whoCanMessage
    if (typeof showEmail === 'boolean') update['privacy.showEmail'] = showEmail

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    }).select('privacy')

    res.json({ message: 'Privacy settings updated.', privacy: user.privacy })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── BLOCK A USER ───────────────────────────────────────────────────
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't block yourself." })
    }

    const targetUser = await User.findById(userId).select('_id')
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } })

    res.json({ message: 'User blocked.' })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── UNBLOCK A USER ─────────────────────────────────────────────────
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } })
    res.json({ message: 'User unblocked.' })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── LIST BLOCKED USERS ─────────────────────────────────────────────
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('blockedUsers')
      .populate('blockedUsers', 'name avatar branch year college')

    res.json({ blockedUsers: user.blockedUsers })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}
