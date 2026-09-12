import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env.local first.");
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");

  await Promise.all([
    db.collection("camps").deleteMany({}),
    db.collection("rooms").deleteMany({}),
    db.collection("residents").deleteMany({}),
    db.collection("bookings").deleteMany({}),
  ]);

  const camps = await db.collection("camps").insertMany([
    {
      name: "Main Village",
      code: "MV01",
      siteName: "Iron Ridge Mine",
      location: "Pilbara, WA",
      capacity: 420,
      status: "active",
      notes: "Primary FIFO village with mess and wet mess.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Exploration Camp",
      code: "EX02",
      siteName: "Iron Ridge Mine",
      location: "North Lease",
      capacity: 80,
      status: "active",
      notes: "Short-stay contractor camp.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const mainVillageId = camps.insertedIds[0];
  const explorationId = camps.insertedIds[1];

  const roomDocs = [];
  for (let i = 1; i <= 12; i++) {
    roomDocs.push({
      campId: mainVillageId,
      block: i <= 6 ? "A" : "B",
      roomNumber: String(i).padStart(2, "0"),
      type: i % 5 === 0 ? "ensuite" : i % 3 === 0 ? "twin" : "single",
      beds: i % 3 === 0 ? 2 : 1,
      status: i % 7 === 0 ? "maintenance" : i % 4 === 0 ? "occupied" : "available",
      amenities: i % 5 === 0 ? ["ensuite", "desk", "AC"] : ["shared bathroom", "AC"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  for (let i = 1; i <= 6; i++) {
    roomDocs.push({
      campId: explorationId,
      block: "N",
      roomNumber: String(i).padStart(2, "0"),
      type: i === 6 ? "accessible" : "single",
      beds: 1,
      status: i <= 2 ? "occupied" : "available",
      amenities: ["donga", "AC"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const rooms = await db.collection("rooms").insertMany(roomDocs);

  const residents = await db.collection("residents").insertMany([
    {
      employeeId: "EMP-1001",
      firstName: "Maya",
      lastName: "Nguyen",
      company: "Iron Ridge Ops",
      role: "operator",
      roster: "2/1",
      phone: "0400 111 001",
      email: "maya.nguyen@example.com",
      emergencyContact: "A. Nguyen 0400 000 111",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      employeeId: "EMP-1002",
      firstName: "Jordan",
      lastName: "Blake",
      company: "Iron Ridge Ops",
      role: "supervisor",
      roster: "8/6",
      phone: "0400 111 002",
      email: "jordan.blake@example.com",
      emergencyContact: "S. Blake 0400 000 222",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      employeeId: "CTR-2201",
      firstName: "Priya",
      lastName: "Singh",
      company: "Northstar Contractors",
      role: "contractor",
      roster: "14/7",
      phone: "0400 222 201",
      email: "priya.singh@example.com",
      emergencyContact: "R. Singh 0400 000 333",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      employeeId: "VIS-010",
      firstName: "Tom",
      lastName: "Ellis",
      company: "Safety Audit Co",
      role: "visitor",
      roster: "adhoc",
      phone: "0400 333 010",
      email: "tom.ellis@example.com",
      emergencyContact: "",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const today = new Date();
  const inSeven = new Date(today);
  inSeven.setDate(today.getDate() + 7);
  const inFourteen = new Date(today);
  inFourteen.setDate(today.getDate() + 14);

  await db.collection("bookings").insertMany([
    {
      residentId: residents.insertedIds[0],
      roomId: rooms.insertedIds[3],
      campId: mainVillageId,
      checkIn: today,
      checkOut: inSeven,
      status: "checked_in",
      purpose: "roster",
      notes: "Swing A",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      residentId: residents.insertedIds[1],
      roomId: rooms.insertedIds[7],
      campId: mainVillageId,
      checkIn: today,
      checkOut: inFourteen,
      status: "checked_in",
      purpose: "roster",
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      residentId: residents.insertedIds[2],
      roomId: rooms.insertedIds[12],
      campId: explorationId,
      checkIn: today,
      checkOut: inSeven,
      status: "reserved",
      purpose: "shutdown",
      notes: "Planned maintenance crew",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log("Seeded AMS sample data:");
  console.log(`  camps: ${Object.keys(camps.insertedIds).length}`);
  console.log(`  rooms: ${Object.keys(rooms.insertedIds).length}`);
  console.log(`  residents: ${Object.keys(residents.insertedIds).length}`);
  console.log("  bookings: 3");

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
