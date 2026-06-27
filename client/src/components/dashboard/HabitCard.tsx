import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { Habit } from '../../types';
import { frequencyTagline } from '../../lib/frequency';
import { currentStreak, isCompleted, ringProgress, weeklyCount } from '../../lib/habit';
import { parseFrequency } from '../../lib/streakLogic';
import { Check } from '../icons';
import CompletionRing from './CompletionRing';
import StreakBadge from './StreakBadge';

interface Props {
  habit: Habit;
  date: Date;
  onToggle: () => void;
}

export default function HabitCard({ habit, date, onToggle }: Props) {
  const doneToday = isCompleted(habit, date);
  const progress = ringProgress(habit, date);
  const streak = currentStreak(habit, date);
  const parsed = parseFrequency(habit.frequency);
  const isWeekly = parsed.kind === 'weekly';
  const weekDone = isWeekly ? weeklyCount(habit, date) : 0;
  const target = isWeekly ? parsed.target : 1;

  return (
    <motion.button
      type="button"
      className={`habit-card ${doneToday ? 'habit-card--done' : ''}`}
      style={{ '--habit': habit.color } as CSSProperties}
      onClick={onToggle}
      aria-pressed={doneToday}
      aria-label={`${habit.name}, ${doneToday ? 'completed' : 'not completed'}. Tap to toggle.`}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      layout
    >
      <AnimatePresence>
        {doneToday && (
          <motion.span
            className="habit-card__check"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 22 }}
          >
            <Check size={13} />
          </motion.span>
        )}
      </AnimatePresence>

      <div className="habit-card__ringwrap">
        <CompletionRing progress={progress} />
        <motion.span
          className="habit-card__emoji"
          key={doneToday ? 'done' : 'idle'}
          animate={doneToday ? { scale: [1, 1.28, 0.9] } : { scale: 1 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
        >
          {habit.emoji}
        </motion.span>
      </div>

      <span className="habit-card__name">{habit.name}</span>
      <span className="habit-card__freq">
        {isWeekly ? `${weekDone}/${target} this week` : frequencyTagline(habit.frequency)}
      </span>

      <StreakBadge streak={streak} />
    </motion.button>
  );
}
