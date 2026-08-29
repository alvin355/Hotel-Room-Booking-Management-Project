const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// Return the users collection.
function users() {
  return getDb().collection("users");
}

// Return user fields that are safe to send back (no password).
function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// Create a customer account and return the new user.
async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  const existing = await users().findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const user = { name, email, password, role: "customer" };
  const result = await users().insertOne(user);
  res.status(201).json(publicUser({ ...user, _id: result.insertedId }));
}

// Check email and password and return the matching user.
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await users().findOne({ email, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json(publicUser(user));
}

router.post("/register", register);
router.post("/login", login);

module.exports = router;
