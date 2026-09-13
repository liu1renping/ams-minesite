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
    db.collection("houses").deleteMany({}),
    db.collection("bedrooms").deleteMany({}),
    db.collection("camps").deleteMany({}),
    db.collection("rooms").deleteMany({}),
    db.collection("residents").deleteMany({}),
    db.collection("bookings").deleteMany({}),
    db.collection("visitorapplications").deleteMany({}),
  ]);

  const houses = await db.collection("houses").insertMany([
    {
      name: "Riverbend House",
      code: "RB01",
      address: "12 Mine Access Rd",
      suburb: "Newman, WA",
      status: "active",
      notes: "4-bedroom staff house near operations gate.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Acacia Cottage",
      code: "AC02",
      address: "8 Sandplain Close",
      suburb: "Newman, WA",
      status: "active",
      notes: "Quiet 3-bedroom cottage for visitors.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const riverbendId = houses.insertedIds[0];
  const acaciaId = houses.insertedIds[1];

  const bedroomDocs = [
    {
      houseId: riverbendId,
      label: "Master Bedroom",
      type: "ensuite",
      beds: 1,
      status: "available",
      amenities: ["ensuite", "queen bed", "AC"],
    },
    {
      houseId: riverbendId,
      label: "Bedroom 2",
      type: "double",
      beds: 1,
      status: "available",
      amenities: ["double bed", "AC"],
    },
    {
      houseId: riverbendId,
      label: "Bedroom 3",
      type: "twin",
      beds: 2,
      status: "occupied",
      amenities: ["twin beds", "AC"],
    },
    {
      houseId: riverbendId,
      label: "Bedroom 4",
      type: "single",
      beds: 1,
      status: "available",
      amenities: ["single bed", "desk"],
    },
    {
      houseId: acaciaId,
      label: "Master Bedroom",
      type: "ensuite",
      beds: 1,
      status: "available",
      amenities: ["ensuite", "queen bed"],
    },
    {
      houseId: acaciaId,
      label: "Bedroom 2",
      type: "single",
      beds: 1,
      status: "available",
      amenities: ["single bed"],
    },
    {
      houseId: acaciaId,
      label: "Bedroom 3",
      type: "twin",
      beds: 2,
      status: "maintenance",
      amenities: ["twin beds"],
    },
  ].map((doc) => ({
    ...doc,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const bedrooms = await db.collection("bedrooms").insertMany(bedroomDocs);

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
  ]);

  const today = new Date();
  const inSeven = new Date(today);
  inSeven.setDate(today.getDate() + 7);

  await db.collection("bookings").insertMany([
    {
      residentId: residents.insertedIds[0],
      bedroomId: bedrooms.insertedIds[2],
      houseId: riverbendId,
      checkIn: today,
      checkOut: inSeven,
      status: "checked_in",
      purpose: "roster",
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log("Seeded AMS sample data:");
  console.log(`  houses: ${Object.keys(houses.insertedIds).length}`);
  console.log(`  bedrooms: ${Object.keys(bedrooms.insertedIds).length}`);
  console.log(`  residents: ${Object.keys(residents.insertedIds).length}`);
  console.log("  bookings: 1");

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
