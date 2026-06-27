import type { Habit } from '../../types';
import { frequencyTagline } from '../../lib/frequency';
import {
  currentStreak,
  formatPercent,
  frequencyUnit,
  isAtPersonalBest,
  longestStreak,
  trailingCompletionRate,
} from '../../lib/habit';
import { ChevronDown } from '../icons';
import PersonalRecordBadge from './PersonalRecordBadge';

interface Props {
  habit: Habit;
  expanded: boolean;
  onToggle: () => void;
}

export default function HabitStatRow({ habit, expanded, onToggle }: Props) {
  const current = currentStreak(habit);
  const longest = longestStreak(habit);
  const rate = trailingCompletionRate(habit);
  const isPR = isAtPersonalBest(habit);
  const unit = frequencyUnit(habit);

  return (
    <button
      type="button"
      className="stat-row"
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span className="stat-row__emoji">{habit.emoji}</span>

      <span className="stat-row__lead">
        <span className="stat-row__name">
          {habit.name}
          {isPR && <PersonalRecordBadge />}
        </span>
        <span className="stat-row__freq">{frequencyTagline(habit.frequency)}</span>
      </span>

      <span className="stat-row__metrics">
        <span className={`stat-metric ${isPR ? 'pr-glow' : ''}`}>
          <span className="stat-metric__value">
            {current}
            <span className="stat-metric__unit">{unit}</span>
          </span>
          <span className="stat-metric__label">Current</span>
        </span>

        <span className="stat-metric stat-metric--longest">
          <span className="stat-metric__value">
            {longest}
            <span className="stat-metric__unit">{unit}</span>
          </span>
          <span className="stat-metric__label">Best ever</span>
        </span>

        <span className="stat-metric">
          <span className="stat-metric__value">{formatPercent(rate)}</span>
          <span className="stat-metric__label">12-wk&nbsp;rate</span>
        </span>
      </span>

      <span className="stat-row__chevron">
        <ChevronDown size={20} />
      </span>
    </button>
  );
}
