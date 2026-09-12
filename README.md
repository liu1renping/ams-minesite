# AMS — Accommodation Management System

Minesite accommodation management built with **Next.js 16**, **Tailwind CSS v4**, and **MongoDB** (Mongoose).

Track camps/villages, room inventory, residents (FIFO / contractors / visitors), and roster bookings with check-in / check-out.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- MongoDB via Mongoose 9

## Prerequisites

- Node.js **20.9+** (see `.nvmrc`)
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))

```bash
nvm use   # or: nvm use 20.20.2
```

## Setup

```bash
cp .env.example .env.local
# edit MONGODB_URI if needed (default: mongodb://127.0.0.1:27017/ams)

npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's included

| Area | Description |
|------|-------------|
| Dashboard | Occupancy stats, camp summary, quick booking |
| Camps | Village / camp registry |
| Rooms | Block + room inventory and status |
| Residents | Workforce / contractor directory |
| Bookings | Allocations with check-in, check-out, cancel |

### API routes

- `GET/POST /api/camps`
- `GET/POST /api/rooms`
- `GET/POST /api/residents`
- `GET/POST /api/bookings`
- `PATCH /api/bookings/:id`
- `GET /api/stats`

## Project layout

```
src/
  app/                 # Pages + API routes
  components/          # UI shell and forms
  lib/
    db.ts              # Mongo connection (cached)
    models.ts          # Camp, Room, Resident, Booking
    queries.ts         # Dashboard aggregations
scripts/seed.ts        # Sample minesite data
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js (Turbopack) |
| `npm run build` | Production build |
| `npm run seed` | Reset and load sample data |
| `npm run lint` | ESLint |

## Deploy on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. In **Project Settings → Environment Variables**, add:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `MONGODB_URI` | your Atlas `mongodb+srv://...` URI | Production, Preview, Development |

3. Redeploy (Deployments → … → Redeploy), or push a new commit.
4. In Atlas **Network Access**, allow Vercel egress (for getting started you can allow `0.0.0.0/0`).

`.env.local` is only for local development and is not uploaded to Vercel.

## Notes

- Overlapping room bookings are rejected by the bookings API.
- Checking in a booking marks the room as `occupied`; check-out / cancel returns it to `available` when no other active stay remains.
