const express = require("express");
const { getDb } = require("../db");
const { parseId, requireUser } = require("../requireUser");
const { parseDate, getAvailableCount } = require("../availability");

const router = express.Router();

// Return the bookings collection.
function bookings() {
  return getDb().collection("bookings");
}

// Return the rooms collection.
function rooms() {
  return getDb().collection("rooms");
}

// List bookings for the logged-in user. Send userId as a query param.
async function listBookings(req, res) {
  const user = await requireUser(req, res);
  if (!user) {
    return;
  }

  const list = await bookings().find({ userId: user._id }).toArray();
  res.json(list);
}

// Create a booking if the room has availability for those dates.
async function createBooking(req, res) {
  const user = await requireUser(req, res);
  if (!user) {
    return;
  }

  const { roomId, checkIn, checkOut } = req.body || {};
  const roomObjectId = parseId(roomId);
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);

  if (!roomObjectId || !start || !end) {
    return res.status(400).json({ error: "roomId, checkIn, and checkOut are required" });
  }
  if (end <= start) {
    return res.status(400).json({ error: "checkOut must be after checkIn" });
  }

  const room = await rooms().findOne({ _id: roomObjectId });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const availableCount = await getAvailableCount(room, start, end);
  if (availableCount <= 0) {
    return res.status(409).json({ error: "No rooms available for those dates" });
  }

  const booking = {
    userId: user._id,
    roomId: room._id,
    checkIn: start,
    checkOut: end,
  };
  const result = await bookings().insertOne(booking);
  res.status(201).json({ ...booking, _id: result.insertedId });
}

router.get("/", listBookings);
router.post("/", createBooking);

module.exports = router;
