import { Router } from 'express';
import type { Habit } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { seedDemoHabits } from '../utils/demoSeed';
import { createHabitSchema, reorderSchema, updateHabitSchema } from '../utils/validation';

const router = Router();
router.use(requireAuth);

type HabitWithCompletions = Habit & { completions: { date: string }[] };

function serialize(habit: HabitWithCompletions) {
  return {
    id: habit.id,
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color,
    frequency: habit.frequency,
    graceDays: habit.graceDays,
    sortOrder: habit.sortOrder,
    isArchived: habit.isArchived,
    createdAt: habit.createdAt.toISOString().slice(0, 10),
    completions: habit.completions.map((c) => c.date).sort(),
  };
}

const withCompletions = { completions: { select: { date: true } } } as const;

// GET /api/habits
router.get('/', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: withCompletions,
    });
    res.json(habits.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/:id
router.get('/:id', async (req, res, next) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: withCompletions,
    });
    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.json(serialize(habit));
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
router.post('/', async (req, res, next) => {
  try {
    const parsed = createHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    const count = await prisma.habit.count({ where: { userId: req.userId } });
    const habit = await prisma.habit.create({
      data: { ...parsed.data, userId: req.userId!, sortOrder: count },
      include: withCompletions,
    });
    res.status(201).json(serialize(habit));
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/demo  → replace the user's habits with the demo set
router.post('/demo', async (req, res, next) => {
  try {
    const count = await seedDemoHabits(prisma, req.userId!);
    res.status(201).json({ seeded: count });
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/reorder  { order: [habitId, ...] }
router.post('/reorder', async (req, res, next) => {
  try {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid order payload' });
      return;
    }
    const owned = await prisma.habit.findMany({
      where: { userId: req.userId, id: { in: parsed.data.order } },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((h) => h.id));
    await prisma.$transaction(
      parsed.data.order
        .filter((id) => ownedIds.has(id))
        .map((id, index) =>
          prisma.habit.update({ where: { id }, data: { sortOrder: index } }),
        ),
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/:id
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    const existing = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    const habit = await prisma.habit.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: withCompletions,
    });
    res.json(serialize(habit));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.habit.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
