import { motion } from 'framer-motion';
import { addDays, format, isSameDay, subDays, today } from '../../lib/date';
import { ChevronLeft, ChevronRight } from '../icons';

interface Props {
  date: Date;
  onChange: (date: Date) => void;
}

function relativeLabel(date: Date): string {
  const now = today();
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, subDays(now, 1))) return 'Yesterday';
  if (isSameDay(date, addDays(now, 1))) return 'Tomorrow';
  return format(date, 'EEEE');
}

export default function DateNavigator({ date, onChange }: Props) {
  const isToday = isSameDay(date, today());

  return (
    <div className="date-nav">
      <button
        type="button"
        className="icon-btn"
        onClick={() => onChange(subDays(date, 1))}
        aria-label="Previous day"
      >
        <ChevronLeft />
      </button>

      <motion.div
        className="date-nav__center"
        key={date.toISOString()}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="date-nav__weekday">{relativeLabel(date)}</div>
        <div className="date-nav__date">{format(date, 'MMMM d, yyyy')}</div>
        {!isToday && (
          <button type="button" className="date-nav__today" onClick={() => onChange(today())}>
            Jump to today
          </button>
        )}
      </motion.div>

      <button
        type="button"
        className="icon-btn"
        onClick={() => onChange(addDays(date, 1))}
        aria-label="Next day"
        disabled={isToday}
        style={{ opacity: isToday ? 0.32 : 1, pointerEvents: isToday ? 'none' : 'auto' }}
      >
        <ChevronRight />
      </button>
    </div>
  );
}
