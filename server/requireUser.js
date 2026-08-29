const { ObjectId } = require("mongodb");
const { getDb } = require("./db");

// Convert a string to ObjectId, or return null if it is not a valid id.
function parseId(id) {
  if (!id || !ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

// Look up a user by id string; return null if missing or invalid.
async function findUserById(userId) {
  const id = parseId(userId);
  if (!id) {
    return null;
  }
  return getDb().collection("users").findOne({ _id: id });
}

// Read userId from the body or query and ensure that user is an admin.
async function requireAdmin(req, res) {
  const userId = (req.body && req.body.userId) || req.query.userId;
  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return null;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return null;
  }
  return user;
}

// Read userId from the body or query and ensure that user exists.
async function requireUser(req, res) {
  const userId = (req.body && req.body.userId) || req.query.userId;
  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return null;
  }
  return user;
}

module.exports = { parseId, findUserById, requireAdmin, requireUser };
