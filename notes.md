# Cadence — Engineering Notes (read me first)

A durable brain-dump so any future session (or a fresh clone on a new device) is instantly
productive. If you're an AI assistant picking this up: **read this whole file before changing code.**

Cadence is a full-stack, research-backed **habit tracker + journal**. It's deployed and public.

---

## 0. Live infra & where things run

| Layer | Where | URL |
|---|---|---|
| Frontend | Vercel (auto-deploys on push to `main`) | https://cadence-nine-swart.vercel.app |
| API | Render free tier (auto-deploys on push) | https://cadence-api-rcr9.onrender.com |
| Database | Supabase Postgres | (dashboard) |
| Source | GitHub (public) | https://github.com/RyanTanjaya/cadence |

- **Demo account:** `demo@cadence.app` / `password123` (seeded; re-seed with `npm --prefix server run seed`).
- **Render free tier sleeps** after ~15 min idle → first request cold-starts ~50s. Normal.
- **Secrets are NOT in the repo.** They live in `server/.env` (gitignored) locally and in the Render
  dashboard in prod. This file must never contain real secrets.

---

## 1. Full stack

**Client** (`/client`) — React 18 + TypeScript (strict) + **Vite**. React Router 6, **TanStack Query v5**
+ Axios (JWT interceptor), **Tailwind CSS + shadcn/ui** (layered on a hand-authored design system),
Framer Motion, Recharts, dnd-kit, date-fns, Zustand (auth + theme only), Vitest.

**Server** (`/server`) — Node + **Express** + TypeScript (**CommonJS**, run with `tsx` in dev, `tsc`→`dist`
in prod). **Prisma ORM** → **PostgreSQL**. `jsonwebtoken` + **bcryptjs**, **zod** validation, `cors`, `dotenv`.

**Infra** — Vercel (client) + Render (server, via `render.yaml` blueprint) + Supabase (DB). GitHub Actions CI.

---

## 2. Repo layout (monorepo, two independent packages)

```
/                      root: convenience scripts, vercel.json (monorepo build), render.yaml, CI
  client/
    src/
      main.tsx           providers: QueryClientProvider > BrowserRouter > App; imports tailwind.css then index.css
      App.tsx            routes: /login /register public; everything else behind ProtectedRoute + AppLayout
      types.ts           Habit (string frequency, completions: string[]), HabitDraft, ThemeName
      pages/             Dashboard, Progress, Journal, HabitDetailPage, LoginPage, RegisterPage, Settings
      components/
        auth/            ProtectedRoute (token guard), AuthShell (login/register frame)
        dashboard/       DateNavigator, HabitCard, CompletionRing, StreakBadge, AllDoneBanner,
                         AddHabitButton, EmptyState, SortableRingGrid (dnd-kit), DaySummary
                         (HabitRingGrid.tsx is DEAD — replaced by SortableRingGrid; safe to delete)
        banner/          WeeklyRevealBanner
        dialog/          AddHabitDialog (+ HabitNameInput, EmojiPicker, ColorSwatches, FrequencySelector)
        progress/        OverallStatsSummary, HabitStatRow, ExpandableHabitSection, HeatmapCalendar,
                         PersonalRecordBadge, WeeklyBarChart (Recharts)
        layout/          NavBar (sidebar + mobile tab bar), ThemeToggle
        ui/              shadcn primitives: button, input, label, dialog
        icons.tsx        hand-drawn SVG icon set (nav icons, etc.)
      hooks/             useHabits (queries + optimistic mutations), useAuthMutations (login/register)
      lib/
        api.ts           Axios instance + JWT request interceptor + 401→logout + apiError()
        queryClient.ts   TanStack Query client
        streakLogic.ts   PURE streak/frequency/heatmap math (see §4) — SHARED, keep in sync with server copy
        habit.ts         Date-based adapters over streakLogic + overallStats + weeklyReveal (UI-facing)
        frequency.ts     frequency string → labels
        date.ts          date-fns re-exports + dateKey/today/etc (weeks start Monday)
        palette.ts       swatch colors + emoji set;  confetti.ts;  id.ts;  utils.ts (cn())
      store/             useAuth (token+user, persisted 'cadence-auth'), useTheme ('cadence-theme')
      styles/            index.css (Cadence design system), tailwind.css (@tailwind + shadcn HSL vars)
    tailwind.config.ts postcss.config.js vite.config.ts tsconfig*.json vercel.json .env.example
  server/
    src/
      index.ts           express app; mounts /auth, /api/habits (+completions), /api/stats, /api/journal
      lib/               prisma.ts (singleton), env.ts (loads + validates .env)
      middleware/auth.ts requireAuth (Bearer JWT → req.userId), signToken
      routes/            auth, habits, completions, stats, journal
      utils/             streakLogic.ts (BYTE-IDENTICAL copy of client's), validation.ts (zod), demoSeed.ts
      types/express.d.ts augments Express Request with userId
    prisma/              schema.prisma (User, Habit, Completion, JournalEntry), seed.ts
    package.json tsconfig.json .env.example
  render.yaml            Render blueprint (backend)
  .github/workflows/ci.yml
```

---

## 3. Design decisions & WHY

- **Monorepo, two independent packages (not npm workspaces).** Each has its own `package.json`,
  lockfile, `node_modules`. Reason: clean, separate deploys (Vercel builds `client/`, Render builds
  `server/`) without workspace-hoisting surprises. Root `package.json` only holds convenience scripts
  (`npm run dev` → client, `npm run dev:server` → server) that shell out with `npm --prefix`.

- **Tailwind + shadcn layered on a bespoke design system.** The look is hand-authored in
  `client/src/styles/index.css` (CSS variables: `--bg`, `--surface`, `--ink`, radii, shadows, light/dark
  via `[data-theme]`, fonts Fraunces + Inter). `tailwind.config.ts` maps those tokens into Tailwind, and
  `tailwind.css` defines shadcn's HSL vars *from* the Cadence palette. **So Tailwind/shadcn match the
  custom look.** `main.tsx` imports `tailwind.css` first, then `index.css` (so bespoke component classes
  win). Why both: portfolio wants the "standard stack" keywords (Tailwind/shadcn) AND a distinctive look.

- **String frequency model:** `"daily"` | `"weekly:N"` (N/week) | `"weekdays:1,3,5"` (0=Sun…6=Sat).
  Chosen over an object so it's identical in the DB, the API, and the shared logic. Parse with
  `parseFrequency()` in `streakLogic.ts`.

- **Grace-day streaks (research-backed differentiator).** A missed *due* day doesn't break a streak as
  long as ≤ `graceDays` (default 1) misses fall in any rolling 7-day window. `weekly:N` is scored over
  Mon–Sun windows; the in-progress week never breaks the chain early; an incomplete *today* never breaks.
  This is intentional (flexible streaks = motivation, not obligation). Expect streaks to read HIGHER than
  a naive daily counter.

- **`streakLogic.ts` is duplicated, byte-identical, in `client/src/lib` and `server/src/utils`.** Pure,
  depends only on date-fns. Client computes for instant UI; server computes `/stats`. **If you change one,
  copy it to the other** (`Copy-Item client/src/lib/streakLogic.ts server/src/utils/streakLogic.ts`).
  Tests live at `client/src/lib/__tests__/streakLogic.test.ts` (`npm --prefix client run test`).

- **`lib/habit.ts` adapter layer.** Components call `currentStreak(habit, date)` etc. with `Date` args;
  these wrap the string/array-based `streakLogic` so component call-sites stay clean. (Replaced the old
  `stats.ts`, now deleted.)

- **Data layer = TanStack Query + Axios, with optimistic completion toggles** (`useToggleCompletion` in
  `hooks/useHabits.ts`) so rings fill instantly. Server data is NOT in Zustand — Zustand only holds auth
  token/user and theme.

- **Auth:** 7-day JWT in `localStorage` (`cadence-auth`). Axios interceptor attaches `Bearer` and logs
  out on 401. `ProtectedRoute` redirects to `/login` when there's no token. `VITE_API_URL` picks the API
  base (defaults to `http://localhost:3001`).

- **Journal tab** is a self-contained, inline-styled **dark** page (its own aesthetic, kept verbatim from
  the source). Storage + AI go through our backend (`/api/journal`, `/api/journal/reflect` — an Anthropic
  proxy so the key stays server-side). Reflections are saved onto the entry (`reflection` column); the
  "Save to entries →" button appears after a successful reflection and shows it in Past entries. Autosave
  never overwrites a saved reflection. Because the page is full-dark, it adds a `journal-page` class to
  `<body>` to disable the app's light bottom scrim (see next).

- **Mobile bottom "scrim"** (`body::after`, ≤860px) fades content under the floating tab bar using
  `var(--bg)`. Any NEW full-bleed dark page must disable it (`body.journal-page::after { display:none }`
  pattern) or it'll show a light fade.

- Misc: DaySummary hides at 100% (the celebration banner takes over). dnd-kit reorder uses an 8px pointer
  activation distance so a tap still toggles. Recharts v3 needs a custom `<Tooltip content={...}>`
  component (the `formatter` prop is over-typed); bars use a violet gradient. Theme is applied pre-paint
  by an inline script in `client/index.html` reading `localStorage['cadence-theme']`.

- **Prisma provider is `postgresql`.** Local dev and prod both use the **Supabase Session pooler**
  connection string (see §5). It's IPv4 (works on Render free + Windows) AND supports migrations.

---

## 4. What NOT to redo (gotchas that cost real time)

- **Don't use Supabase "Direct connection"** (IPv6-only without a paid add-on → fails on Render free) or
  the **"Transaction pooler"** (port 6543, breaks Prisma migrations). **Use the Session pooler** (5432).
- **Render build MUST keep `npm install --include=dev`** in `render.yaml`. `NODE_ENV=production` makes npm
  skip devDependencies, so `tsc`/`prisma` (devDeps) vanish and the build exits with status 2.
- **Vercel Root Directory = `./`** (repo root). The root `vercel.json` drives the client build
  (`npm --prefix client run build` → `client/dist`). Do NOT set root to `client/`.
- **`VITE_API_URL` is baked in at build time.** Changing the API URL requires a Vercel redeploy, not just
  an env edit.
- **`CORS_ORIGIN` on Render is dashboard-managed** (`sync: false`). It's set to the Vercel URL. The server
  treats `*` as "reflect any origin"; a specific value locks it down.
- **Keep the two `streakLogic.ts` copies identical** (§3).
- **Don't add `outline`/`border`/`box-shadow` to `.ring`, `.habit-card__ringwrap`, or
  `.dialog__preview-ring`.** There's a deliberate override killing a stray box; re-adding will bring it
  back.
- **Windows local dev:** `prisma generate` fails with `EPERM` if the API server is running (it holds the
  query-engine DLL) — stop the server first. If `EADDRINUSE`, a stale node still owns 3001/5173 — kill it.
- **bcryptjs, not bcrypt** (pure JS; avoids native builds on Windows).
- Client uses ESM; server uses CommonJS. Client zod is v4, server zod is v3 — that's fine, they're separate.
- **`.env` is gitignored** — never commit `DATABASE_URL`, `JWT_SECRET`, or `ANTHROPIC_API_KEY`.

---

## 5. Running locally (fresh clone)

Secrets aren't in the repo, so create them:

```bash
# 1. install
npm --prefix server install
npm --prefix client install

# 2. server/.env  (copy from server/.env.example, then fill DATABASE_URL)
#    DATABASE_URL = Supabase → Project Settings → Database → Connection string →
#                   "Session pooler" → URI  (replace [YOUR-PASSWORD]).  Or copy it from
#                   the Render dashboard (cadence-api → Environment).
#    JWT_SECRET   = any long random string (dev)
#    PORT=3001
#    CORS_ORIGIN=http://localhost:5173
#    ANTHROPIC_API_KEY=  (optional; enables journal reflections — console.anthropic.com, paid)

# 3. generate client + sync schema to the DB (DB already has tables in prod; safe/idempotent)
npm --prefix server run prisma:push
npm --prefix server run seed        # optional demo data

# 4. run (two terminals)
npm run dev:server                  # API  → http://localhost:3001
npm run dev                         # web  → http://localhost:5173  (login: demo@cadence.app / password123)
```

`client/.env` is optional — `VITE_API_URL` defaults to `http://localhost:3001`.

Tests / typecheck: `npm --prefix client run test` · `npm --prefix client run build` · `npm --prefix server run build`.

---

## 6. How to ship a build (deploy)

**It's all git-driven.** Push to `main`:
- **CI** (`.github/workflows/ci.yml`) runs client test+build and server typecheck.
- **Vercel** auto-builds `client/` and deploys.
- **Render** auto-builds `server/` and deploys (build runs `prisma db push`, so schema changes apply).
- **If you changed `render.yaml`,** Render may reuse the old build settings — go to the **Blueprint page →
  "Manual sync"** to re-read it.

Verify prod quickly:
```bash
curl -s https://cadence-api-rcr9.onrender.com/health           # {"ok":true}
# CORS + login as the browser sees it:
curl -s -X POST https://cadence-api-rcr9.onrender.com/auth/login \
  -H 'Content-Type: application/json' -H 'Origin: https://cadence-nine-swart.vercel.app' \
  -d '{"email":"demo@cadence.app","password":"password123"}'
```

---

## 7. Recipes for common future changes

- **New page/tab:** add `client/src/pages/X.tsx` → route in `App.tsx` (inside the protected `AppLayout`) →
  add to `LINKS` in `components/layout/NavBar.tsx` (+ an icon in `icons.tsx`).
- **New API endpoint:** add `server/src/routes/x.ts` (use `requireAuth`, zod-validate the body) → mount in
  `server/src/index.ts` → add a TanStack Query hook in `client/src/hooks/`.
- **New DB field/model:** edit `server/prisma/schema.prisma` → `npm --prefix server run prisma:push`
  (hits Supabase; stop the local API first to avoid the EPERM lock) → update validation, routes, client
  `types.ts`, and UI. Prod applies it on the next deploy (build runs `prisma db push`).
- **Change streak/frequency rules:** edit `streakLogic.ts`, **copy to both locations**, update tests, run
  `npm --prefix client run test`.
- **Restyle:** design tokens live in `client/src/styles/index.css`; Tailwind maps them in
  `tailwind.config.ts`. Prefer editing tokens over hardcoding colors.

---

_Original project brief: `project5_habit_tracker.html`. High-level README: `README.md`._
