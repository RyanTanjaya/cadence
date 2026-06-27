import { motion } from 'framer-motion';
import type { Habit } from '../../types';
import { formatPercent, overallStats } from '../../lib/habit';

interface Props {
  habits: Habit[];
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const cardMotion = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, ease: EASE },
});

export default function OverallStatsSummary({ habits }: Props) {
  const stats = overallStats(habits);

  return (
    <div className="overall">
      <motion.div className="overall__card" {...cardMotion(0)}>
        <div className="overall__icon">🌿</div>
        <div className="overall__value">{stats.totalActive}</div>
        <div className="overall__label">Active habits</div>
      </motion.div>

      <motion.div className="overall__card" {...cardMotion(1)}>
        <div className="overall__icon">📈</div>
        <div className="overall__value">{formatPercent(stats.monthRate)}</div>
        <div className="overall__label">Completion rate this month</div>
      </motion.div>

      <motion.div className="overall__card" {...cardMotion(2)}>
        <div className="overall__icon">🔥</div>
        <div className="overall__value">
          {stats.longestCurrentStreak}
          <span className="overall__value-sub">
            {stats.longestCurrentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="overall__label">
          {stats.longestCurrentStreakHabit
            ? `Longest streak · ${stats.longestCurrentStreakHabit.emoji} ${stats.longestCurrentStreakHabit.name}`
            : 'Longest current streak'}
        </div>
      </motion.div>
    </div>
  );
}
