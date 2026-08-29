require("dotenv").config();

const express = require("express");
const { connect, getDb } = require("./db");
const { seedAdmin, seedRooms } = require("./seed");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const bookingRoutes = require("./routes/bookings");
const bookmarkRoutes = require("./routes/bookmarks");

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// Ping MongoDB and return whether the API and database are up.
async function health(req, res) {
  try {
    await getDb().command({ ping: 1 });
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, db: "disconnected" });
  }
}

app.get("/api/health", health);

const port = process.env.PORT || 5001;

// Seed admin and sample rooms, then start the HTTP server.
async function startServer() {
  await seedAdmin();
  await seedRooms();
  app.listen(port, onListening);
}

// Log the local URL once Express is listening.
function onListening() {
  console.log(`Server running on http://localhost:${port}`);
}

// Print the error and exit if MongoDB cannot be reached.
function onConnectError(err) {
  console.error("Failed to connect to MongoDB");
  console.error(err.message);
  process.exit(1);
}

connect().then(startServer).catch(onConnectError);
