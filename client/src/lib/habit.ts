import { startOfMonth } from 'date-fns';
import type { Habit } from '../types';
import {
  WEEK_OPTS,
  WEEKDAY_LABELS,
  addDays,
  dateKey,
  differenceInCalendarDays,
  startOfWeek,
  subDays,
  today,
  weekdayIndex,
} from './date';
import {
  buildHeatmap as slHeatmap,
  computeStreaks,
  getCompletionRate,
  isDue as slIsDue,
  parseFrequency,
  ringProgress as slRingProgress,
  weeklyCount as slWeeklyCount,
  type HeatCell,
} from './streakLogic';

export type { HeatCell };

// ---------------------------------------------------------------------------
// Per-habit helpers (Date-based signatures so component call-sites stay simple)
// ---------------------------------------------------------------------------

export function isCompleted(habit: Habit, ref: Date): boolean {
  return habit.completions.includes(dateKey(ref));
}

export function isDueOn(habit: Habit, date: Date): boolean {
  return slIsDue(habit.frequency, date);
}

function streaks(habit: Habit, ref: Date) {
  return computeStreaks({
    frequency: habit.frequency,
    graceDays: habit.graceDays,
    completions: habit.completions,
    today: dateKey(ref),
    createdAt: habit.createdAt,
  });
}

export function currentStreak(habit: Habit, ref: Date = today()): number {
  return streaks(habit, ref).current;
}

export function longestStreak(habit: Habit, ref: Date = today()): number {
  return streaks(habit, ref).longest;
}

export function ringProgress(habit: Habit, ref: Date = today()): number {
  return slRingProgress(habit.frequency, habit.completions, dateKey(ref));
}

export function weeklyCount(habit: Habit, ref: Date = today()): number {
  return slWeeklyCount(habit.completions, dateKey(ref));
}

export function trailingCompletionRate(habit: Habit, days = 84, ref: Date = today()): number {
  return getCompletionRate({
    frequency: habit.frequency,
    completions: habit.completions,
    days,
    today: dateKey(ref),
    createdAt: habit.createdAt,
  });
}

export function monthCompletionRate(habit: Habit, ref: Date = today()): number {
  const days = differenceInCalendarDays(ref, startOfMonth(ref)) + 1;
  return getCompletionRate({
    frequency: habit.frequency,
    completions: habit.completions,
    days,
    today: dateKey(ref),
    createdAt: habit.createdAt,
  });
}

export function isAtPersonalBest(habit: Habit, ref: Date = today()): boolean {
  const { current, longest } = streaks(habit, ref);
  return current >= 3 && current >= longest;
}

export function buildHeatmap(habit: Habit, weeks = 12, ref: Date = today()): HeatCell[][] {
  return slHeatmap({
    frequency: habit.frequency,
    completions: habit.completions,
    createdAt: habit.createdAt,
    today: dateKey(ref),
    weeks,
  });
}

export function totalCompletions(habit: Habit): number {
  return habit.completions.length;
}

export function frequencyUnit(habit: Habit): 'wk' | 'd' {
  return parseFrequency(habit.frequency).kind === 'weekly' ? 'wk' : 'd';
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// ---------------------------------------------------------------------------
// Overall stats (Progress header)
// ---------------------------------------------------------------------------

export interface OverallStats {
  totalActive: number;
  monthRate: number;
  longestCurrentStreak: number;
  longestCurrentStreakHabit: Habit | null;
}

export function overallStats(habits: Habit[], ref: Date = today()): OverallStats {
  const active = habits.filter((h) => !h.isArchived);
  let longest = 0;
  let longestHabit: Habit | null = null;
  let rateSum = 0;

  for (const h of active) {
    const cur = currentStreak(h, ref);
    if (cur > longest) {
      longest = cur;
      longestHabit = h;
    }
    rateSum += monthCompletionRate(h, ref);
  }

  return {
    totalActive: active.length,
    monthRate: active.length === 0 ? 0 : rateSum / active.length,
    longestCurrentStreak: longest,
    longestCurrentStreakHabit: longestHabit,
  };
}

// ---------------------------------------------------------------------------
// Weekly reveal (Monday recap of the week that just ended)
// ---------------------------------------------------------------------------

export interface WeeklyRecord {
  habit: Habit;
  length: number;
}

export interface WeeklyReveal {
  weekKey: string;
  start: Date;
  end: Date;
  completed: number;
  possible: number;
  rate: number;
  bestDayLabel: string | null;
  bestDayCount: number;
  records: WeeklyRecord[];
}

function countInRangeKeys(habit: Habit, startKey: string, endKey: string): number {
  return habit.completions.filter((k) => k >= startKey && k <= endKey).length;
}

function possibleForWeek(habit: Habit, start: Date): number {
  const parsed = parseFrequency(habit.frequency);
  if (parsed.kind === 'weekly') return parsed.target;
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const key = dateKey(d);
    if (key < habit.createdAt) continue;
    if (parsed.kind === 'daily' || parsed.days.includes(weekdayIndex(d))) count++;
  }
  return count;
}

export function weeklyReveal(habits: Habit[], ref: Date = today()): WeeklyReveal {
  const thisWeekStart = startOfWeek(ref, WEEK_OPTS);
  const start = subDays(thisWeekStart, 7); // last Monday
  const end = subDays(thisWeekStart, 1); // last Sunday
  const startKey = dateKey(start);
  const endKey = dateKey(end);
  const active = habits.filter((h) => !h.isArchived);

  let completed = 0;
  let possible = 0;
  const dayCounts = new Array(7).fill(0);

  for (const h of active) {
    completed += countInRangeKeys(h, startKey, endKey);
    possible += possibleForWeek(h, start);
    for (let i = 0; i < 7; i++) {
      if (isCompleted(h, addDays(start, i))) dayCounts[i]++;
    }
  }

  let bestIdx = -1;
  let bestCount = 0;
  dayCounts.forEach((c, i) => {
    if (c > bestCount) {
      bestCount = c;
      bestIdx = i;
    }
  });

  const prevEndKey = dateKey(subDays(start, 1)); // Sunday before last week
  const records: WeeklyRecord[] = [];
  for (const h of active) {
    const longestNow = computeStreaks({
      frequency: h.frequency,
      graceDays: h.graceDays,
      completions: h.completions,
      today: endKey,
      createdAt: h.createdAt,
    }).longest;
    const longestPrev = computeStreaks({
      frequency: h.frequency,
      graceDays: h.graceDays,
      completions: h.completions,
      today: prevEndKey,
      createdAt: h.createdAt,
    }).longest;
    if (longestNow > longestPrev && longestNow >= 3) {
      records.push({ habit: h, length: longestNow });
    }
  }
  records.sort((a, b) => b.length - a.length);

  return {
    weekKey: startKey,
    start,
    end,
    completed,
    possible,
    rate: possible === 0 ? 0 : completed / possible,
    bestDayLabel: bestIdx >= 0 ? WEEKDAY_LABELS[weekdayIndex(addDays(start, bestIdx))] : null,
    bestDayCount: bestCount,
    records,
  };
}
