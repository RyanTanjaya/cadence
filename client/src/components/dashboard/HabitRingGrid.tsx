import { motion } from 'framer-motion';
import type { Habit } from '../../types';
import HabitCard from './HabitCard';

interface Props {
  habits: Habit[];
  date: Date;
  onToggle: (id: string) => void;
}

export default function HabitRingGrid({ habits, date, onToggle }: Props) {
  return (
    <motion.div className="ring-grid" layout>
      {habits.map((habit, i) => (
        <motion.div
          key={habit.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.045, 0.4), ease: [0.22, 1, 0.36, 1] }}
        >
          <HabitCard habit={habit} date={date} onToggle={() => onToggle(habit.id)} />
        </motion.div>
      ))}
    </motion.div>
  );
}
