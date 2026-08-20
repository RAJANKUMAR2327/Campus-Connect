import DigestPreference from '../models/DigestPreference.js'
import { buildDigestData } from '../utils/digestBuilder.js'
import { buildDigestHTML } from '../utils/digestEmailTemplate.js'
import { sendDigestEmail } from '../utils/email.js'
import { sendServerError } from '../utils/errorResponse.js'

export const getMyPreferences = async (req, res) => {
  try {
    let pref = await DigestPreference.findOne({ user: req.user._id })
    if (!pref) pref = await DigestPreference.create({ user: req.user._id })
    res.json({ preferences: pref })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const updatePreferences = async (req, res) => {
  try {
    const { enabled, frequency, sections } = req.body
    const pref = await DigestPreference.findOneAndUpdate(
      { user: req.user._id },
      { enabled, frequency, sections },
      { new: true, upsert: true }
    )
    res.json({ message: 'Preferences updated!', preferences: pref })
  } catch (err) {
    sendServerError(res, err)
  }
}

// Manual "send me a preview now" trigger
export const sendPreviewDigest = async (req, res) => {
  try {
    const pref = await DigestPreference.findOne({ user: req.user._id })
    const sections = pref?.sections || {
      notes: true, events: true, placements: true,
      marketplace: false, gamification: true, mentorship: true,
    }

    const data = await buildDigestData(req.user, sections, pref?.frequency === 'daily' ? 1 : 7)
    const html = buildDigestHTML(data)
    await sendDigestEmail(req.user.email, req.user.name, html)

    res.json({ message: 'Preview digest sent to your email!' })
  } catch (err) {
    sendServerError(res, err)
  }
}