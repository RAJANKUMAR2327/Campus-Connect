import express from 'express'
import {
  createSurvey, getSurveys, getSurveyById,
  submitResponse, getResults, getMySurveys,
  closeSurvey, deleteSurvey,
} from '../controllers/surveyController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, getSurveys)
router.get('/my-surveys', protect, getMySurveys)
router.get('/:id', protect, getSurveyById)
router.get('/:id/results', protect, getResults)
router.post('/', protect, createSurvey)
router.post('/:id/responses', protect, submitResponse)
router.patch('/:id/close', protect, closeSurvey)
router.delete('/:id', protect, deleteSurvey)

export default router