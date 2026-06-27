# Cadence

An award-winning habit tracker built around **rhythm and frequency**. Close your
rings, keep your streaks, and watch twelve weeks of history bloom into a
GitHub-style heatmap. Built with Vite + React + TypeScript.

![Cadence](public/favicon.svg)

## Highlights

- **Frequency-first** — the core differentiator. Habits can be _every day_,
  _3–6× per week_, or _specific weekdays_. Streaks and completion rates respect
  each habit's schedule (week-based scoring for "times per week").
- **Tactile rings** — SVG completion rings that fill on tap via a CSS
  `stroke-dashoffset` transition, with spring physics, a check pip, and a
  confetti burst when every ring closes.
- **Editorial design** — Fraunces display serif + Inter, a warm paper palette,
  soft shadows, and a full **dark mode** (persisted, no flash on load).
- **Progress & records** — overall stats, per-habit current/longest streaks,
  12-week completion rates, personal-record (🏆 PR) highlights, and an
  expandable heatmap per habit.
- **Weekly reveal** — a Monday recap of the week that just ended: completion
  count, best day, and any new personal records, dismissable until next Monday.
- **Local-first** — everything persists to `localStorage` (Zustand `persist`).
  Ships with five realistic demo habits so it looks alive on first open.
- **Responsive & accessible** — sidebar on desktop, floating tab bar on mobile,
  reduced-motion support, ARIA roles, keyboard-friendly dialogs.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
```

## Tech stack

| Concern    | Choice                                   |
| ---------- | ---------------------------------------- |
| Build      | Vite 5 + `@vitejs/plugin-react`          |
| UI         | React 18 + TypeScript (strict)           |
| State      | Zustand (+ `persist` to localStorage)    |
| Routing    | React Router 6                           |
| Animation  | Framer Motion + canvas-confetti          |
| Dates      | date-fns (weeks start Monday)            |
| Styling    | Hand-authored CSS with design tokens     |

## Project structure

```
src/
  lib/            domain logic (pure, framework-free)
    date.ts         date helpers (Monday-first weeks)
    frequency.ts    isDue / labels per frequency type
    stats.ts        streaks, completion rates, heatmap, weekly reveal
    seed.ts         deterministic demo data
    palette.ts      swatch colors + emoji set
    confetti.ts     celebration burst
  store/
    useHabitStore.ts  habits + completions (persisted)
    useTheme.ts       light/dark theme (persisted)
  components/
    layout/         NavBar, ThemeToggle
    dashboard/      DateNavigator, HabitRingGrid, HabitCard,
                    CompletionRing, StreakBadge, AllDoneBanner,
                    AddHabitButton, EmptyState
    banner/         WeeklyRevealBanner (range, counts, best day, PR list)
    dialog/         AddHabitDialog, HabitNameInput, EmojiPicker,
                    ColorSwatches, FrequencySelector
    progress/       OverallStatsSummary, HabitStatRow, HeatmapCalendar,
                    PersonalRecordBadge, ExpandableHabitSection
  pages/          Dashboard, Progress, Settings
  styles/         index.css (tokens, theming, all component styles)
```

## Component map (per the original spec)

- **Dashboard / Today** — `DateNavigator`, `HabitRingGrid`, `HabitCard`,
  `CompletionRing`, `StreakBadge`, `AllDoneBanner`, `WeeklyRevealBanner`,
  `AddHabitButton`, `EmptyState`, `NavBar`.
- **Progress / Stats** — `OverallStatsSummary`, `HabitStatRow`,
  `HeatmapCalendar`, `PersonalRecordBadge`, `ExpandableHabitSection`.
- **Add / Edit Habit** — `HabitNameInput`, `EmojiPicker`, `ColorSwatches`,
  `FrequencySelector`, plus Save / Cancel / Delete in `AddHabitDialog`.
- **Weekly Reveal** — date range, completion count, best-day label, personal
  record list, and dismiss are composed inside `WeeklyRevealBanner`.

## How streaks are scored

- **Every day / Specific weekdays** — consecutive *due* days completed. A still
  incomplete _today_ doesn't break the streak (the day isn't over).
- **N× per week** — week-based: each Mon–Sun week counts toward the streak once
  it hits its target; the in-progress week never breaks the chain early. The
  ring fills proportionally as you complete the week.

A habit shows a **🏆 PR** highlight when its live streak equals its all-time best.

## Notes

- Reset or clear demo data from **Settings → Data**.
- The Weekly Reveal only appears on Mondays (per spec). The bundled demo date is
  a Monday, so it's visible out of the box.
