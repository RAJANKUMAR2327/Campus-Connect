import User from '../models/User.js'

// A "connection" is a MUTUAL follow (both users follow each other) — the
// meaning used by privacy.profileVisibility === 'connections'. A one-way
// follow (I follow you, you don't follow me back) is not a connection.
const isMutualConnection = (userA, userB) =>
  userA.following.some((id) => id.toString() === userB._id.toString()) &&
  userB.following.some((id) => id.toString() === userA._id.toString())

// SECURITY FIX: this is now the ONE place profile-visibility + blocking is
// decided, reused by getPublicProfile AND getFollowers/getFollowing below.
// Previously getFollowers/getFollowing had NO privacy or blocking check at
// all — anyone could see anyone's full follower/following list regardless
// of profileVisibility or even an active block, which also meant social
// connections were enumerable even on a fully private profile. That gap
// was in code from this same feature pass, not the original codebase —
// fixing it here rather than letting it stand.
const canViewProfile = (viewer, target) => {
  if (viewer._id.toString() === target._id.toString()) return true
  if (viewer.hasBlocked(target._id) || target.hasBlocked(viewer._id)) return false

  const visibility = target.privacy?.profileVisibility || 'college'
  if (visibility === 'everyone') return true
  if (visibility === 'college') return !!viewer.college && viewer.college === target.college
  if (visibility === 'connections') return isMutualConnection(viewer, target)
  return false
}

// ─── GET PUBLIC PROFILE ────────────────────────────────────────────
// This is new: previously there was no way to view any user's profile
// except your own. Respects privacy.profileVisibility and blocking.
export const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const viewer = req.user

    const target = await User.findById(userId)
      .select('name avatar branch year college email privacy followers following blockedUsers isDeactivated createdAt')
    if (!target || target.isDeactivated) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Blocking is absolute — hides the profile entirely (404, not 403) so
    // existence isn't confirmed to a blocked party either.
    if (viewer.hasBlocked(userId) || target.hasBlocked(viewer._id)) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const isSelf = viewer._id.toString() === userId
    const allowed = canViewProfile(viewer, target)

    if (!allowed) {
      return res.status(403).json({
        message: 'This profile is private.',
        limited: { name: target.name, avatar: target.avatar },
      })
    }

    res.json({
      profile: {
        _id: target._id,
        name: target.name,
        avatar: target.avatar,
        branch: target.branch,
        year: target.year,
        college: target.college,
        email: target.privacy?.showEmail || isSelf ? target.email : undefined,
        followerCount: target.followers.length,
        followingCount: target.following.length,
        isSelf,
        isFollowing: isSelf ? undefined : viewer.isFollowing(userId),
        followsYou: isSelf ? undefined : target.isFollowing(viewer._id),
        joinedAt: target.createdAt,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── FOLLOW A USER ──────────────────────────────────────────────────
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params
    const me = req.user

    if (userId === me._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself." })
    }

    const target = await User.findById(userId).select('_id blockedUsers isDeactivated')
    if (!target || target.isDeactivated) {
      return res.status(404).json({ message: 'User not found.' })
    }
    if (me.hasBlocked(userId) || target.blockedUsers.some((id) => id.toString() === me._id.toString())) {
      return res.status(403).json({ message: 'Unable to follow this user.' })
    }

    await User.findByIdAndUpdate(me._id, { $addToSet: { following: userId } })
    await User.findByIdAndUpdate(userId, { $addToSet: { followers: me._id } })

    res.json({ message: 'Followed.' })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── UNFOLLOW A USER ────────────────────────────────────────────────
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params
    const me = req.user

    await User.findByIdAndUpdate(me._id, { $pull: { following: userId } })
    await User.findByIdAndUpdate(userId, { $pull: { followers: me._id } })

    res.json({ message: 'Unfollowed.' })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// ─── LIST FOLLOWERS / FOLLOWING ────────────────────────────────────
// SECURITY FIX: both endpoints now apply the exact same visibility +
// blocking policy as getPublicProfile via canViewProfile() above, instead
// of returning the full list to anyone who was logged in.
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params
    const viewer = req.user

    const target = await User.findById(userId)
      .select('followers following privacy blockedUsers isDeactivated college')
      .populate('followers', 'name avatar branch year college')
    if (!target || target.isDeactivated) return res.status(404).json({ message: 'User not found.' })
    if (viewer.hasBlocked(userId) || target.hasBlocked(viewer._id)) {
      return res.status(404).json({ message: 'User not found.' })
    }
    if (!canViewProfile(viewer, target)) {
      return res.status(403).json({ message: 'This profile is private.' })
    }

    res.json({ followers: target.followers })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params
    const viewer = req.user

    const target = await User.findById(userId)
      .select('following privacy blockedUsers isDeactivated college')
      .populate('following', 'name avatar branch year college')
    if (!target || target.isDeactivated) return res.status(404).json({ message: 'User not found.' })
    if (viewer.hasBlocked(userId) || target.hasBlocked(viewer._id)) {
      return res.status(404).json({ message: 'User not found.' })
    }
    if (!canViewProfile(viewer, target)) {
      return res.status(403).json({ message: 'This profile is private.' })
    }

    res.json({ following: target.following })
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}
