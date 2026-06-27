import { describe, expect, it } from 'vitest';
import { addDays, format, parseISO } from 'date-fns';
import {
  buildHeatmap,
  computeStreaks,
  getCompletionRate,
  isDue,
  parseFrequency,
  ringProgress,
  weeklyCount,
} from '../streakLogic';

/** Build a YYYY-MM-DD key `n` days before `base`. */
function back(base: string, n: number): string {
  return format(addDays(parseISO(base), -n), 'yyyy-MM-dd');
}
/** Inclusive list of keys from `base` going back `n` days (newest first). */
function lastNDays(base: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => back(base, i));
}

describe('parseFrequency / isDue', () => {
  it('parses the three frequency forms', () => {
    expect(parseFrequency('daily')).toEqual({ kind: 'daily' });
    expect(parseFrequency('weekly:4')).toEqual({ kind: 'weekly', target: 4 });
    expect(parseFrequency('weekdays:1,3,5')).toEqual({ kind: 'weekdays', days: [1, 3, 5] });
  });

  it('weekdays is only due on scheduled days', () => {
    // 2026-06-22 is a Monday, 2026-06-23 a Tuesday
    expect(isDue('weekdays:1,3,5', parseISO('2026-06-22'))).toBe(true);
    expect(isDue('weekdays:1,3,5', parseISO('2026-06-23'))).toBe(false);
  });
});

describe('daily streaks', () => {
  const today = '2026-06-30';

  it('counts a clean consecutive run', () => {
    const completions = lastNDays(today, 5); // today .. today-4
    expect(computeStreaks({ frequency: 'daily', graceDays: 1, completions, today })).toEqual({
      current: 5,
      longest: 5,
    });
  });

  it('an incomplete today does not break the streak', () => {
    const completions = lastNDays(back(today, 1), 4); // yesterday .. -4, today missing
    expect(computeStreaks({ frequency: 'daily', graceDays: 1, completions, today }).current).toBe(4);
  });

  it('a single missed day is bridged by the grace day', () => {
    // done: -5,-4,-3, [miss -2], -1, today
    const completions = [back(today, 0), back(today, 1), back(today, 3), back(today, 4), back(today, 5)];
    expect(computeStreaks({ frequency: 'daily', graceDays: 1, completions, today }).current).toBe(5);
  });

  it('two misses inside a 7-day window break the streak', () => {
    // done: -5,-4, [miss -3],[miss -2], -1, today  → break at the second miss
    const completions = [back(today, 0), back(today, 1), back(today, 4), back(today, 5)];
    expect(computeStreaks({ frequency: 'daily', graceDays: 1, completions, today }).current).toBe(2);
  });

  it('with graceDays:0 any miss breaks immediately', () => {
    const completions = [back(today, 0), back(today, 1), back(today, 3)]; // miss at -2
    expect(computeStreaks({ frequency: 'daily', graceDays: 0, completions, today }).current).toBe(2);
  });

  it('reports the longest historical run separately from current', () => {
    // long past run of 6 (-20..-15), gap, short current run of 2
    const past = lastNDays(back(today, 15), 6); // -15..-20
    const recent = [back(today, 0), back(today, 1)];
    const res = computeStreaks({ frequency: 'daily', graceDays: 0, completions: [...past, ...recent], today });
    expect(res.current).toBe(2);
    expect(res.longest).toBe(6);
  });

  it('handles a streak crossing a month boundary', () => {
    const t = '2026-07-02';
    const completions = ['2026-07-02', '2026-07-01', '2026-06-30', '2026-06-29'];
    expect(computeStreaks({ frequency: 'daily', graceDays: 1, completions, today: t }).current).toBe(4);
  });
});

describe('weekly streaks (Mon–Sun windows)', () => {
  it('counts consecutive weeks that hit the target', () => {
    const today = '2026-07-02'; // Thu of week 2026-06-29..07-05
    const completions = [
      // current week (Mon 06-29 .. today): 3 done
      '2026-06-29', '2026-06-30', '2026-07-01',
      // week 06-22..06-28: 3 done
      '2026-06-22', '2026-06-24', '2026-06-26',
      // week 06-15..06-21: 3 done
      '2026-06-15', '2026-06-17', '2026-06-19',
    ];
    expect(computeStreaks({ frequency: 'weekly:3', graceDays: 1, completions, today })).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it('an unfinished current week does not break the prior run', () => {
    const today = '2026-06-30'; // Tue of week 06-29..07-05, only 2 done so far
    const completions = [
      '2026-06-29', '2026-06-30', // current week: 2 (< target 3)
      '2026-06-22', '2026-06-24', '2026-06-26', // prior week met
    ];
    expect(computeStreaks({ frequency: 'weekly:3', graceDays: 1, completions, today }).current).toBe(1);
  });
});

describe('weekday streaks', () => {
  const today = '2026-06-26'; // Friday; schedule Mon/Wed/Fri

  it('counts only scheduled days', () => {
    const completions = ['2026-06-26', '2026-06-24', '2026-06-22', '2026-06-19', '2026-06-17', '2026-06-15'];
    expect(computeStreaks({ frequency: 'weekdays:1,3,5', graceDays: 1, completions, today }).current).toBe(6);
  });

  it('a single skipped scheduled day is bridged by grace', () => {
    // missing Wed 06-24
    const completions = ['2026-06-26', '2026-06-22', '2026-06-19', '2026-06-17', '2026-06-15'];
    expect(computeStreaks({ frequency: 'weekdays:1,3,5', graceDays: 1, completions, today }).current).toBe(5);
  });
});

describe('completion rate', () => {
  it('daily rate is completed-due / total-due', () => {
    const today = '2026-06-30';
    const completions = lastNDays(today, 7); // 7 of last 10 days done
    const rate = getCompletionRate({ frequency: 'daily', completions, days: 10, today });
    expect(rate).toBeCloseTo(0.7, 5);
  });
});

describe('ring progress + weekly count', () => {
  it('day-based ring is binary', () => {
    expect(ringProgress('daily', ['2026-06-22'], '2026-06-22')).toBe(1);
    expect(ringProgress('daily', [], '2026-06-22')).toBe(0);
  });

  it('weekly ring fills proportionally across the week', () => {
    const completions = ['2026-06-22', '2026-06-23']; // 2 done in week of ref
    expect(weeklyCount(completions, '2026-06-24')).toBe(2);
    expect(ringProgress('weekly:4', completions, '2026-06-24')).toBeCloseTo(0.5, 5);
  });
});

describe('heatmap', () => {
  it('builds a weeks x 7 grid with correct flags', () => {
    const today = '2026-06-22';
    const grid = buildHeatmap({
      frequency: 'daily',
      completions: ['2026-06-22'],
      createdAt: '2026-04-01',
      today,
      weeks: 12,
    });
    expect(grid).toHaveLength(12);
    expect(grid[0]).toHaveLength(7);
    const todayCell = grid.flat().find((c) => c.key === today)!;
    expect(todayCell.done).toBe(true);
    expect(todayCell.isToday).toBe(true);
    // a future-of-today cell should be out of range
    const future = grid.flat().find((c) => c.key > today);
    if (future) expect(future.inRange).toBe(false);
  });
});
