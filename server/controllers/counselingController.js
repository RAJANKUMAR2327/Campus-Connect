import CounselingSlot from '../models/CounselingSlot.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── CREATE SLOT (admin only) ────────────────────────────────────────
export const createSlot = async (req, res) => {
  try {
    const { counselorName, specialization, date, startTime, durationMinutes, location } = req.body
    if (!counselorName || !date || !startTime) {
      return res.status(400).json({ message: 'Counselor name, date, and start time are required.' })
    }

    const slot = await CounselingSlot.create({
      counselorName, specialization, date, startTime, durationMinutes, location,
      createdBy: req.user._id,
    })
    res.status(201).json({ message: 'Slot added!', slot })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET AVAILABLE SLOTS (students see availability, not who booked what) ──
export const getSlots = async (req, res) => {
  try {
    const slots = await CounselingSlot.find({ date: { $gte: new Date(new Date().toDateString()) } })
      .sort({ date: 1, startTime: 1 })
      .select('counselorName specialization date startTime durationMinutes location isBooked bookedBy')

    // Only reveal the identity of the booking to the student who made it (or an admin)
    const shaped = slots.map(s => {
      const obj = s.toObject()
      const isMine = obj.bookedBy?.toString() === req.user._id.toString()
      if (!isMine && req.user.role !== 'admin') delete obj.bookedBy
      return obj
    })

    res.json({ slots: shaped })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET MY BOOKED SLOTS ─────────────────────────────────────────────
export const getMyBookings = async (req, res) => {
  try {
    const slots = await CounselingSlot.find({ bookedBy: req.user._id }).sort({ date: 1, startTime: 1 })
    res.json({ slots })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── BOOK A SLOT ──────────────────────────────────────────────────────
export const bookSlot = async (req, res) => {
  try {
    const { note } = req.body
    const slot = await CounselingSlot.findOneAndUpdate(
      { _id: req.params.id, isBooked: false },
      { isBooked: true, bookedBy: req.user._id, bookingNote: note },
      { new: true }
    )
    if (!slot) return res.status(400).json({ message: 'This slot is no longer available.' })
    res.json({ message: 'Booked! Your appointment is confirmed.', slot })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── CANCEL MY BOOKING ────────────────────────────────────────────────
export const cancelBooking = async (req, res) => {
  try {
    const slot = await CounselingSlot.findOneAndUpdate(
      { _id: req.params.id, bookedBy: req.user._id },
      { isBooked: false, bookedBy: null, bookingNote: '' },
      { new: true }
    )
    if (!slot) return res.status(404).json({ message: 'Booking not found.' })
    res.json({ message: 'Booking cancelled.', slot })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE SLOT (admin only) ─────────────────────────────────────────
export const deleteSlot = async (req, res) => {
  try {
    await CounselingSlot.findByIdAndDelete(req.params.id)
    res.json({ message: 'Slot removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
