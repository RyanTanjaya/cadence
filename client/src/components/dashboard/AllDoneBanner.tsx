import { motion } from 'framer-motion';

interface Props {
  count: number;
  isToday: boolean;
}

export default function AllDoneBanner({ count, isToday }: Props) {
  return (
    <motion.div
      className="all-done"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <span className="all-done__icon">🎉</span>
      <div>
        <div className="all-done__title">
          {isToday ? 'Every ring closed.' : 'A perfect day.'}
        </div>
        <div className="all-done__sub">
          You completed all {count} habit{count === 1 ? '' : 's'}
          {isToday ? ' for today. Beautiful rhythm.' : ' that day. Nicely done.'}
        </div>
      </div>
    </motion.div>
  );
}
