import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { dateKeySchema } from '../utils/validation';

const router = Router();
router.use(requireAuth);

async function ownsHabit(habitId: string, userId: string | undefined): Promise<boolean> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  return Boolean(habit);
}

// POST /api/habits/:id/completions/:date  → mark complete (idempotent upsert)
router.post('/:id/completions/:date', async (req, res, next) => {
  try {
    const date = dateKeySchema.safeParse(req.params.date);
    if (!date.success) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' });
      return;
    }
    if (!(await ownsHabit(req.params.id, req.userId))) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    await prisma.completion.upsert({
      where: { habitId_date: { habitId: req.params.id, date: date.data } },
      create: { habitId: req.params.id, date: date.data },
      update: {},
    });
    res.status(200).json({ habitId: req.params.id, date: date.data, done: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id/completions/:date  → mark incomplete
router.delete('/:id/completions/:date', async (req, res, next) => {
  try {
    const date = dateKeySchema.safeParse(req.params.date);
    if (!date.success) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' });
      return;
    }
    if (!(await ownsHabit(req.params.id, req.userId))) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    await prisma.completion.deleteMany({
      where: { habitId: req.params.id, date: date.data },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
