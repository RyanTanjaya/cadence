/**
 * streakLogic.ts — PURE habit math, shared by the client and the server.
 *
 * IMPORTANT: keep this file byte-identical with `server/src/utils/streakLogic.ts`.
 * It depends only on `date-fns` (available in both packages) and never touches
 * the DB, the network, or the DOM. All dates are `YYYY-MM-DD` calendar-day
 * strings — never UTC timestamps — so "today" is always the caller's local day.
 *
 * Frequency model (stored as a string on the Habit):
 *   - "daily"            → due every day
 *   - "weekly:N"         → N completions per Mon–Sun week (any days)
 *   - "weekdays:1,3,5"   → due only on those weekdays (0=Sun … 6=Sat)
 *
 * Grace days: a missed *due* day does not break the streak as long as no more
 * than `graceDays` misses fall within any rolling 7-calendar-day window.
 */
import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  parseISO,
  startOfWeek,
} from 'date-fns';

export const WEEK_OPTS = { weekStartsOn: 1 as const };

export type Frequency = string;

export type ParsedFrequency =
  | { kind: 'daily' }
  | { kind: 'weekly'; target: number }
  | { kind: 'weekdays'; days: number[] };

// ---------------------------------------------------------------------------
// Date helpers (calendar-day strings)
// ---------------------------------------------------------------------------

export function keyToDate(key: string): Date {
  return parseISO(key);
}

export function dateToKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---------------------------------------------------------------------------
// Frequency parsing
// ---------------------------------------------------------------------------

export function parseFrequency(freq: Frequency): ParsedFrequency {
  if (freq.startsWith('weekly:')) {
    const target = clamp(parseInt(freq.slice(7), 10) || 3, 1, 7);
    return { kind: 'weekly', target };
  }
  if (freq.startsWith('weekdays:')) {
    const days = freq
      .slice('weekdays:'.length)
      .split(',')
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
    return { kind: 'weekdays', days };
  }
  return { kind: 'daily' };
}

/** Whether the habit is scheduled ("due") on the given day. */
export function isDue(freq: Frequency, date: Date): boolean {
  const parsed = parseFrequency(freq);
  return isDueParsed(parsed, date);
}

function isDueParsed(parsed: ParsedFrequency, date: Date): boolean {
  switch (parsed.kind) {
    case 'daily':
    case 'weekly':
      return true;
    case 'weekdays':
      return parsed.days.includes(getDay(date));
  }
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface StreakResult {
  current: number;
  longest: number;
}

interface StreakInput {
  frequency: Frequency;
  graceDays: number;
  /** Completed calendar-day keys (order/duplication irrelevant). */
  completions: string[];
  /** Caller's local "today" as a `YYYY-MM-DD` key. */
  today: string;
  /** Optional lower bound; defaults to the earliest completion. */
  createdAt?: string;
}

export function computeStreaks(input: StreakInput): StreakResult {
  const { frequency, graceDays, completions, today } = input;
  const done = new Set(completions);
  if (done.size === 0 && !input.createdAt) return { current: 0, longest: 0 };

  const todayDate = keyToDate(today);
  const earliest = earliestKey(completions, input.createdAt, today);
  const start = keyToDate(earliest);
  const parsed = parseFrequency(frequency);

  if (parsed.kind === 'weekly') {
    return computeWeekStreaks(parsed.target, done, start, todayDate);
  }
  return computeDayStreaks(parsed, Math.max(0, graceDays), done, start, todayDate);
}

export function getCurrentStreak(input: StreakInput): number {
  return computeStreaks(input).current;
}

export function getLongestStreak(input: StreakInput): number {
  return computeStreaks(input).longest;
}

function earliestKey(completions: string[], createdAt: string | undefined, today: string): string {
  let min = createdAt ?? today;
  for (const k of completions) if (k < min) min = k;
  return min;
}

function countInRange(done: Set<string>, start: Date, end: Date): number {
  let count = 0;
  let cursor = start;
  let guard = 0;
  while (differenceInCalendarDays(cursor, end) <= 0 && guard++ < 100000) {
    if (done.has(dateToKey(cursor))) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}

/**
 * Single forward pass that yields both the current streak (run length at
 * `today`) and the longest run ever, applying the grace-window rule.
 */
function computeDayStreaks(
  parsed: ParsedFrequency,
  graceDays: number,
  done: Set<string>,
  start: Date,
  today: Date,
): StreakResult {
  const todayKey = dateToKey(today);
  let run = 0;
  let best = 0;
  let forgiven: Date[] = []; // forgiven miss days within the active streak

  let d = start;
  let guard = 0;
  while (differenceInCalendarDays(d, today) <= 0 && guard++ < 100000) {
    if (isDueParsed(parsed, d)) {
      const key = dateToKey(d);
      if (done.has(key)) {
        run += 1;
        if (run > best) best = run;
      } else if (key === todayKey) {
        // An incomplete *today* is not a break — the day isn't over yet.
      } else {
        // Missed a due day: forgive it unless the rolling 7-day window is full.
        const windowStart = addDays(d, -6);
        const inWindow = forgiven.filter(
          (m) => differenceInCalendarDays(m, windowStart) >= 0,
        );
        if (inWindow.length + 1 <= graceDays) {
          forgiven.push(d);
        } else {
          run = 0;
          forgiven = [];
        }
      }
    }
    d = addDays(d, 1);
  }
  return { current: run, longest: best };
}

function computeWeekStreaks(
  target: number,
  done: Set<string>,
  start: Date,
  today: Date,
): StreakResult {
  const startWeek = startOfWeek(start, WEEK_OPTS);
  const thisWeek = startOfWeek(today, WEEK_OPTS);
  let run = 0;
  let best = 0;

  let w = startWeek;
  let guard = 0;
  while (differenceInCalendarDays(w, thisWeek) <= 0 && guard++ < 100000) {
    const isThisWeek = differenceInCalendarDays(w, thisWeek) === 0;
    const weekEnd = isThisWeek ? today : addDays(w, 6);
    const count = countInRange(done, w, weekEnd);
    if (count >= target) {
      run += 1;
      if (run > best) best = run;
    } else if (!isThisWeek) {
      run = 0;
    }
    w = addDays(w, 7);
  }
  return { current: run, longest: best };
}

// ---------------------------------------------------------------------------
// Completion rate
// ---------------------------------------------------------------------------

/** Fraction (0–1) of expected completions actually done over the last `days`. */
export function getCompletionRate(input: {
  frequency: Frequency;
  completions: string[];
  days: number;
  today: string;
  createdAt?: string;
}): number {
  const { frequency, completions, days, today } = input;
  const done = new Set(completions);
  const parsed = parseFrequency(frequency);

  const todayDate = keyToDate(today);
  let startDate = addDays(todayDate, -(days - 1));
  if (input.createdAt) {
    const created = keyToDate(input.createdAt);
    if (differenceInCalendarDays(created, startDate) > 0) startDate = created;
  }
  const totalDays = differenceInCalendarDays(todayDate, startDate) + 1;
  if (totalDays <= 0) return 0;

  if (parsed.kind === 'weekly') {
    const expected = (parsed.target * totalDays) / 7;
    if (expected <= 0) return 0;
    return Math.min(1, countInRange(done, startDate, todayDate) / expected);
  }

  let due = 0;
  let completed = 0;
  let cursor = startDate;
  let guard = 0;
  while (differenceInCalendarDays(cursor, todayDate) <= 0 && guard++ < 100000) {
    if (isDueParsed(parsed, cursor)) {
      due++;
      if (done.has(dateToKey(cursor))) completed++;
    }
    cursor = addDays(cursor, 1);
  }
  return due === 0 ? 0 : completed / due;
}

// ---------------------------------------------------------------------------
// Ring progress + weekly count (client UI)
// ---------------------------------------------------------------------------

export function weeklyCount(completions: string[], refKey: string): number {
  const done = new Set(completions);
  const ref = keyToDate(refKey);
  const weekStart = startOfWeek(ref, WEEK_OPTS);
  return countInRange(done, weekStart, ref);
}

/** Ring fill (0–1). Day-based habits are binary; weekly habits fill across the week. */
export function ringProgress(frequency: Frequency, completions: string[], refKey: string): number {
  const parsed = parseFrequency(frequency);
  if (parsed.kind === 'weekly') {
    const count = weeklyCount(completions, refKey);
    return parsed.target === 0 ? 0 : Math.min(1, count / parsed.target);
  }
  return new Set(completions).has(refKey) ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Heatmap
// ---------------------------------------------------------------------------

export interface HeatCell {
  key: string;
  date: Date;
  inRange: boolean;
  due: boolean;
  done: boolean;
  isToday: boolean;
}

/** 12-week (default) grid: columns = weeks, rows = Mon–Sun. */
export function buildHeatmap(input: {
  frequency: Frequency;
  completions: string[];
  createdAt: string;
  today: string;
  weeks?: number;
}): HeatCell[][] {
  const { frequency, completions, createdAt, today } = input;
  const weeks = input.weeks ?? 12;
  const done = new Set(completions);
  const parsed = parseFrequency(frequency);
  const created = keyToDate(createdAt);
  const todayDate = keyToDate(today);

  const endWeekStart = startOfWeek(todayDate, WEEK_OPTS);
  const startWeek = addDays(endWeekStart, -(weeks - 1) * 7);
  const columns: HeatCell[][] = [];

  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(startWeek, w * 7);
    const column: HeatCell[] = [];
    for (let row = 0; row < 7; row++) {
      const date = addDays(weekStart, row);
      const key = dateToKey(date);
      const beforeCreated = differenceInCalendarDays(date, created) < 0;
      const afterToday = differenceInCalendarDays(date, todayDate) > 0;
      column.push({
        key,
        date,
        inRange: !beforeCreated && !afterToday,
        due: !beforeCreated && !afterToday && isDueParsed(parsed, date),
        done: done.has(key),
        isToday: key === today,
      });
    }
    columns.push(column);
  }
  return columns;
}
