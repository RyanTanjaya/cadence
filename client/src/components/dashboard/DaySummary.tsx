import { motion } from 'framer-motion';
import type { Habit } from '../../types';
import { currentStreak, isCompleted } from '../../lib/habit';

interface Props {
  /** The habits due on the selected day. */
  habits: Habit[];
  date: Date;
  isToday: boolean;
}

export default function DaySummary({ habits, date, isToday }: Props) {
  const total = habits.length;
  const done = habits.filter((h) => isCompleted(h, date)).length;
  const remaining = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(h, date)), 0);

  return (
    <motion.section
      className="day-summary"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="day-summary__top">
        <div>
          <div className="day-summary__label">{isToday ? "Today's progress" : 'Day progress'}</div>
          <div className="day-summary__count">
            <b>{done}</b> of {total} habit{total === 1 ? '' : 's'} closed
          </div>
        </div>
        <div className="day-summary__pct">{pct}%</div>
      </div>

      <div className="day-summary__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="day-summary__fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="day-summary__chips">
        <span>✅ {done} done</span>
        <span>⭕ {remaining} left</span>
        {bestStreak > 0 && <span>🔥 {bestStreak}-day top streak</span>}
      </div>
    </motion.section>
  );
}
