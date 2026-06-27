import type { PrismaClient } from '@prisma/client';
import { addDays, format, getDay, subDays } from 'date-fns';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (d: Date) => format(d, 'yyyy-MM-dd');
const HISTORY = 100;

interface SeedHabit {
  name: string;
  emoji: string;
  color: string;
  frequency: string;
  adherence: number;
  recent: number;
}

const SEEDS: SeedHabit[] = [
  { name: 'Meditate', emoji: '🧘', color: '#7c5cfc', frequency: 'daily', adherence: 0.86, recent: 12 },
  { name: 'Morning run', emoji: '🏃', color: '#ff6b6b', frequency: 'weekly:4', adherence: 0.82, recent: 0 },
  { name: 'Read a chapter', emoji: '📚', color: '#2a9d8f', frequency: 'daily', adherence: 0.74, recent: 5 },
  { name: 'Practice guitar', emoji: '🎸', color: '#f4a261', frequency: 'weekdays:1,2,3,4,5', adherence: 0.68, recent: 0 },
  { name: 'Drink water', emoji: '💧', color: '#4d7cfe', frequency: 'daily', adherence: 0.93, recent: 8 },
];

function generate(cfg: SeedHabit, start: Date, today: Date, rng: () => number): string[] {
  const done = new Set<string>();

  if (cfg.frequency.startsWith('weekly:')) {
    const target = parseInt(cfg.frequency.slice(7), 10);
    for (let w = 0; w * 7 < HISTORY; w++) {
      const weekStart = addDays(start, w * 7);
      const jitter = rng() < 0.35 ? (rng() < 0.5 ? -1 : 1) : 0;
      const count = Math.max(0, Math.min(7, Math.round(target * cfg.adherence) + jitter));
      const offsets = [0, 1, 2, 3, 4, 5, 6].sort(() => rng() - 0.5).slice(0, count);
      for (const off of offsets) {
        const d = addDays(weekStart, off);
        if (d <= today) done.add(key(d));
      }
    }
  } else {
    const weekdays = cfg.frequency.startsWith('weekdays:')
      ? cfg.frequency.slice('weekdays:'.length).split(',').map(Number)
      : null;
    for (let i = 0; i < HISTORY; i++) {
      const d = addDays(start, i);
      const due = !weekdays || weekdays.includes(getDay(d));
      if (due && rng() < cfg.adherence) done.add(key(d));
    }
  }

  if (cfg.recent > 0) {
    const weekdays = cfg.frequency.startsWith('weekdays:')
      ? cfg.frequency.slice('weekdays:'.length).split(',').map(Number)
      : null;
    let filled = 0;
    let cursor = today;
    let guard = 0;
    while (filled < cfg.recent && guard++ < 60) {
      const due = !weekdays || weekdays.includes(getDay(cursor));
      if (due) {
        done.add(key(cursor));
        filled++;
      }
      cursor = subDays(cursor, 1);
    }
  }

  return [...done];
}

/** Replace the user's habits with the 5 demo habits + ~100 days of history. */
export async function seedDemoHabits(prisma: PrismaClient, userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = subDays(today, HISTORY - 1);
  const rng = mulberry32(20260622);

  await prisma.habit.deleteMany({ where: { userId } });

  for (let i = 0; i < SEEDS.length; i++) {
    const cfg = SEEDS[i];
    const dates = generate(cfg, start, today, rng);
    await prisma.habit.create({
      data: {
        userId,
        name: cfg.name,
        emoji: cfg.emoji,
        color: cfg.color,
        frequency: cfg.frequency,
        sortOrder: i,
        createdAt: start,
        completions: { create: dates.map((date) => ({ date })) },
      },
    });
  }

  return SEEDS.length;
}
