import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Habit } from '../../types';
import {
  currentStreak,
  formatPercent,
  frequencyUnit,
  isAtPersonalBest,
  longestStreak,
  totalCompletions,
  trailingCompletionRate,
} from '../../lib/habit';
import HabitStatRow from './HabitStatRow';
import HeatmapCalendar from './HeatmapCalendar';
import PersonalRecordBadge from './PersonalRecordBadge';

interface Props {
  habit: Habit;
  defaultOpen?: boolean;
  onEdit?: (habit: Habit) => void;
}

export default function ExpandableHabitSection({ habit, defaultOpen = false, onEdit }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const current = currentStreak(habit);
  const longest = longestStreak(habit);
  const rate = trailingCompletionRate(habit);
  const total = totalCompletions(habit);
  const isPR = isAtPersonalBest(habit);
  const unit = frequencyUnit(habit) === 'wk' ? 'weeks' : 'days';

  return (
    <div
      className={`stat-section ${open ? 'stat-section--open' : ''}`}
      style={{ '--habit': habit.color } as CSSProperties}
    >
      <HabitStatRow habit={habit} expanded={open} onToggle={() => setOpen((o) => !o)} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="stat-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="stat-detail__inner">
              <div className="stat-detail__cols">
                <div className="detail-stats">
                  <div className="detail-chip">
                    <div className="detail-chip__value">
                      {current} {unit}
                    </div>
                    <div className="detail-chip__label">Current streak</div>
                  </div>
                  <div className={`detail-chip ${isPR ? 'pr-glow' : ''}`}>
                    <div className="detail-chip__value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {longest} {unit}
                      {isPR && <PersonalRecordBadge label="Now" />}
                    </div>
                    <div className="detail-chip__label">Longest ever</div>
                  </div>
                  <div className="detail-chip">
                    <div className="detail-chip__value">{formatPercent(rate)}</div>
                    <div className="detail-chip__label">Completion · 12 weeks</div>
                  </div>
                  <div className="detail-chip">
                    <div className="detail-chip__value">{total}</div>
                    <div className="detail-chip__label">Total completions</div>
                  </div>
                </div>

                <div className="stat-detail__heat">
                  <div className="stat-detail__heat-title">Last 12 weeks</div>
                  <HeatmapCalendar habit={habit} />
                </div>
              </div>

              {onEdit && (
                <div className="stat-detail__actions">
                  <button
                    type="button"
                    className="btn btn--soft"
                    onClick={() => onEdit(habit)}
                  >
                    Edit habit
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
