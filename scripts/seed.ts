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
  today.setHours(0, 0, 0, 0);
  const inThree = new Date(today);
  inThree.setDate(today.getDate() + 3);
  const inSeven = new Date(today);
  inSeven.setDate(today.getDate() + 7);
  const inFourteen = new Date(today);
  inFourteen.setDate(today.getDate() + 14);
  const inTwentyOne = new Date(today);
  inTwentyOne.setDate(today.getDate() + 21);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

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

  const applications = await db.collection("visitorapplications").insertMany([
    {
      applicationType: "single",
      travellers: [
        {
          name: "Tom Ellis",
          email: "tom.ellis@safetyaudit.com",
          phone: "0400 333 010",
          company: "Safety Audit Co",
          photoIdFileName: "tom-ellis-id.pdf",
        },
      ],
      hostName: "Sarah Chen",
      hostTitle: "HSE Manager",
      department: "HSE",
      reason: "Site Tour",
      arrival: inThree,
      departure: inSeven,
      accommodationRequired: true,
      carRego: "1ABC234",
      status: "submitted",
      gmNotes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      applicationType: "group",
      travellers: [
        {
          name: "Priya Singh",
          email: "priya.singh@northstar.com",
          phone: "0400 222 201",
          company: "Northstar Contractors",
          photoIdFileName: "priya-id.pdf",
        },
        {
          name: "Alex Morgan",
          email: "alex.morgan@northstar.com",
          phone: "0400 222 202",
          company: "Northstar Contractors",
          photoIdFileName: "alex-id.pdf",
        },
      ],
      hostName: "Jordan Blake",
      hostTitle: "Operations Supervisor",
      department: "Operation",
      reason: "Business Meeting",
      arrival: inSeven,
      departure: inFourteen,
      accommodationRequired: true,
      carRego: "2XYZ789",
      status: "submitted",
      gmNotes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      applicationType: "single",
      travellers: [
        {
          name: "Chris Wong",
          email: "chris.wong@compliance.io",
          phone: "0400 444 100",
          company: "Compliance Partners",
          photoIdFileName: "",
        },
      ],
      hostName: "Maya Nguyen",
      hostTitle: "Site Coordinator",
      department: "Operation",
      reason: "Project",
      arrival: today,
      departure: inFourteen,
      accommodationRequired: true,
      carRego: "",
      status: "approved",
      gmNotes: "Approved for audit visit.",
      decidedAt: yesterday,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      applicationType: "single",
      travellers: [
        {
          name: "Lisa Park",
          email: "lisa.park@ironridge.com",
          phone: "0400 555 300",
          company: "Iron Ridge Ops",
          photoIdFileName: "",
        },
      ],
      hostName: "Sarah Chen",
      hostTitle: "HSE Manager",
      department: "HSE",
      reason: "Other",
      arrival: inSeven,
      departure: inSeven,
      accommodationRequired: false,
      carRego: "3TRN456",
      status: "approved",
      gmNotes: "Day visit only — no accommodation needed.",
      decidedAt: yesterday,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      applicationType: "single",
      travellers: [
        {
          name: "David Miller",
          email: "david.miller@example.com",
          phone: "0400 666 700",
          company: "External Vendor",
          photoIdFileName: "",
        },
      ],
      hostName: "Jordan Blake",
      hostTitle: "Operations Supervisor",
      department: "Operation",
      reason: "Project",
      arrival: inFourteen,
      departure: inTwentyOne,
      accommodationRequired: true,
      carRego: "",
      status: "rejected",
      gmNotes: "Visit deferred — contractor induction not complete.",
      decidedAt: yesterday,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      applicationType: "single",
      travellers: [
        {
          name: "Emma Roberts",
          email: "emma.roberts@inspect.com",
          phone: "0400 777 800",
          company: "Inspect Co",
          photoIdFileName: "emma-id.pdf",
        },
      ],
      hostName: "Maya Nguyen",
      hostTitle: "Site Coordinator",
      department: "Processing",
      reason: "Inspection",
      arrival: today,
      departure: inSeven,
      accommodationRequired: true,
      carRego: "4INS321",
      status: "allocated",
      gmNotes: "Approved and allocated.",
      decidedAt: yesterday,
      houseId: acaciaId,
      bedroomId: bedrooms.insertedIds[4],
      allocatedAt: today,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log("Seeded AMS sample data:");
  console.log(`  houses: ${Object.keys(houses.insertedIds).length}`);
  console.log(`  bedrooms: ${Object.keys(bedrooms.insertedIds).length}`);
  console.log(`  residents: ${Object.keys(residents.insertedIds).length}`);
  console.log("  bookings: 1");
  console.log(`  visitor applications: ${Object.keys(applications.insertedIds).length}`);
  console.log("    submitted: 2, approved: 2, rejected: 1, allocated: 1");

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
