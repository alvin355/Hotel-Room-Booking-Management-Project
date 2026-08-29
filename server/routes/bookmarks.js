const express = require("express");
const { getDb } = require("../db");
const { parseId, requireUser } = require("../requireUser");

const router = express.Router();

// Return the bookmarks collection.
function bookmarks() {
  return getDb().collection("bookmarks");
}

// Return the rooms collection.
function rooms() {
  return getDb().collection("rooms");
}

// List the logged-in user's saved rooms. Send userId as a query param.
async function listBookmarks(req, res) {
  const user = await requireUser(req, res);
  if (!user) {
    return;
  }

  const list = await bookmarks().find({ userId: user._id }).toArray();
  const result = [];
  for (const bookmark of list) {
    const room = await rooms().findOne({ _id: bookmark.roomId });
    if (room) {
      result.push({ ...bookmark, room });
    }
  }
  res.json(result);
}

// Save a room for the logged-in user. Body: { userId, roomId }.
async function addBookmark(req, res) {
  const user = await requireUser(req, res);
  if (!user) {
    return;
  }

  const roomObjectId = parseId(req.body && req.body.roomId);
  if (!roomObjectId) {
    return res.status(400).json({ error: "roomId is required" });
  }

  const room = await rooms().findOne({ _id: roomObjectId });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const existing = await bookmarks().findOne({ userId: user._id, roomId: room._id });
  if (existing) {
    return res.status(409).json({ error: "Room is already saved" });
  }

  const bookmark = { userId: user._id, roomId: room._id };
  const result = await bookmarks().insertOne(bookmark);
  res.status(201).json({ ...bookmark, _id: result.insertedId, room });
}

// Remove a saved room. Send userId as a query param.
async function removeBookmark(req, res) {
  const user = await requireUser(req, res);
  if (!user) {
    return;
  }

  const roomObjectId = parseId(req.params.roomId);
  if (!roomObjectId) {
    return res.status(400).json({ error: "Invalid room id" });
  }

  const result = await bookmarks().deleteOne({ userId: user._id, roomId: roomObjectId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Bookmark not found" });
  }

  res.json({ ok: true });
}

router.get("/", listBookmarks);
router.post("/", addBookmark);
router.delete("/:roomId", removeBookmark);

module.exports = router;
