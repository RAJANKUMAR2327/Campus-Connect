import RideOffer from '../models/RideOffer.js'
import { createNotification } from './notificationController.js'
import { sendServerError } from '../utils/errorResponse.js'

export const createRide = async (req, res) => {
  try {
    const {
      type, fromLocation, toLocation, fromCoords, toCoords,
      departureTime, isRecurring, recurringDays,
      totalSeats, pricePerSeat, vehicleType, vehicleInfo, notes,
    } = req.body

    const ride = await RideOffer.create({
      driver: req.user._id, type,
      fromLocation, toLocation, fromCoords, toCoords,
      departureTime, isRecurring,
      recurringDays: recurringDays ? JSON.parse(recurringDays) : [],
      totalSeats: Number(totalSeats) || 3,
      availableSeats: Number(totalSeats) || 3,
      pricePerSeat: Number(pricePerSeat) || 0,
      vehicleType, vehicleInfo, notes,
      college: req.user.college,
    })

    await ride.populate('driver', 'name avatar branch year')
    res.status(201).json({ message: 'Ride posted!', ride })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getRides = async (req, res) => {
  try {
    const { type, search, date, page = 1, limit = 15 } = req.query
    const filter = { college: req.user.college, status: 'active' }

    if (type) filter.type = type
    if (search) filter.$text = { $search: search }
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0)
      const end = new Date(date); end.setHours(23, 59, 59, 999)
      filter.departureTime = { $gte: start, $lte: end }
    } else {
      filter.departureTime = { $gte: new Date() }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [rides, total] = await Promise.all([
      RideOffer.find(filter).sort({ departureTime: 1 }).skip(skip).limit(Number(limit))
        .populate('driver', 'name avatar branch year')
        .populate('passengers.user', 'name avatar'),
      RideOffer.countDocuments(filter),
    ])

    res.json({ rides, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const getMyRides = async (req, res) => {
  try {
    const offered = await RideOffer.find({ driver: req.user._id }).sort({ departureTime: -1 })
      .populate('passengers.user', 'name avatar')
    const joined = await RideOffer.find({ 'passengers.user': req.user._id }).sort({ departureTime: -1 })
      .populate('driver', 'name avatar branch year')

    res.json({ offered, joined })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const joinRide = async (req, res) => {
  try {
    const ride = await RideOffer.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Ride not found.' })

    if (ride.driver.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Can't join your own ride." })
    }
    if (ride.availableSeats <= 0) return res.status(400).json({ message: 'No seats available.' })

    const alreadyJoined = ride.passengers.some(p => p.user.toString() === req.user._id.toString())
    if (alreadyJoined) return res.status(400).json({ message: 'Already requested this ride.' })

    ride.passengers.push({ user: req.user._id })
    await ride.save()

    await createNotification({
      recipient: ride.driver,
      type: 'system',
      title: 'New ride request',
      message: `${req.user.name} wants to join your ride to ${ride.toLocation}`,
      link: '/rides/my-rides',
      actor: req.user._id,
    })

    res.json({ message: 'Request sent to driver!' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const respondToPassenger = async (req, res) => {
  try {
    const { passengerId, action } = req.body
    const ride = await RideOffer.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Ride not found.' })
    if (ride.driver.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized.' })

    const passenger = ride.passengers.find(p => p.user.toString() === passengerId)
    if (!passenger) return res.status(404).json({ message: 'Passenger not found.' })

    if (action === 'confirm') {
      if (ride.availableSeats <= 0) return res.status(400).json({ message: 'No seats left.' })
      passenger.status = 'confirmed'
      ride.availableSeats -= 1
    } else {
      passenger.status = 'cancelled'
    }

    await ride.save()

    await createNotification({
      recipient: passengerId,
      type: 'system',
      title: action === 'confirm' ? '🎉 Ride confirmed!' : 'Ride request declined',
      message: `Your ride request to ${ride.toLocation} was ${action === 'confirm' ? 'confirmed' : 'declined'}`,
      link: '/rides/my-rides',
      actor: req.user._id,
    })

    res.json({ message: `Passenger ${action}ed!` })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const cancelMyJoin = async (req, res) => {
  try {
    const ride = await RideOffer.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Ride not found.' })

    const passenger = ride.passengers.find(p => p.user.toString() === req.user._id.toString())
    if (!passenger) return res.status(404).json({ message: 'You are not part of this ride.' })

    if (passenger.status === 'confirmed') ride.availableSeats += 1
    ride.passengers = ride.passengers.filter(p => p.user.toString() !== req.user._id.toString())
    await ride.save()

    res.json({ message: 'Left the ride.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const cancelRide = async (req, res) => {
  try {
    const ride = await RideOffer.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Not found.' })
    if (ride.driver.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized.' })

    ride.status = 'cancelled'
    await ride.save()

    // PERFORMANCE FIX (DB-05): see clubController.js's identical fix —
    // sequential per-passenger awaits replaced with a concurrent
    // Promise.all. Ride passenger counts are typically small, but this
    // was the same non-scaling pattern regardless.
    await Promise.all(
      ride.passengers.map((p) => createNotification({
        recipient: p.user,
        type: 'system',
        title: 'Ride cancelled',
        message: `The ride to ${ride.toLocation} has been cancelled by the driver`,
        link: '/rides',
      }))
    )

    res.json({ message: 'Ride cancelled.' })
  } catch (err) {
    sendServerError(res, err)
  }
}

export const deleteRide = async (req, res) => {
  try {
    const ride = await RideOffer.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: 'Not found.' })
    if (ride.driver.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }
    await ride.deleteOne()
    res.json({ message: 'Deleted.' })
  } catch (err) {
    sendServerError(res, err)
  }
}