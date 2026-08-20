import UserStats from '../models/UserStats.js'
import Badge from '../models/Badge.js'
import User from '../models/User.js'
import { awardXP, getLevel } from '../utils/xpEngine.js'
import { sendServerError } from '../utils/errorResponse.js'

export const getMyStats = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id })
    if (!stats) stats = await UserStats.create({ user: req.user._id })

    // Daily login XP (once per day)
    const today = new Date().toDateString()
    const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate).toDateString() : null
    if (lastActive !== today) {
      await awardXP(req.user._id, 'DAILY_LOGIN')
      stats = await UserStats.findOne({ user: req.user._id })
    }

    const levelInfo = getLevel(stats.xp)
    const allBadges = await Badge.find()
    const earnedBadgeIds = stats.badges.map(b => b.badgeId)

    res.json({
      stats: {
        xp: stats.xp,
        level: levelInfo.level,
        currentXP: levelInfo.currentXP,
        neededXP: levelInfo.neededXP,
        progress: Math.round((levelInfo.currentXP / levelInfo.neededXP) * 100),
        streak: stats.streak,
        stats: stats.stats,
      },
      badges: {
        earned: allBadges.filter(b => earnedBadgeIds.includes(b.badgeId)),
        locked: allBadges.filter(b => !earnedBadgeIds.includes(b.badgeId)),
      },
      recentXP: stats.xpHistory.slice(-10).reverse(),
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getLeaderboard = async (req, res) => {
  try {
    const { scope = 'all', period = 'all-time' } = req.query

    const filter = {}
    if (scope === 'college') filter['user.college'] = req.user.college

    let allStats = await UserStats.find()
      .populate('user', 'name avatar branch year college')
      .sort({ xp: -1 })
      .limit(100)

    if (scope === 'college') {
      allStats = allStats.filter(s => s.user?.college === req.user.college)
    }
    if (scope === 'branch') {
      allStats = allStats.filter(s => s.user?.branch === req.user.branch)
    }

    const leaderboard = allStats.slice(0, 50).map((s, i) => ({
      rank: i + 1,
      user: s.user,
      xp: s.xp,
      level: getLevel(s.xp).level,
      streak: s.streak,
      badgeCount: s.badges.length,
    }))

    // Find current user's rank
    const myIndex = allStats.findIndex(s => s.user?._id.toString() === req.user._id.toString())

    res.json({
      leaderboard,
      myRank: myIndex !== -1 ? myIndex + 1 : null,
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getUserBadges = async (req, res) => {
  try {
    const stats = await UserStats.findOne({ user: req.params.userId })
    if (!stats) return res.json({ badges: [] })

    const allBadges = await Badge.find()
    const earnedBadgeIds = stats.badges.map(b => b.badgeId)
    const earned = allBadges.filter(b => earnedBadgeIds.includes(b.badgeId))

    res.json({ badges: earned, level: getLevel(stats.xp).level, xp: stats.xp })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ category: 1, xpReward: 1 })
    res.json({ badges })
  } catch (err) {
    sendServerError(res, err)
  }
}