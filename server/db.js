const { MongoClient } = require("mongodb");

let db;

// Connect to MongoDB using MONGODB_URI and keep the database handle.
async function connect() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

// Return the connected database, or throw if connect() has not run yet.
function getDb() {
  if (!db) {
    throw new Error("Database is not connected");
  }
  return db;
}

module.exports = { connect, getDb };
