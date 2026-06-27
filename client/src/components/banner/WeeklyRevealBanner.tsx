import { motion } from 'framer-motion';
import type { WeeklyReveal } from '../../lib/habit';
import { formatPercent } from '../../lib/habit';
import { parseFrequency } from '../../lib/streakLogic';
import { format } from '../../lib/date';
import { Trophy, X } from '../icons';

interface Props {
  reveal: WeeklyReveal;
  onDismiss: () => void;
}

function WeekDateRange({ start, end }: { start: Date; end: Date }) {
  const sameMonth = start.getMonth() === end.getMonth();
  const text = sameMonth
    ? `${format(start, 'MMMM d')} – ${format(end, 'd, yyyy')}`
    : `${format(start, 'MMMM d')} – ${format(end, 'MMMM d, yyyy')}`;
  return <div className="reveal__range">{text}</div>;
}

export default function WeeklyRevealBanner({ reveal, onDismiss }: Props) {
  const { completed, possible, rate, bestDayLabel, bestDayCount, records } = reveal;

  return (
    <motion.div
      className="reveal"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <div className="reveal__head">
        <div>
          <div className="eyebrow">✦ Your week in review</div>
          <WeekDateRange start={reveal.start} end={reveal.end} />
        </div>
        <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Dismiss recap">
          <X />
        </button>
      </div>

      <div className="reveal__grid">
        <div className="reveal__stat">
          <div className="reveal__stat-num">{formatPercent(rate)}</div>
          <div className="reveal__stat-label">
            {completed} of {possible} possible completions
          </div>
          <div className="reveal__bar">
            <motion.div
              className="reveal__bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(rate * 100)}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </div>
        </div>

        <div className="reveal__stat">
          <div className="reveal__stat-num">{completed}</div>
          <div className="reveal__stat-label">habits completed</div>
        </div>

        <div className="reveal__stat">
          <div className="reveal__stat-num" style={{ fontSize: '1.5rem' }}>
            {bestDayLabel ?? '—'}
          </div>
          <div className="reveal__stat-label">
            {bestDayLabel ? `Best day · ${bestDayCount} done` : 'No completions yet'}
          </div>
        </div>
      </div>

      {records.length > 0 && (
        <div className="reveal__records">
          <div className="reveal__records-title">🏆 New personal records this week</div>
          {records.map(({ habit, length }) => (
            <div className="reveal__record" key={habit.id}>
              <span className="reveal__record-emoji">{habit.emoji}</span>
              <span className="reveal__record-name">{habit.name}</span>
              <span className="reveal__record-meta">
                <Trophy size={15} />
                {length}{' '}
                {parseFrequency(habit.frequency).kind === 'weekly' ? 'week' : 'day'} streak
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
