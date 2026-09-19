# Home Exterior Job Pipeline & Estimate Tracker

A full-stack job pipeline tracker for home-exterior contractors (windows, doors, siding, gutters) — replacing scattered texts, paper, and memory with one relational source of truth for leads, estimates, and schedules.

**[Live demo →](https://home-exterior-pipeline-tracker.vercel.app/)**

## Stack

- **Next.js** (App Router) — full-stack framework, Server Actions for mutations
- **PostgreSQL** (Neon) + **Prisma ORM** — relational data model, one source of truth
- **React** — Board, List, and Dashboard views
- Light/dark theme (remembers choice, follows OS default)

## How it's built

**Design** — Modeled the job lifecycle (lead → estimate → scheduled → completed) as a single relational structure in Postgres before touching UI, so the pipeline board, weekly schedule, and search all read from one source of truth instead of duplicated state.

**Build** — Used AI to scaffold the pipeline board, estimate calculator, and filtering UI quickly, while owning the estimate logic directly — the part where correctness affects a contractor's bottom line.

**Improve** — The estimate calculator handled populated fields fine but silently produced wrong totals on blank optional dates. Replaced that field with a deterministic formula with explicit null-handling rather than patching the AI-generated logic. Financial calculations in this app now never run through unreviewed AI-generated logic.

## Features

- Board, List, and Dashboard views of the job pipeline
- Job creation/editing, per-service estimate calculator
- Search and filtering by service type or stage
- Responsive layout, light/dark theme

## Run locally

```bash
git clone <repo-url>
cd home-exterior-pipeline-tracker
npm install
```

Set up your `.env` with a Postgres connection string (Neon or local), then:

```bash
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```
