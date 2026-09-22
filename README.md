# Home Exterior Job Pipeline & Estimate Tracker

A full-stack job pipeline tracker for home-exterior contractors (windows, doors, siding, gutters) — replacing scattered texts, paper, and memory with one relational source of truth for leads, estimates, and schedules.

[Live demo →](https://home-exterior-pipeline-tracker.vercel.app/)

## Why this exists

Contractors running windows/doors/siding/gutter jobs lose time and money when leads, estimates, and schedules live scattered across texts, paper, and memory — a lead goes cold because no one wrote it down, or two people quote the same job differently because there's no single record of what was promised. The fix isn't a nicer-looking spreadsheet; it's modeling the job lifecycle itself as one relational structure so every view of the business — board, schedule, search — reads from the same source of truth.

## From prototype to real application

This project started as a Vite + React app — a client-side UI demo with job data held in an in-memory array. It looked functional, but refreshing the page wiped out any changes, and there was no real backend or persistence behind it.

I migrated it to a proper full-stack application:

- **Framework** — Vite (client-only SPA) → Next.js App Router, with a clear split between Server Components (data fetching) and Client Components (interactivity).
- **Data layer** — In-memory array → a real Postgres database hosted on Neon, with Prisma as the ORM and a defined `Job` schema and migration history. A small mapping layer (`lib/jobs.js`) translates between the database's flat shape and the UI's nested shape, so the existing component logic didn't need a rewrite.
- **Backend** — Server Actions (`app/actions/jobs.js`) handle all reads and writes — `getJobs`, `createJob`, `updateJob`, `updateJobStage`, `deleteJob` — no separate API layer.
- **Mutations** — Create/edit/delete use optimistic UI updates for instant feedback, backed by a real database write.
- **Fixes along the way** — Corrected hardcoded dark-mode colors to use CSS variables, and fixed a hydration mismatch on the theme toggle where the server and client initially rendered different icons on first load.

I used AI to help scaffold the migration structure and think through the Next.js App Router setup, while owning the architectural decisions (like the mapping layer, to avoid rewriting working UI logic) and the debugging myself.

Development followed a clean commit history (scaffold → CSS → Prisma → backend → UI split → cleanup) through a proper pull request, merged on GitHub, and deployed live on Vercel connected to the Neon database.

## Features

- Board, List, and Dashboard views of the job pipeline
- Job creation/editing, per-service estimate calculator (windows, doors, siding, gutters)
- Search and filtering by service type or stage
- Responsive layout, light/dark theme (remembers choice, follows OS default)

## Tech stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Backend:** Next.js Server Actions — no separate API layer

## Running it locally

```
git clone <repo-url>
cd home-exterior-pipeline-tracker
npm install
```

Set up your `.env` with a Postgres connection string (Neon or local), then run migrations and start the dev server:

```
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## Production build

```
npm run build
npm run start
```

## Possible next steps

- Multi-contractor accounts with per-user job assignment
- SMS/email notifications when a job moves stages
- Export estimates as a client-facing PDF
