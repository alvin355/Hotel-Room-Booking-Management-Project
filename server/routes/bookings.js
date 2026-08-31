const express = require("express");
const { getDb } = require("../db");
const { parseId, requireUser, requireAdmin } = require("../requireUser");
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

// Return the users collection.
function users() {
  return getDb().collection("users");
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

// List every booking with room and customer details attached (admin only).
async function listAllBookings(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  const list = await bookings().find().sort({ checkIn: 1 }).toArray();
  const roomIds = [...new Set(list.map((b) => String(b.roomId)))].map(parseId);
  const userIds = [...new Set(list.map((b) => String(b.userId)))].map(parseId);

  const roomDocs = await rooms().find({ _id: { $in: roomIds } }).toArray();
  const userDocs = await users().find({ _id: { $in: userIds } }).toArray();

  const roomMap = Object.fromEntries(roomDocs.map((r) => [String(r._id), r]));
  const userMap = Object.fromEntries(userDocs.map((u) => [String(u._id), u]));

  const detailed = list.map((booking) => ({
    ...booking,
    room: roomMap[String(booking.roomId)] || null,
    customer: userMap[String(booking.userId)]
      ? {
        name: userMap[String(booking.userId)].name,
        email: userMap[String(booking.userId)].email,
      }
      : null,
  }));

  res.json(detailed);
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

// Delete any booking (admin only).
async function adminDeleteBooking(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid booking id" });
  }

  const result = await bookings().deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Booking not found" });
  }

  res.json({ ok: true });
}

router.get("/", listBookings);
router.get("/admin", listAllBookings);
router.post("/", createBooking);
router.delete("/:id", adminDeleteBooking);

module.exports = router;