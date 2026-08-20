import UserStats from '../models/UserStats.js'
import Badge from '../models/Badge.js'
import { createNotification } from '../controllers/notificationController.js'

// XP values per action
// GAM-02 NOTE: a STREAK_BONUS: 10 entry used to live here ("per day of
// streak") but was never actually referenced anywhere else in the
// codebase — the streak *counter* works (see awardXP below) and can
// unlock streak-type badges, but no code path ever paid out the implied
// "bonus XP for maintaining a streak." Removed as confirmed-dead
// configuration rather than silently wired in — actually adding a new
// XP-earning mechanic would change game balance/economics, which is a
// product decision, not a bug fix.
export const XP_VALUES = {
  UPLOAD_NOTE: 20,
  DOWNLOAD_NOTE: 2,
  CREATE_EVENT: 15,
  ATTEND_EVENT: 10,
  CREATE_POST: 5,
  COMMENT: 3,
  COMPLETE_QUIZ: 15,
  ADD_QUESTION: 10,
  RESOLVE_LOST_FOUND: 25,
  JOIN_CLUB: 5,
  JOIN_STUDY_GROUP: 5,
  MENTORSHIP_SESSION: 30,
  DAILY_LOGIN: 5,
}

// Level thresholds (cumulative XP needed)
export const getLevel = (xp) => {
  let level = 1
  let threshold = 100
  let totalNeeded = 0
  while (xp >= totalNeeded + threshold) {
    totalNeeded += threshold
    level++
    threshold = Math.floor(threshold * 1.3)
  }
  return { level, currentXP: xp - totalNeeded, neededXP: threshold, totalNeeded }
}

// Award XP and check for level up + badges
// CONCURRENCY FIX (GAM-01): this used to be a classic read-modify-write —
// `findOne`, mutate the document in memory, `save()` — with no atomic
// operation guaranteeing an increment isn't lost if two XP-earning
// actions for the same user race each other (plausible under rapid
// actions, or two requests genuinely in flight at once). The core
// xp/stat-counter/history fields are now updated via a single atomic
// findOneAndUpdate using $inc and $push — MongoDB guarantees these can't
// stomp on each other the way two racing save() calls could.
//
// Streak tracking is kept as a separate step, deliberately not folded
// into the same atomic op: it depends on reading the current
// lastActiveDate to decide whether to increment or reset, which is
// inherently a read-then-conditionally-write operation, not a simple
// counter. Making that fully atomic too would need a much more complex
// aggregation-pipeline update for a proportionately much smaller risk —
// the worst case under a genuine same-millisecond race here is an
// occasional miscounted streak day, not lost XP.
export const awardXP = async (userId, action, statField = null) => {
  try {
    const xpAmount = XP_VALUES[action] || 0
    if (xpAmount === 0) return null

    const inc = { xp: xpAmount, periodXp: xpAmount }
    if (statField) inc[`stats.${statField}`] = 1

    const stats = await UserStats.findOneAndUpdate(
      { user: userId },
      {
        $inc: inc,
        $push: { xpHistory: { $each: [{ action, xp: xpAmount }], $slice: -100 } },
        $setOnInsert: { user: userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    const oldXP = stats.xp - xpAmount
    const oldLevel = getLevel(oldXP).level
    const newLevel = getLevel(stats.xp).level

    // Streak update — see comment above for why this isn't part of the
    // atomic operation.
    const today = new Date().toDateString()
    const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate).toDateString() : null
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    if (lastActive !== today) {
      const newStreak = lastActive === yesterday ? stats.streak + 1 : 1
      await UserStats.updateOne(
        { user: userId },
        { $set: { streak: newStreak, lastActiveDate: new Date() } }
      )
      stats.streak = newStreak
    }

    // Level up notification
    if (newLevel > oldLevel) {
      await createNotification({
        recipient: userId,
        type: 'system',
        title: `🎉 Level Up! You're now Level ${newLevel}`,
        message: `Keep going! You've earned ${stats.xp} XP total.`,
        link: '/profile',
      })
    }

    // Check badges
    const badgeBonusXP = await checkAndAwardBadges(userId, stats)

    return {
      xpEarned: xpAmount,
      totalXP: stats.xp + badgeBonusXP, // includes any badge bonus earned in this same call
      level: newLevel,
      leveledUp: newLevel > oldLevel,
    }
  } catch (err) {
    console.error('XP award error:', err.message)
    return null
  }
}

export const checkAndAwardBadges = async (userId, stats) => {
  try {
    const allBadges = await Badge.find()
    const earnedIds = stats.badges.map(b => b.badgeId)

    const newlyEarned = []
    for (const badge of allBadges) {
      if (earnedIds.includes(badge.badgeId)) continue

      let qualifies = false
      const { type, field, threshold } = badge.criteria

      if (type === 'count' && field) {
        qualifies = (stats.stats[field] || 0) >= threshold
      } else if (type === 'streak') {
        qualifies = stats.streak >= threshold
      } else if (type === 'milestone' && field === 'xp') {
        qualifies = stats.xp >= threshold
      }

      if (qualifies) newlyEarned.push(badge)
    }

    if (newlyEarned.length === 0) return 0

    // PERFORMANCE/ATOMICITY FIX (GAM-03): this used to call stats.save()
    // once per newly-qualifying badge inside the loop above — N
    // sequential DB round-trips for a user who crosses several badge
    // thresholds at once (e.g. a big XP milestone), and a failure
    // partway through could leave some badges awarded and others not
    // despite all criteria being met at the same instant. All qualifying
    // badges are now collected first and applied in a single update.
    //
    // Returns the total bonus XP awarded — this update happens via a
    // separate query rather than mutating the `stats` object passed in
    // (unlike the old code's in-place stats.xp += ...), so the caller
    // (awardXP) needs this return value to correctly report the user's
    // true total XP for this action, including any badge bonus earned in
    // the same call.
    const bonusXP = newlyEarned.reduce((sum, b) => sum + b.xpReward, 0)

    await UserStats.updateOne(
      { user: userId },
      {
        $push: { badges: { $each: newlyEarned.map((b) => ({ badgeId: b.badgeId })) } },
        $inc: { xp: bonusXP, periodXp: bonusXP },
      }
    )

    await Promise.all(
      newlyEarned.map((badge) => createNotification({
        recipient: userId,
        type: 'system',
        title: `🏆 Badge Earned: ${badge.name}`,
        message: badge.description,
        link: '/profile',
      }))
    )

    return bonusXP
  } catch (err) {
    console.error('Badge check error:', err.message)
    return 0
  }
}