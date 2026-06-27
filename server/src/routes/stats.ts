import { Router } from 'express';
import { format } from 'date-fns';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { computeStreaks, getCompletionRate } from '../utils/streakLogic';

const router = Router();
router.use(requireAuth);

// GET /api/stats?today=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const today =
      typeof req.query.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.today)
        ? req.query.today
        : format(new Date(), 'yyyy-MM-dd');

    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isArchived: false },
      include: { completions: { select: { date: true } } },
    });

    let longestCurrent = 0;
    let rateSum = 0;

    const perHabit = habits.map((habit) => {
      const completions = habit.completions.map((c) => c.date);
      const createdAt = habit.createdAt.toISOString().slice(0, 10);
      const { current, longest } = computeStreaks({
        frequency: habit.frequency,
        graceDays: habit.graceDays,
        completions,
        today,
        createdAt,
      });
      const completionRate = getCompletionRate({
        frequency: habit.frequency,
        completions,
        days: 30,
        today,
        createdAt,
      });
      longestCurrent = Math.max(longestCurrent, current);
      rateSum += completionRate;
      return {
        habitId: habit.id,
        currentStreak: current,
        longestStreak: longest,
        completionRate,
      };
    });

    res.json({
      today,
      overall: {
        activeHabits: habits.length,
        monthRate: habits.length ? rateSum / habits.length : 0,
        longestCurrentStreak: longestCurrent,
      },
      habits: perHabit,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
