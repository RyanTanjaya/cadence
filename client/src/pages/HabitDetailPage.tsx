import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import AddHabitDialog from '../components/dialog/AddHabitDialog';
import HeatmapCalendar from '../components/progress/HeatmapCalendar';
import PersonalRecordBadge from '../components/progress/PersonalRecordBadge';
import { Button } from '../components/ui/button';
import { ChevronLeft } from '../components/icons';
import { useDeleteHabit, useHabits, useUpdateHabit } from '../hooks/useHabits';
import { frequencyLabel } from '../lib/frequency';
import {
  currentStreak,
  formatPercent,
  frequencyUnit,
  isAtPersonalBest,
  longestStreak,
  totalCompletions,
  trailingCompletionRate,
} from '../lib/habit';

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useHabits();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const habit = (data ?? []).find((h) => h.id === id);

  if (isLoading) {
    return (
      <div className="page grid place-items-center" style={{ minHeight: '50vh' }}>
        <Loader2 className="animate-spin text-ink-3" size={28} />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__emoji" style={{ fontSize: '2.4rem' }}>🤔</div>
          <h2 className="empty__title" style={{ fontSize: '1.4rem', marginTop: 12 }}>
            Habit not found
          </h2>
          <Link to="/progress" className="btn btn--soft" style={{ marginTop: 16 }}>
            Back to Progress
          </Link>
        </div>
      </div>
    );
  }

  const current = currentStreak(habit);
  const longest = longestStreak(habit);
  const rate = trailingCompletionRate(habit);
  const unit = frequencyUnit(habit) === 'wk' ? 'weeks' : 'days';
  const isPR = isAtPersonalBest(habit);

  return (
    <div className="page" style={{ '--habit': habit.color } as CSSProperties}>
      <Link
        to="/progress"
        className="icon-btn"
        style={{ marginBottom: 8, width: 'auto', padding: '0 12px 0 6px', gap: 6 }}
      >
        <ChevronLeft size={18} /> Progress
      </Link>

      <header className="page__header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="stat-row__emoji" style={{ width: 60, height: 60, fontSize: '1.8rem' }}>
          {habit.emoji}
        </span>
        <div>
          <h1 className="page__title" style={{ fontSize: '2rem' }}>{habit.name}</h1>
          <p className="page__subtitle">{frequencyLabel(habit.frequency)}</p>
        </div>
      </header>

      <div className="detail-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 24 }}>
        <div className={`detail-chip ${isPR ? 'pr-glow' : ''}`}>
          <div className="detail-chip__value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {current} {unit}
            {isPR && <PersonalRecordBadge label="PR" />}
          </div>
          <div className="detail-chip__label">Current streak</div>
        </div>
        <div className="detail-chip">
          <div className="detail-chip__value">{longest} {unit}</div>
          <div className="detail-chip__label">Longest ever</div>
        </div>
        <div className="detail-chip">
          <div className="detail-chip__value">{formatPercent(rate)}</div>
          <div className="detail-chip__label">Completion · 12 weeks</div>
        </div>
        <div className="detail-chip">
          <div className="detail-chip__value">{totalCompletions(habit)}</div>
          <div className="detail-chip__label">Total completions</div>
        </div>
      </div>

      <div className="section-label">
        <span className="section-label__title">Last 12 weeks</span>
      </div>
      <div className="settings-card" style={{ padding: 20, marginBottom: 24 }}>
        <HeatmapCalendar habit={habit} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit habit
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            updateHabit.mutate({ id: habit.id, patch: { isArchived: !habit.isArchived } })
          }
        >
          {habit.isArchived ? 'Unarchive' : 'Archive'}
        </Button>
      </div>

      <AnimatePresence>
        {editing && (
          <AddHabitDialog
            habit={habit}
            onClose={() => setEditing(false)}
            onSave={(draft) => {
              updateHabit.mutate({ id: habit.id, patch: { ...draft } });
              setEditing(false);
            }}
            onDelete={(hid) => {
              deleteHabit.mutate(hid);
              setEditing(false);
              navigate('/progress', { replace: true });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
