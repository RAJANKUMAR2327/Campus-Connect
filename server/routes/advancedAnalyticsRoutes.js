import express from 'express'
import {
  getPlatformOverview, getGrowthTrends, getFeatureUsage,
  getPlacementInsights, getCollegeBreakdown,
  getEngagementHeatmap, generateReport,
} from '../controllers/advancedAnalyticsController.js'
import { protect } from '../middleware/auth.js'
import { adminOnly } from '../middleware/admin.js'

const router = express.Router()
router.use(protect, adminOnly)

router.get('/overview', getPlatformOverview)
router.get('/growth', getGrowthTrends)
router.get('/feature-usage', getFeatureUsage)
router.get('/placement-insights', getPlacementInsights)
router.get('/colleges', getCollegeBreakdown)
router.get('/heatmap', getEngagementHeatmap)
router.get('/report/:type', generateReport)

export default router