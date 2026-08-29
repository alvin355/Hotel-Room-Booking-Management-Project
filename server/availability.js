const { getDb } = require("./db");

// Return the bookings collection.
function bookings() {
  return getDb().collection("bookings");
}

// Parse a date string; return null if it is missing or invalid.
function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

// Count how many units of this room are still free for the given dates.
async function getAvailableCount(room, checkIn, checkOut) {
  const overlapping = await bookings().countDocuments({
    roomId: room._id,
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
  return room.quantity - overlapping;
}

module.exports = { parseDate, getAvailableCount };