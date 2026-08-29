const { getDb } = require("./db");

const sampleRooms = [
  {
    name: "Standard Room",
    description: "A cozy room with a queen bed, desk, and city view.",
    price: 80,
    quantity: 5,
    amenities: ["WiFi", "TV", "Air conditioning"],
  },
  {
    name: "Deluxe Room",
    description: "A larger room with a king bed and sitting area.",
    price: 120,
    quantity: 3,
    amenities: ["WiFi", "TV", "Air conditioning", "Minibar"],
  },
  {
    name: "Suite",
    description: "A spacious suite with a separate living room and bathtub.",
    price: 200,
    quantity: 2,
    amenities: ["WiFi", "TV", "Air conditioning", "Minibar", "Bathtub"],
  },
];

// Create the admin user from env values if that email is not already in the database.
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  const users = getDb().collection("users");
  const existing = await users.findOne({ email });
  if (existing) {
    return;
  }

  await users.insertOne({
    name: "Admin",
    email,
    password,
    role: "admin",
  });
  console.log("Seeded admin user:", email);
}

// Insert sample rooms if the rooms collection is empty.
async function seedRooms() {
  const rooms = getDb().collection("rooms");
  const count = await rooms.countDocuments();
  if (count > 0) {
    return;
  }

  await rooms.insertMany(sampleRooms);
  console.log("Seeded sample rooms:", sampleRooms.length);
}

module.exports = { seedAdmin, seedRooms };
