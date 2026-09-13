# AMS — Accommodation Management System

Minesite visitor accommodation built with **Next.js 16**, **Tailwind CSS v4**, and **MongoDB** (Mongoose).

Manage **houses** with independently allocatable **bedrooms**, visitor applications, GM approval, and bedroom allocation.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- MongoDB via Mongoose 9

## Prerequisites

- Node.js **20.9+** (see `.nvmrc`)
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))

```bash
nvm use
```

## Setup

```bash
cp .env.example .env.local
# edit MONGODB_URI if needed

npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Workflow

1. **Visitor Application** — submit visit request  
2. **GM Approval** — approve / reject submitted applications  
3. **Accommodation** — allocate an available bedroom in a house  
4. **Houses / Bedrooms** — manage property inventory (each bedroom is independent)

## API routes

- `GET/POST /api/applications`
- `PATCH /api/applications/:id` (`approve` | `reject` | `allocate`)
- `GET/POST /api/houses`
- `GET/PATCH/DELETE /api/houses/:id`
- `GET/POST /api/bedrooms`
- `GET/PATCH/DELETE /api/bedrooms/:id`
- `GET/POST /api/residents`
- `GET/PATCH/DELETE /api/residents/:id`
- `GET/POST /api/bookings`
- `PATCH /api/bookings/:id`
- `GET /api/stats`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js (Turbopack) |
| `npm run build` | Production build |
| `npm run seed` | Reset and load sample houses/bedrooms |
| `npm run lint` | ESLint |

## Deploy on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Add `MONGODB_URI` in Project Settings → Environment Variables.
3. Functions region is pinned to Sydney (`syd1`) via `vercel.json`.
4. In Atlas Network Access, allow Vercel egress (or `0.0.0.0/0` for personal projects).
