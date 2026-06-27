# Cadence — Habit Tracker

A full-stack habit tracker built on **research-backed gamification psychology** — Apple Watch-style
completion rings, **flexible streaks with grace days**, and real competence feedback instead of empty
points and badges.

Monorepo: a React + TypeScript client and an Express + Prisma API, sharing the same pure
streak-scoring logic.

```
.
├── client/   # React 18 + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Query
├── server/   # Node + Express + TypeScript + Prisma (SQLite dev / Postgres prod) + JWT
└── render.yaml, .github/workflows/ci.yml
```

## Why it's built this way

Every mechanic maps to a documented finding (great talking points for a case study):

- **Completion rings — Gestalt closure.** A nearly-closed ring is an open loop the brain wants to
  close (Apple Watch drove a ~49.5% behaviour change in 160k people).
- **Flexible streaks + grace days.** Users set their own frequency (`daily` / `N×per week` /
  specific weekdays) and get **one free miss per rolling 7-day window**, so a streak is something you
  control — not something that controls you.
- **Competence feedback.** Completion rate %, longest streak, auto-celebrated personal records — real
  evidence of progress, not vanity counters.
- **Variable reward.** A Monday "weekly reveal" recaps last week with an unknown-until-opened score.
- **Deliberately omitted:** generic points, badges, and global leaderboards.

## Tech stack

| | |
|---|---|
| **Client** | React 18, TypeScript (strict), Vite, React Router, **TanStack Query** + Axios, **Tailwind CSS + shadcn/ui**, Framer Motion, Recharts, dnd-kit, date-fns |
| **Server** | Node, Express, TypeScript, **Prisma ORM**, JWT (jsonwebtoken) + bcrypt, Zod validation |
| **DB** | SQLite for local dev · PostgreSQL (Supabase) for production |
| **Tooling** | Vitest (streak logic), GitHub Actions CI, Vercel (client) + Render (server) |

## Getting started

```bash
# 1. Install
npm --prefix server install
npm --prefix client install        # or: npm run install:all

# 2. Server env + database (SQLite, zero setup)
cp server/.env.example server/.env
npm --prefix server run prisma:push   # create dev.db from the schema
npm --prefix server run seed          # optional: demo@cadence.app / password123

# 3. Run both (two terminals)
npm run dev:server                    # API  → http://localhost:3001
npm run dev                           # web  → http://localhost:5173
```

Open http://localhost:5173 and **"Fill demo credentials"** on the login screen, or register a fresh
account and load demo data from Settings.

## Scripts (root)

| Script | Does |
|---|---|
| `npm run dev` | Vite client dev server |
| `npm run dev:server` | Express API (tsx watch) |
| `npm run build` | Build client + server |
| `npm run test` | Streak-logic unit tests (Vitest) |

## Streak scoring (shared, pure, tested)

`streakLogic.ts` lives identically in `client/src/lib` and `server/src/utils`, depends only on
date-fns, and is covered by Vitest (`npm run test`):

- **daily / weekdays** — consecutive *due* days completed; a missed day is forgiven unless it breaks
  the grace allowance for its rolling 7-day window. An incomplete *today* never breaks a streak.
- **weekly:N** — scored over Mon–Sun windows; each needs N completions; the in-progress week never
  breaks the chain early. The ring fills proportionally across the week.

## Deployment

1. **Database (Supabase):** create a project, copy the Postgres connection string.
2. **Switch provider:** in `server/prisma/schema.prisma` set `provider = "postgresql"` (the models are
   already portable).
3. **Server (Render):** the `render.yaml` blueprint builds `server/`, runs `prisma db push`, and
   starts `node dist/index.js`. Set `DATABASE_URL`, `CORS_ORIGIN` (your Vercel URL); `JWT_SECRET` is
   generated.
4. **Client (Vercel):** import the repo, root directory `client/`, set `VITE_API_URL` to the Render
   URL. `vercel.json` handles SPA routing.

## Notes

- Dates are stored as `YYYY-MM-DD` calendar-day strings; "today" is always the client's local day.
- Auth is a 7-day JWT in `localStorage`; an Axios interceptor attaches it and logs out on 401.
- Smart reminders (web push) are a documented stretch item — see the project plan.
