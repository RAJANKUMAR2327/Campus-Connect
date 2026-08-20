import User from '../models/User.js'
import Note from '../models/Note.js'
import Event from '../models/Event.js'
import Listing from '../models/Listing.js'
import LostFound from '../models/LostFound.js'
import Placement from '../models/Placement.js'
import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import StudyGroup from '../models/StudyGroup.js'
import Club from '../models/Club.js'
import MentorshipRequest from '../models/MentorshipRequest.js'
import JobApplication from '../models/JobApplication.js'
import Confession from '../models/Confession.js'
import RideOffer from '../models/RideOffer.js'
import Referral from '../models/Referral.js'
import UserStats from '../models/UserStats.js'
import Message from '../models/Message.js'
import SeatBooking from '../models/SeatBooking.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── PLATFORM OVERVIEW ──────────────────────────────────────────────
export const getPlatformOverview = async (req, res) => {
  try {
    const [
      totalUsers, totalNotes, totalEvents, totalListings,
      totalPosts, totalComments, totalMessages,
      totalStudyGroups, totalClubs, totalMentorships,
      totalApplications, totalConfessions, totalRides, totalReferrals,
      totalBookings,
    ] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments(),
      Event.countDocuments(),
      Listing.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Message.countDocuments(),
      StudyGroup.countDocuments(),
      Club.countDocuments(),
      MentorshipRequest.countDocuments({ status: 'accepted' }),
      JobApplication.countDocuments(),
      Confession.countDocuments(),
      RideOffer.countDocuments(),
      Referral.countDocuments(),
      SeatBooking.countDocuments(),
    ])

    // Active users (logged in / earned XP in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [activeWeekly, activeMonthly] = await Promise.all([
      UserStats.countDocuments({ lastActiveDate: { $gte: weekAgo } }),
      UserStats.countDocuments({ lastActiveDate: { $gte: monthAgo } }),
    ])

    res.json({
      totals: {
        totalUsers, totalNotes, totalEvents, totalListings,
        totalPosts, totalComments, totalMessages,
        totalStudyGroups, totalClubs, totalMentorships,
        totalApplications, totalConfessions, totalRides, totalReferrals,
        totalBookings,
      },
      engagement: {
        activeWeekly, activeMonthly, totalUsers,
        weeklyActiveRate: totalUsers > 0 ? Math.round((activeWeekly / totalUsers) * 100) : 0,
        monthlyActiveRate: totalUsers > 0 ? Math.round((activeMonthly / totalUsers) * 100) : 0,
      },
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GROWTH TRENDS (12 months) ──────────────────────────────────────
export const getGrowthTrends = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const [userGrowth, noteGrowth, eventGrowth, postGrowth] = await Promise.all([
      aggregateByMonth(User, twelveMonthsAgo),
      aggregateByMonth(Note, twelveMonthsAgo),
      aggregateByMonth(Event, twelveMonthsAgo),
      aggregateByMonth(Post, twelveMonthsAgo),
    ])

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const merge = (key) => {
      const map = {}
      const arrays = { users: userGrowth, notes: noteGrowth, events: eventGrowth, posts: postGrowth }
      arrays[key].forEach(item => {
        const label = `${months[item._id.month - 1]} '${String(item._id.year).slice(2)}`
        map[label] = item.count
      })
      return map
    }

    // Build unified timeline
    const timeline = []
    const cursor = new Date(twelveMonthsAgo)
    while (cursor <= new Date()) {
      const label = `${months[cursor.getMonth()]} '${String(cursor.getFullYear()).slice(2)}`
      timeline.push({
        month: label,
        users: merge('users')[label] || 0,
        notes: merge('notes')[label] || 0,
        events: merge('events')[label] || 0,
        posts: merge('posts')[label] || 0,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    res.json({ timeline })
  } catch (err) {
    sendServerError(res, err)
  }
}

async function aggregateByMonth(Model, since) {
  return Model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])
}

// ─── FEATURE USAGE BREAKDOWN ────────────────────────────────────────
export const getFeatureUsage = async (req, res) => {
  try {
    const [
      noteCount, eventCount, listingCount, lostFoundCount,
      placementCount, postCount, studyGroupCount, clubCount,
      mentorshipCount, confessionCount, rideCount, referralCount, bookingCount,
    ] = await Promise.all([
      Note.countDocuments(), Event.countDocuments(), Listing.countDocuments(),
      LostFound.countDocuments(), Placement.countDocuments(), Post.countDocuments(),
      StudyGroup.countDocuments(), Club.countDocuments(), MentorshipRequest.countDocuments(),
      Confession.countDocuments(), RideOffer.countDocuments(), Referral.countDocuments(),
      SeatBooking.countDocuments(),
    ])

    const usage = [
      { feature: 'Notes', count: noteCount },
      { feature: 'Events', count: eventCount },
      { feature: 'Marketplace', count: listingCount },
      { feature: 'Lost & Found', count: lostFoundCount },
      { feature: 'Placement', count: placementCount },
      { feature: 'Social Feed', count: postCount },
      { feature: 'Study Groups', count: studyGroupCount },
      { feature: 'Clubs', count: clubCount },
      { feature: 'Mentorship', count: mentorshipCount },
      { feature: 'Confessions', count: confessionCount },
      { feature: 'Ride Share', count: rideCount },
      { feature: 'Referrals', count: referralCount },
      { feature: 'Library Bookings', count: bookingCount },
    ].sort((a, b) => b.count - a.count)

    res.json({ usage })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── PLACEMENT INSIGHTS ─────────────────────────────────────────────
export const getPlacementInsights = async (req, res) => {
  try {
    const applications = await JobApplication.find()
    const total = applications.length

    const statusCounts = {}
    applications.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1 })

    const offers = applications.filter(a => ['offer', 'accepted'].includes(a.status)).length
    const topCompanies = {}
    applications.forEach(a => { topCompanies[a.company] = (topCompanies[a.company] || 0) + 1 })

    const sortedCompanies = Object.entries(topCompanies)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([company, count]) => ({ company, count }))

    // Branch-wise application activity (join with user)
    const appWithUsers = await JobApplication.find().populate('user', 'branch')
    const branchActivity = {}
    appWithUsers.forEach(a => {
      const branch = a.user?.branch || 'Unknown'
      branchActivity[branch] = (branchActivity[branch] || 0) + 1
    })

    res.json({
      total, offers,
      successRate: total > 0 ? Math.round((offers / total) * 100) : 0,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      topCompanies: sortedCompanies,
      branchActivity: Object.entries(branchActivity).map(([branch, count]) => ({ branch, count })),
    })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── COLLEGE COMPARISON (if multi-college) ──────────────────────────
export const getCollegeBreakdown = async (req, res) => {
  try {
    const breakdown = await User.aggregate([
      { $match: { college: { $exists: true, $ne: '' } } },
      { $group: { _id: '$college', userCount: { $sum: 1 } } },
      { $sort: { userCount: -1 } },
      { $limit: 10 },
    ])

    res.json({ colleges: breakdown.map(c => ({ college: c._id, userCount: c.userCount })) })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ENGAGEMENT HEATMAP (activity by hour/day) ──────────────────────
export const getEngagementHeatmap = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const messages = await Message.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { dayOfWeek: { $dayOfWeek: '$createdAt' }, hour: { $hour: '$createdAt' } }, count: { $sum: 1 } } },
    ])

    const heatmap = Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hour) => {
        const found = messages.find(m => m._id.dayOfWeek === day + 1 && m._id.hour === hour)
        return found ? found.count : 0
      })
    )

    res.json({ heatmap })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── EXPORTABLE REPORT (CSV-ready JSON) ─────────────────────────────
export const generateReport = async (req, res) => {
  try {
    const { type } = req.params

    let data = []
    if (type === 'users') {
      data = await User.find().select('name email branch year college role createdAt isVerified')
    } else if (type === 'notes') {
      data = await Note.find().populate('uploader', 'name email').select('title subject branch year downloadCount createdAt')
    } else if (type === 'placements') {
      data = await JobApplication.find().populate('user', 'name email').select('company role status appliedDate')
    } else if (type === 'events') {
      data = await Event.find().select('title category date venue attendees')
    } else {
      return res.status(400).json({ message: 'Invalid report type.' })
    }

    res.json({ type, count: data.length, data })
  } catch (err) {
    sendServerError(res, err)
  }
}