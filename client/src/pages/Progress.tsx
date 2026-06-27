import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Habit } from '../types';
import ExpandableHabitSection from '../components/progress/ExpandableHabitSection';
import OverallStatsSummary from '../components/progress/OverallStatsSummary';
import WeeklyBarChart from '../components/progress/WeeklyBarChart';
import AddHabitDialog from '../components/dialog/AddHabitDialog';
import { useDeleteHabit, useHabits, useUpdateHabit } from '../hooks/useHabits';

export default function Progress() {
  const { data, isLoading } = useHabits();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const active = (data ?? []).filter((h) => !h.isArchived);
  const [editing, setEditing] = useState<Habit | null>(null);

  return (
    <div className="page">
      <header className="page__header">
        <div className="eyebrow">Progress</div>
        <h1 className="page__title">Your momentum</h1>
        <p className="page__subtitle">Streaks, records, and twelve weeks of history.</p>
      </header>

      {isLoading ? (
        <div className="grid place-items-center" style={{ minHeight: '40vh' }}>
          <Loader2 className="animate-spin text-ink-3" size={28} />
        </div>
      ) : active.length === 0 ? (
        <div className="empty">
          <div className="empty__emoji" style={{ fontSize: '2.4rem' }}>📊</div>
          <h2 className="empty__title" style={{ fontSize: '1.4rem', marginTop: 12 }}>
            No data yet
          </h2>
          <p className="empty__text">
            Add a habit from the Today screen and your stats will bloom here.
          </p>
        </div>
      ) : (
        <>
          <OverallStatsSummary habits={active} />

          <div className="section-label">
            <span className="section-label__title">Daily completions</span>
            <span className="muted" style={{ fontSize: '0.84rem' }}>Last 4 weeks</span>
          </div>
          <div style={{ marginBottom: 26 }}>
            <WeeklyBarChart habits={active} />
          </div>

          <div className="section-label">
            <span className="section-label__title">Every habit</span>
            <span className="muted" style={{ fontSize: '0.84rem' }}>Tap to expand</span>
          </div>

          <div className="stat-list">
            {active.map((habit, i) => (
              <ExpandableHabitSection
                key={habit.id}
                habit={habit}
                defaultOpen={i === 0}
                onEdit={setEditing}
              />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {editing && (
          <AddHabitDialog
            habit={editing}
            onClose={() => setEditing(null)}
            onSave={(draft) => {
              updateHabit.mutate({
                id: editing.id,
                patch: {
                  name: draft.name,
                  emoji: draft.emoji,
                  color: draft.color,
                  frequency: draft.frequency,
                  graceDays: draft.graceDays,
                },
              });
              setEditing(null);
            }}
            onDelete={(id) => {
              deleteHabit.mutate(id);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
