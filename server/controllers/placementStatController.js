import PlacementStat from '../models/PlacementStat.js'
import Placement from '../models/Placement.js'
import { sendServerError } from '../utils/errorResponse.js'

export const addStat = async (req, res) => {
  try {
    const { company, role, package: pkg, branch, year, type } = req.body
    const stat = await PlacementStat.create({
      company, role, branch, type,
      package: Number(pkg),
      year: Number(year),
      college: req.user.college,
      postedBy: req.user._id,
    })
    res.status(201).json({ stat })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getDashboard = async (req, res) => {
  try {
    const { college, year } = req.query
    const filter = {}
    if (college) filter.college = college
    if (year) filter.year = Number(year)

    const stats = await PlacementStat.find(filter)

    // Compute analytics
    const totalPlacements = stats.length
    const avgPackage = stats.length
      ? (stats.reduce((sum, s) => sum + (s.package || 0), 0) / stats.length).toFixed(2)
      : 0
    const maxPackage = stats.length
      ? Math.max(...stats.map(s => s.package || 0))
      : 0

    // Company-wise count
    const companyMap = {}
    stats.forEach(s => {
      companyMap[s.company] = (companyMap[s.company] || 0) + 1
    })
    const topCompanies = Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Branch-wise
    const branchMap = {}
    stats.forEach(s => {
      if (s.branch) branchMap[s.branch] = (branchMap[s.branch] || 0) + 1
    })
    const branchStats = Object.entries(branchMap)
      .map(([branch, count]) => ({ branch, count }))

    // Package distribution
    const packageRanges = {
      'Below 5 LPA': 0,
      '5-10 LPA': 0,
      '10-20 LPA': 0,
      '20-40 LPA': 0,
      'Above 40 LPA': 0,
    }
    stats.forEach(s => {
      const p = s.package || 0
      if (p < 5) packageRanges['Below 5 LPA']++
      else if (p < 10) packageRanges['5-10 LPA']++
      else if (p < 20) packageRanges['10-20 LPA']++
      else if (p < 40) packageRanges['20-40 LPA']++
      else packageRanges['Above 40 LPA']++
    })

    // Year-wise trend
    const yearMap = {}
    stats.forEach(s => {
      yearMap[s.year] = (yearMap[s.year] || 0) + 1
    })
    const yearTrend = Object.entries(yearMap)
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year: Number(year), count }))

    res.json({
      summary: { totalPlacements, avgPackage, maxPackage },
      topCompanies,
      branchStats,
      packageRanges: Object.entries(packageRanges).map(([range, count]) => ({ range, count })),
      yearTrend,
      recentStats: stats.slice(-10).reverse(),
    })
  } catch (err) {
    sendServerError(res, err)
  }
}