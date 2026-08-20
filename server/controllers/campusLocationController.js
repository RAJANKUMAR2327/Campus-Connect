import CampusLocation from '../models/CampusLocation.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── GET ALL LOCATIONS (public to logged-in users) ────────────────
export const getLocations = async (req, res) => {
  try {
    const locations = await CampusLocation.find().sort({ createdAt: 1 })
    res.json({ locations })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── ADD LOCATION (admin only) ─────────────────────────────────────
export const createLocation = async (req, res) => {
  try {
    const { name, category, description, latitude, longitude } = req.body
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Name, latitude, and longitude are required.' })
    }

    const location = await CampusLocation.create({
      name, category, description, latitude, longitude, addedBy: req.user._id,
    })
    res.status(201).json({ message: 'Location added!', location })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE LOCATION (admin only) ──────────────────────────────────
export const updateLocation = async (req, res) => {
  try {
    const { name, category, description, latitude, longitude } = req.body
    const location = await CampusLocation.findByIdAndUpdate(
      req.params.id,
      { $set: { name, category, description, latitude, longitude } },
      { new: true, runValidators: true }
    )
    if (!location) return res.status(404).json({ message: 'Location not found.' })
    res.json({ message: 'Updated!', location })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE LOCATION (admin only) ──────────────────────────────────
export const deleteLocation = async (req, res) => {
  try {
    await CampusLocation.findByIdAndDelete(req.params.id)
    res.json({ message: 'Location removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
