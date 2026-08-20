import mongoose from 'mongoose'

// DATA-INTEGRITY FIX (DB-02): a short-lived advisory lock used to
// serialize concurrent seat-booking attempts for the same zone+seat+date.
// See libraryController.createBooking for the full explanation, but in
// short: two students booking the same seat/date/overlapping time within
// milliseconds of each other could both pass the "not already booked"
// check before either had committed, since that check and the eventual
// SeatBooking.create() were two separate, non-atomic steps.
//
// This doesn't use a MongoDB multi-document transaction, deliberately —
// transactions require the database to be a replica set, which isn't
// guaranteed for every deployment of this app, and the failure mode of
// wrongly assuming one (every booking attempt throwing "Transaction
// numbers are only allowed on a replica set member or mongos") would be
// worse than the bug this is fixing. A unique index is atomic on any
// MongoDB deployment, standalone or replica set, so this works everywhere.
//
// How it works: before checking for overlaps, acquire the lock by
// inserting a document keyed on exactly the zone+seat+date being booked.
// The unique index makes `create()` atomically fail with a duplicate-key
// error if another request is already holding that same key — MongoDB
// guarantees only one such insert can succeed at a time, so this is a
// correct mutex even though the schema itself is trivial. The lock is
// released in a `finally` block once the booking attempt completes
// (success or failure), and the TTL index below is a safety net that
// auto-expires a lock after 30 seconds in case a crash prevents the
// normal release from ever running.
const bookingLockSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 30 },
})

export default mongoose.model('BookingLock', bookingLockSchema)
