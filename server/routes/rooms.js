const express = require("express");
const { getDb } = require("../db");
const { parseId, requireAdmin } = require("../requireUser");
const { parseDate, getAvailableCount } = require("../availability");

const router = express.Router();

// Return the rooms collection.
function rooms() {
  return getDb().collection("rooms");
}

// List rooms sorted by price; if checkIn and checkOut are set, only rooms with availability are returned.
async function listRooms(req, res) {
  const order = req.query.sort === "desc" ? -1 : 1;
  const list = await rooms().find().sort({ price: order }).toArray();
  const checkIn = parseDate(req.query.checkIn);
  const checkOut = parseDate(req.query.checkOut);

  if (!checkIn || !checkOut) {
    return res.json(list);
  }

  const available = [];
  for (const room of list) {
    const availableCount = await getAvailableCount(room, checkIn, checkOut);
    if (availableCount > 0) {
      available.push({ ...room, availableCount });
    }
  }
  res.json(available);
}

// Return one room by id.
async function getRoom(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid room id" });
  }

  const room = await rooms().findOne({ _id: id });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const checkIn = parseDate(req.query.checkIn);
  const checkOut = parseDate(req.query.checkOut);
  if (checkIn && checkOut) {
    const availableCount = await getAvailableCount(room, checkIn, checkOut);
    return res.json({ ...room, availableCount });
  }

  res.json(room);
}

// Create a room (admin). Send userId in the JSON body.
async function createRoom(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  const { name, description, price, quantity, amenities } = req.body || {};
  if (!name || price === undefined || quantity === undefined) {
    return res
      .status(400)
      .json({ error: "name, price, and quantity are required" });
  }

  const room = {
    name,
    description: description || "",
    price: Number(price),
    quantity: Number(quantity),
    amenities: amenities || [],
  };
  const result = await rooms().insertOne(room);
  res.status(201).json({ ...room, _id: result.insertedId });
}

// Update a room's fields (admin). Send userId in the JSON body.
async function updateRoom(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid room id" });
  }

  const existing = await rooms().findOne({ _id: id });
  if (!existing) {
    return res.status(404).json({ error: "Room not found" });
  }

  const { name, description, price, quantity, amenities } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  if (price !== undefined) update.price = Number(price);
  if (quantity !== undefined) update.quantity = Number(quantity);
  if (amenities !== undefined) update.amenities = amenities;

  await rooms().updateOne({ _id: id }, { $set: update });
  res.json({ ...existing, ...update });
}

// Delete a room (admin). Send userId as a query param.
async function deleteRoom(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid room id" });
  }

  const result = await rooms().deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Room not found" });
  }

  await getDb().collection("bookmarks").deleteMany({ roomId: id });
  res.json({ ok: true });
}

router.get("/", listRooms);
router.get("/:id", getRoom);
router.post("/", createRoom);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

module.exports = router;
