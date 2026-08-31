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
// Pass excludeBookingId when checking availability for a booking being edited,
// so it doesn't count itself as taking up a room.
async function getAvailableCount(room, checkIn, checkOut, excludeBookingId) {
  const query = {
    roomId: room._id,
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  const overlapping = await bookings().countDocuments(query);
  return room.quantity - overlapping;
}

module.exports = { parseDate, getAvailableCount };